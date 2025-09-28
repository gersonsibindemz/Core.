import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { translateWithResearch } from './services/geminiService';
import { createVoiceSession } from './services/geminiLiveService';
import { TranslationResponse, VoiceSessionCallbacks, ApiConnectionLog } from './types';
import { LANGUAGES } from './constants';
import ApiLogPage from './pages/ApiLogPage';
import ApiDocsPage from './pages/ApiDocsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { rateLimiter, TEXT_TRANSLATION_COST, VOICE_SESSION_COST } from './services/rateLimiter';

// --- Same-Origin API Definition (for scripts on the same page) ---

interface TranslateApiParams {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface VoiceSessionParams {
  sourceLanguage: string;
  targetLanguage: string;
  callbacks: VoiceSessionCallbacks;
}

function validateLanguages(sourceLanguage: string, targetLanguage:string) {
  const validLanguages = LANGUAGES.map(lang => lang.value);
  if (!validLanguages.includes(sourceLanguage)) {
    throw new Error(`Invalid source language: '${sourceLanguage}'. Supported languages are: ${validLanguages.join(', ')}`);
  }
  if (!validLanguages.includes(targetLanguage)) {
    throw new Error(`Invalid target language: '${targetLanguage}'. Supported languages are: ${validLanguages.join(', ')}`);
  }
}

async function requestTextTranslation(params: TranslateApiParams): Promise<TranslationResponse> {
  const { text, sourceLanguage, targetLanguage } = params;
  if (!text || !sourceLanguage || !targetLanguage) throw new Error('Missing required parameters.');
  validateLanguages(sourceLanguage, targetLanguage);
  return translateWithResearch(text, sourceLanguage, targetLanguage);
}

async function startVoiceSession(params: VoiceSessionParams) {
    const { sourceLanguage, targetLanguage, callbacks } = params;
    if (!sourceLanguage || !targetLanguage || !callbacks) throw new Error('Missing required parameters.');
    validateLanguages(sourceLanguage, targetLanguage);
    return createVoiceSession(sourceLanguage, targetLanguage, callbacks);
}

declare global {
  interface Window {
    longaniCoreAPI: {
      translate: (params: TranslateApiParams) => Promise<TranslationResponse>;
      startVoiceSession: (params: VoiceSessionParams) => Promise<{ stop: () => void }>;
    };
  }
}

window.longaniCoreAPI = {
  translate: requestTextTranslation,
  startVoiceSession: startVoiceSession,
};

// --- Cross-Origin API (postMessage) for External Websites ---

let activeVoiceSession: { stop: () => void; sessionId: string; } | null = null;
const ORIGIN_STORAGE_KEY = 'longanicore-origins';
const GLOBAL_KEYS_STORAGE_KEY = 'longanicore-global-keys';
const API_ENABLED_KEY = 'longanicore-api-enabled';

/**
 * Dispatches a custom event to log API connection attempts to the UI.
 * @param logData Partial data for the log entry.
 */
function logApiAttempt(logData: Omit<ApiConnectionLog, 'id' | 'timestamp'>) {
    const finalLog: ApiConnectionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      ...logData
    };
    window.dispatchEvent(new CustomEvent('api-connection-attempt', { detail: finalLog }));
  }
  

window.addEventListener('message', async (event) => {
  // This listener is the entry point for all external websites.
  // The following checks form a security pipeline to validate requests.

  const { source, type, payload, requestId, sessionId, apiKey, globalApiKey } = event.data;
  const { origin } = event;

  // STEP 0: Intent Check
  // Ignore messages not intended for this API to avoid processing unrelated postMessage events.
  if (source !== 'longanicore-api-client') {
    return;
  }
  
  // STEP 1: Master API Switch
  // Check if the API is globally enabled by the owner before processing any request.
  let isApiEnabled = true; // Default to true if storage is inaccessible
  try {
    isApiEnabled = localStorage.getItem(API_ENABLED_KEY) !== 'false';
  } catch (e) {
    console.error("Could not access localStorage to check API status.", e);
  }

  if (!isApiEnabled) {
    // Silently ignore messages if the API is disabled.
    return;
  }
  
  // Helper to send responses back to the source window.
  const postResponse = (type: string, payload: any) => {
    event.source?.postMessage({
      source: 'longanicore-api',
      type,
      payload,
      requestId, // Echo back the requestId for correlation
      sessionId,
    }, { targetOrigin: event.origin });
  };

  // --- STEP 2: AUTHENTICATION ---
  let isAuthenticated = false;
  let authMethod = '';

  // METHOD 1: Global API Key (Highest Priority)
  if (globalApiKey) {
      let validGlobalKeys: string[] = [];
      try {
          const keysStr = localStorage.getItem(GLOBAL_KEYS_STORAGE_KEY);
          validGlobalKeys = keysStr ? JSON.parse(keysStr) : [];
      } catch (e) {
          console.error("Could not access localStorage for global keys.", e);
          logApiAttempt({ origin, status: 'Failure', reason: 'Internal Error: Could not read global key list.' });
          return;
      }

      if (validGlobalKeys.includes(globalApiKey)) {
          isAuthenticated = true;
          authMethod = 'Global API Key';
      }
  }

  // METHOD 2: Origin-Specific API Key (Fallback)
  if (!isAuthenticated) {
      let originConfig: Record<string, string> = {};
      try {
          const originConfigStr = localStorage.getItem(ORIGIN_STORAGE_KEY);
          originConfig = originConfigStr ? JSON.parse(originConfigStr) : {};
      } catch (e) {
          console.error("Could not access localStorage for origin configuration.", e);
          logApiAttempt({ origin, status: 'Failure', reason: 'Internal Error: Could not read origin list.' });
          return;
      }
      const expectedApiKey = originConfig[event.origin];
      
      if (expectedApiKey && apiKey === expectedApiKey) {
          isAuthenticated = true;
          authMethod = 'Origin-Specific Key';
      }
  }
  
  if (!isAuthenticated) {
      const reason = 'Invalid credentials. Please check your API key and ensure your origin is whitelisted if not using a global key.';
      logApiAttempt({ origin, status: 'Failure', reason: 'Invalid Credentials' });
      console.warn(`LonganiCore: Discarding message with invalid credentials from origin: ${event.origin}.`);
      postResponse(`${type}-error`, { message: reason });
      return;
  }


  // STEP 3: Rate Limiting
  // Prevent abuse by applying a token-bucket rate limit to resource-intensive operations.
  if (type === 'text-translation' || type === 'start-voice-session') {
      const cost = type === 'start-voice-session' ? VOICE_SESSION_COST : TEXT_TRANSLATION_COST;
      const limitCheck = rateLimiter.check(event.origin, cost);
      if (!limitCheck.allowed) {
          const reason = `Rate Limit Exceeded. Try again in ${limitCheck.retryAfter}s.`;
          logApiAttempt({ origin, status: 'Failure', reason });
          postResponse(`${type}-error`, { message: reason, retryAfter: limitCheck.retryAfter });
          return;
      }
  }

  // --- All checks passed. Log successful attempt and process request. ---
  logApiAttempt({ origin, status: 'Success', reason: `Authenticated via ${authMethod}. Request Type: ${type}` });

  try {
    switch (type) {
      case 'text-translation':
        const result = await requestTextTranslation(payload);
        postResponse('text-translation-result', result);
        break;
      
      case 'start-voice-session':
        if (activeVoiceSession) {
          throw new Error('A voice session is already active. Stop the current session before starting a new one.');
        }
        
        const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const postVoiceEvent = (eventType: string, eventPayload: any) => {
            event.source?.postMessage({
                source: 'longanicore-api',
                type: eventType,
                payload: eventPayload,
                sessionId: newSessionId,
            }, { targetOrigin: event.origin });
        };

        const callbacks: VoiceSessionCallbacks = {
          onStateChange: (state) => postVoiceEvent('voice-session-state-change', { state }),
          onTranscriptionUpdate: (data) => postVoiceEvent('voice-session-transcription', data),
          onError: (error) => postVoiceEvent('voice-session-error', { message: error.message }),
        };

        const session = await startVoiceSession({ ...payload, callbacks });
        activeVoiceSession = { stop: () => {
          session.stop();
          activeVoiceSession = null; // Clear the session on stop
           postVoiceEvent('voice-session-closed', {});
        }, sessionId: newSessionId };

        postResponse('voice-session-started', { sessionId: newSessionId });
        break;
        
      case 'stop-voice-session':
        if (activeVoiceSession && activeVoiceSession.sessionId === payload.sessionId) {
            activeVoiceSession.stop();
        } else if (payload.sessionId) {
            throw new Error(`No active voice session found with ID: ${payload.sessionId}`);
        } else {
            throw new Error('No active voice session to stop.');
        }
        break;

      default:
        throw new Error(`Unknown API request type: '${type}'`);
    }
  } catch (error: any) {
    console.error(`LonganiCore API Error (Request ID: ${requestId}):`, error);
    postResponse(`${type}-error`, { message: error.message || 'An internal error occurred.' });
  }
});


console.info('LonganiCore is ready to receive API requests via postMessage.');

// --- App Router ---

const Router: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [apiLogs, setApiLogs] = useState<ApiConnectionLog[]>([]);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);

    const handleApiAttempt = (event: Event) => {
      const log = (event as CustomEvent<ApiConnectionLog>).detail;
      setApiLogs(prevLogs => [log, ...prevLogs].slice(0, 100)); // Keep the last 100 logs
    };
    window.addEventListener('api-connection-attempt', handleApiAttempt);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('api-connection-attempt', handleApiAttempt);
    };
  }, []);

  switch (route) {
    case '#log':
      return <ApiLogPage logs={apiLogs} />;
    case '#docs':
      return <ApiDocsPage />;
    case '#about':
      return <AboutPage />;
    case '#contact':
      return <ContactPage />;
    default:
      return <App />;
  }
};


// --- Mount React App ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
