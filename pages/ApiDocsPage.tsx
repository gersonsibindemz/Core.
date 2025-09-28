import React, { useState, useEffect } from 'react';
import CodeBlock from '../components/CodeBlock';
import CopyButton from '../components/CopyButton';
import ToggleSwitch from '../components/ToggleSwitch';
import ApiDropdown from '../components/ApiDropdown';

const ORIGIN_STORAGE_KEY = 'longanicore-origins';
const GLOBAL_KEYS_STORAGE_KEY = 'longanicore-global-keys';
const API_ENABLED_KEY = 'longanicore-api-enabled';

const getCodeExamples = (origin: string) => {
  const htmlExample = `
<!-- In your website's HTML, embed the app in an iframe -->
<!-- The 'allow="microphone"' attribute is required for voice translation -->
<iframe
  id="longanicore-iframe"
  src="${origin}"
  style="width:0; height:0; border:0; position:absolute;"
  allow="microphone"
></iframe>
`;

  const jsExample = `
// =================================================================
//  LonganiCore API Client - Full Example
// =================================================================

// --- 1. CONFIGURATION ---
// IMPORTANT: You should use ONE of the following authentication methods.

// OPTION A: Origin-Specific Key (Recommended for web clients)
// In the LonganiCore app, whitelist your website's origin (e.g., "https://www.your-site.com")
// under "Step 2a" and paste the generated API key here.
const LONGANICORE_API_KEY = "PASTE_YOUR_ORIGIN_SPECIFIC_KEY_HERE";

// OPTION B: Global API Key (Use with caution, e.g., for server-side use)
// This key works from ANY origin. Keep it absolutely secret.
// Generate this in the "Step 2b: Global API Keys" section.
const LONGANICORE_GLOBAL_API_KEY = ""; // PASTE_YOUR_GLOBAL_KEY_HERE

// This is the origin of the LonganiCore app itself.
const LONGANICORE_ORIGIN = "${origin}";

// Get a reference to the embedded iframe's content window.
const iframe = document.getElementById('longanicore-iframe');
const translatorFrame = iframe.contentWindow;


// --- 2. API COMMUNICATION HELPER ---
// This function wraps the postMessage logic in a Promise
// to make API calls feel like regular async functions.
function callLonganiApi(type, payload = {}) {
  return new Promise((resolve, reject) => {
    // A unique ID to match requests with responses.
    const requestId = \`req-\${Date.now()}-\${Math.random()}\`;

    const handleResponse = (event) => {
      // Security: Only accept messages from the app's origin.
      if (event.origin !== LONGANICORE_ORIGIN) return;
      
      const { source, requestId: responseId, type: responseType, payload: responsePayload } = event.data;

      // Make sure this response is for our specific request.
      if (responseId !== requestId) return;

      // Clean up the listener so we don't handle this message again.
      window.removeEventListener('message', handleResponse);

      // Handle API errors.
      if (responseType.endsWith('-error')) {
        console.error('LonganiCore API Error:', responsePayload.message);
        reject(new Error(responsePayload.message));
      } else {
        // Resolve the promise with the successful response payload.
        resolve(responsePayload);
      }
    };

    // Listen for the response from the iframe.
    window.addEventListener('message', handleResponse);

    // Send the request to the iframe.
    translatorFrame.postMessage({
      source: 'longanicore-api-client',
      type,
      payload,
      requestId,
      // Provide ONE of the keys. The API will prioritize the global key if both are present.
      apiKey: LONGANICORE_API_KEY,
      globalApiKey: LONGANICORE_GLOBAL_API_KEY,
    }, LONGANICORE_ORIGIN);
  });
}


// --- 3. API USAGE EXAMPLES ---

// A. Text Translation Example
async function translateText(text, from, to) {
  console.log('Requesting text translation...');
  try {
    const result = await callLonganiApi('text-translation', {
      text: text,
      sourceLanguage: from, // e.g., 'Portuguese'
      targetLanguage: to,   // e.g., 'Changana'
    });
    console.log('Translation Result:', result);
    // result will be an object: { translation, pronunciation, sources }
    return result;
  } catch (error) {
    console.error('Text translation failed:', error);
  }
}

// B. Voice Translation Example
let activeVoiceSessionId = null;

async function startVoiceTranslation() {
  if (activeVoiceSessionId) {
    console.warn('A voice session is already active.');
    return;
  }
  
  console.log('Starting voice session...');
  
  // Set up listeners for real-time events from the voice session.
  window.addEventListener('message', handleVoiceEvents);

  try {
    const result = await callLonganiApi('start-voice-session', {
      sourceLanguage: 'Portuguese',
      targetLanguage: 'Changana'
    });
    console.log('Voice session started successfully!', result);
    activeVoiceSessionId = result.sessionId;
  } catch (error) {
    console.error('Failed to start voice session:', error);
    window.removeEventListener('message', handleVoiceEvents); // Clean up listener on failure.
  }
}

async function stopVoiceTranslation() {
  if (!activeVoiceSessionId) {
    console.warn('No active voice session to stop.');
    return;
  }
  console.log('Stopping voice session...');
  try {
    await callLonganiApi('stop-voice-session', { sessionId: activeVoiceSessionId });
    // The 'voice-session-closed' event will be caught by handleVoiceEvents,
    // which handles the final cleanup.
  } catch (error) {
    console.error('Failed to stop voice session:', error);
  }
}

// C. Real-time Event Handler for Voice
function handleVoiceEvents(event) {
  // Security check and filter out non-API messages
  if (event.origin !== LONGANICORE_ORIGIN || event.data.source !== 'longanicore-api') {
    return;
  }
  
  const { type, payload, sessionId } = event.data;

  // Ensure the event is for our active session
  if (sessionId !== activeVoiceSessionId) return;

  switch (type) {
    case 'voice-session-state-change':
      console.log('Voice State:', payload.state); // e.g., 'listening', 'speaking'
      break;
    case 'voice-session-transcription':
      console.log('Transcription Update:', payload); // { userInput, modelOutput, isFinal }
      // Example: Update your UI
      // document.getElementById('user-speech').innerText = payload.userInput;
      // document.getElementById('ai-translation').innerText = payload.modelOutput;
      break;
    case 'voice-session-error':
      console.error('Voice Session Error:', payload.message);
      // Clean up on error
      window.removeEventListener('message', handleVoiceEvents);
      activeVoiceSessionId = null;
      break;
    case 'voice-session-closed':
      console.log('Voice session closed.');
      // Clean up after session is confirmed closed.
      window.removeEventListener('message', handleVoiceEvents);
      activeVoiceSessionId = null;
      break;
  }
}

// --- 4. INITIALIZATION ---
// You should call the API functions based on user actions in your app.

// Wait for the iframe to load before making any API calls.
iframe.addEventListener('load', () => {
  console.log('LonganiCore iframe loaded. API is ready.');

  // Example: Translate text after iframe loads
  // translateText("Olá, como está?", "Portuguese", "Changana");
  
  // Example: Add event listeners to your buttons
  // document.getElementById('start-voice-btn').addEventListener('click', startVoiceTranslation);
  // document.getElementById('stop-voice-btn').addEventListener('click', stopVoiceTranslation);
});
`;
  return { htmlExample, jsExample };
};


const ApiDocsPage: React.FC = () => {
  const [origins, setOrigins] = useState<Record<string, string>>({});
  const [globalKeys, setGlobalKeys] = useState<string[]>([]);
  const [newOriginInput, setNewOriginInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isApiEnabled, setIsApiEnabled] = useState<boolean>(true);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000); // Hide after 3 seconds
  };

  useEffect(() => {
    try {
      const storedOrigins = localStorage.getItem(ORIGIN_STORAGE_KEY);
      if (storedOrigins) {
        setOrigins(JSON.parse(storedOrigins));
      }
      const storedGlobalKeys = localStorage.getItem(GLOBAL_KEYS_STORAGE_KEY);
      if (storedGlobalKeys) {
        setGlobalKeys(JSON.parse(storedGlobalKeys));
      }
      const apiStatus = localStorage.getItem(API_ENABLED_KEY);
      // API is enabled by default if the setting doesn't exist.
      setIsApiEnabled(apiStatus !== 'false');
    } catch (e) {
      console.error("Failed to access localStorage. API settings may not persist.", e);
      setError("Could not access browser storage. Your settings might not be saved.");
    }
  }, []);

  const persistOrigins = (updatedOrigins: Record<string, string>) => {
    try {
        localStorage.setItem(ORIGIN_STORAGE_KEY, JSON.stringify(updatedOrigins));
    } catch (e) {
        console.error("Failed to save origins to localStorage.", e);
        setError("Could not save settings to browser storage.");
    }
  };

   const persistGlobalKeys = (updatedKeys: string[]) => {
    try {
        localStorage.setItem(GLOBAL_KEYS_STORAGE_KEY, JSON.stringify(updatedKeys));
    } catch (e) {
        console.error("Failed to save global keys to localStorage.", e);
        setError("Could not save settings to browser storage.");
    }
  };

  const generateApiKey = () => `longani-core-${crypto.randomUUID()}`;

  const handleToggleApi = (enabled: boolean) => {
    setIsApiEnabled(enabled);
     try {
        localStorage.setItem(API_ENABLED_KEY, String(enabled));
    } catch (e) {
        console.error("Failed to save API status to localStorage.", e);
        setError("Could not save settings to browser storage.");
    }
  };
  
  const handleAddOrigin = () => {
    setError(null);
    let originUrl;
    try {
      // Prepend https:// if no protocol is present for robust parsing
      const urlToParse = newOriginInput.includes('://') ? newOriginInput : `https://${newOriginInput}`;
      originUrl = new URL(urlToParse);
    } catch (e) {
      setError('Invalid URL format. Please enter a valid origin (e.g., https://www.yoursite.com or http://localhost:3000).');
      return;
    }
    
    const newOrigin = originUrl.origin; // Extracts 'protocol://hostname:port'
    if (origins[newOrigin]) {
        setError('This origin has already been added.');
        return;
    }

    const newOrigins = { ...origins, [newOrigin]: generateApiKey() };
    setOrigins(newOrigins);
    persistOrigins(newOrigins);
    setNewOriginInput('');
    showNotification(`Origin "${newOrigin}" added successfully.`);
  };

  const handleRemoveOrigin = (origin: string) => {
    const newOrigins = { ...origins };
    delete newOrigins[origin];
    setOrigins(newOrigins);
    persistOrigins(newOrigins);
    showNotification(`Origin "${origin}" removed.`);
  };
  
  const handleRegenerateOriginKey = (origin: string) => {
    if (window.confirm(`Are you sure you want to regenerate the API key for ${origin}? The old key will stop working immediately.`)) {
        const newOrigins = { ...origins, [origin]: generateApiKey() };
        setOrigins(newOrigins);
        persistOrigins(newOrigins);
        showNotification(`API Key for "${origin}" has been regenerated.`);
    }
  };

  const handleAddGlobalKey = () => {
    const newKey = generateApiKey();
    const updatedKeys = [...globalKeys, newKey];
    setGlobalKeys(updatedKeys);
    persistGlobalKeys(updatedKeys);
    showNotification('New Global API Key generated successfully.');
  };

  const handleRemoveGlobalKey = (keyToRemove: string) => {
      if (window.confirm('Are you sure you want to delete this Global API Key? Any application using it will lose access immediately.')) {
          const updatedKeys = globalKeys.filter(k => k !== keyToRemove);
          setGlobalKeys(updatedKeys);
          persistGlobalKeys(updatedKeys);
          showNotification('Global API Key deleted.');
      }
  };

  const handleRegenerateGlobalKey = (keyToRegen: string) => {
      if (window.confirm('Are you sure you want to regenerate this Global API Key? The old key will stop working immediately.')) {
          const newKey = generateApiKey();
          const updatedKeys = globalKeys.map(k => (k === keyToRegen ? newKey : k));
          setGlobalKeys(updatedKeys);
          persistGlobalKeys(updatedKeys);
          showNotification('Global API Key has been regenerated.');
      }
  };
  
  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const { htmlExample, jsExample } = getCodeExamples(window.location.origin);

  return (
    <div className="bg-slate-900 font-sans text-slate-200 min-h-screen">
       <header className="sticky top-0 z-20 w-full bg-slate-900 border-b border-slate-700/50">
        <div className="w-full max-w-5xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <div>
              <img src="https://i.postimg.cc/BbkGVxv2/Longani-Core.png" alt="LonganiCore Logo" className="h-16 md:h-20" />
              <p className="text-slate-400 mt-2">
                Developer API Guide
              </p>
            </div>
            <nav className="flex items-center gap-4 md:gap-6 text-sm font-semibold">
                <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = '#'; }} className="text-slate-300 hover:text-teal-400 transition-colors">
                    Translator
                </a>
                 <a href="#about" onClick={(e) => { e.preventDefault(); window.location.hash = '#about'; }} className="text-slate-300 hover:text-teal-400 transition-colors">
                    About Us
                </a>
                <a href="#contact" onClick={(e) => { e.preventDefault(); window.location.hash = '#contact'; }} className="text-slate-300 hover:text-teal-400 transition-colors">
                    Contact
                </a>
                <ApiDropdown />
            </nav>
          </div>
        </div>
      </header>
      <div className="w-full max-w-5xl mx-auto p-4">
        <main className="bg-slate-800 shadow-2xl shadow-slate-950/50 rounded-2xl p-6 md:p-8">
            <div className="space-y-12 text-slate-300">
                {notification && (
                    <div className="bg-green-600/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Success!</strong>
                        <span className="block sm:inline ml-2">{notification}</span>
                    </div>
                )}
                <p className="text-slate-400 text-lg">
                    Integrate LonganiCore's translation capabilities into your own website using our cross-origin <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">postMessage</code> API. Follow these steps to get started.
                </p>

                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-4 border-l-4 border-teal-500 pl-3">Step 1: Configure API Access</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
                        <ToggleSwitch
                            label="Enable Cross-Origin API"
                            enabled={isApiEnabled}
                            onChange={handleToggleApi}
                        />
                        <p className="text-sm text-slate-400 -mt-2">
                            {isApiEnabled ? "The API is currently enabled and will respond to requests." : "The API is disabled and will not respond to any external requests."}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">Step 2a: Whitelist Your Origin (Recommended)</h3>
                    <p className="mb-4 text-slate-400">
                        For client-side web applications, you must add your website's origin (the protocol, domain, and port) to the allowed list. Each origin receives a unique API key.
                        For local development, you might use <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">http://localhost:3000</code>.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="text"
                            value={newOriginInput}
                            onChange={(e) => setNewOriginInput(e.target.value)}
                            placeholder="e.g., https://www.your-site.com"
                            className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button onClick={handleAddOrigin} className="px-4 py-2 bg-teal-600 font-semibold rounded-md hover:bg-teal-500 transition-colors">
                            Add Origin
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    
                    {Object.keys(origins).length > 0 && (
                        <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <h4 className="font-semibold text-slate-300 mb-2">Allowed Origins & API Keys</h4>
                            {Object.entries(origins).map(([origin, key]) => (
                            <div key={origin} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-700/50 rounded-md">
                                <span className="font-mono text-teal-300 break-all flex-shrink min-w-0 pr-4">{origin}</span>
                                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                                    <span className="font-mono text-sm p-1.5 text-slate-300">
                                        {visibleKeys[origin] ? key : '••••••••••••••••••••••••••••••••••'}
                                    </span>
                                    <CopyButton textToCopy={key} />
                                    <button onClick={() => toggleKeyVisibility(origin)} className="text-slate-400 hover:text-white p-1" aria-label={visibleKeys[origin] ? 'Hide API key' : 'Show API key'}>
                                        {visibleKeys[origin] ? 
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.707 2.293zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" /><path d="M10 17a9.953 9.953 0 01-4.522-.992l.938-1.053A8.007 8.007 0 0010 15c3.73 0 6.845-2.31 8.046-5.467l1.494 1.494A10.005 10.005 0 0110 17z" /></svg>
                                            : 
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                        }
                                    </button>
                                    <button onClick={() => handleRegenerateOriginKey(origin)} className="text-slate-400 hover:text-teal-400 p-1" aria-label={`Regenerate API key for ${origin}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => handleRemoveOrigin(origin)} className="text-red-400 hover:text-red-300 p-1" aria-label={`Remove origin ${origin}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-yellow-500 pl-3">Step 2b: Global API Keys (Advanced)</h3>
                    <div className="bg-yellow-600/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Security Warning:</strong>
                        <span className="block sm:inline ml-2">Global keys bypass origin checks and can be used from any website. Keep them secret, like a password. Use origin-specific keys whenever possible.</span>
                    </div>
                    <p className="mb-4 text-slate-400">
                        For server-side integrations or trusted environments where origin whitelisting is not feasible, you can use a global API key.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={handleAddGlobalKey} className="w-full px-4 py-2 bg-slate-600 font-semibold rounded-md hover:bg-slate-500 transition-colors">
                            Generate New Global Key
                        </button>
                    </div>
                    {globalKeys.length > 0 && (
                        <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <h4 className="font-semibold text-slate-300 mb-2">Generated Global Keys</h4>
                            {globalKeys.map((key) => (
                            <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-700/50 rounded-md">
                                <span className="font-mono text-sm text-yellow-300 break-all flex-grow pr-4">
                                    {visibleKeys[key] ? key : '••••••••••••••••••••••••••••••••••'}
                                </span>
                                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                                    <CopyButton textToCopy={key} />
                                    <button onClick={() => toggleKeyVisibility(key)} className="text-slate-400 hover:text-white p-1" aria-label={visibleKeys[key] ? 'Hide API key' : 'Show API key'}>
                                        {visibleKeys[key] ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.707 2.293zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" /><path d="M10 17a9.953 9.953 0 01-4.522-.992l.938-1.053A8.007 8.007 0 0010 15c3.73 0 6.845-2.31 8.046-5.467l1.494 1.494A10.005 10.005 0 0110 17z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                                    </button>
                                    <button onClick={() => handleRegenerateGlobalKey(key)} className="text-slate-400 hover:text-teal-400 p-1" aria-label={`Regenerate global API key`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                    </button>
                                    <button onClick={() => handleRemoveGlobalKey(key)} className="text-red-400 hover:text-red-300 p-1" aria-label={`Remove global API key`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">Step 3: API Usage Limits & Caching</h3>
                    <p className="mb-4 text-slate-400">
                        To ensure fair usage and service stability, the API implements a rate limit and a translation cache. Rate limiting is applied per-origin, even when using a global key.
                    </p>
                    <ul className="list-disc list-inside space-y-3 text-slate-400 pl-2">
                        <li>
                            <span className="font-semibold text-slate-300">Token Bucket Algorithm:</span> Each origin is given a "bucket" of 20 tokens. This bucket refills at a rate of 1 token every 2 seconds.
                        </li>
                        <li>
                            <span className="font-semibold text-slate-300">Request Costs:</span>
                            <ul className="list-['-_'] list-inside pl-6 mt-1 space-y-1">
                                <li><code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">text-translation</code>: Costs 1 token.</li>
                                <li><code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">start-voice-session</code>: Costs 5 tokens.</li>
                                <li><code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">stop-voice-session</code>: Costs 0 tokens.</li>
                            </ul>
                        </li>
                        <li>
                            <span className="font-semibold text-slate-300">Rate Limit Errors:</span> If your request exceeds the available tokens, the API will return an error with a <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">retryAfter</code> field indicating how many seconds you should wait before trying again.
                        </li>
                        <li>
                            <span className="font-semibold text-slate-300">Translation Cache:</span> To improve performance and reduce redundant calls, identical text translation requests are cached. You may receive a faster, cached response for common phrases.
                        </li>
                    </ul>
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">Step 4: Embed the iFrame</h3>
                    <p className="mb-4 text-slate-400">
                        Place this invisible iframe in your page's HTML. It acts as the secure bridge to the translation service.
                        The <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">allow="microphone"</code> attribute is required if you plan to use the Voice Translation API.
                    </p>
                    <CodeBlock code={htmlExample} language="html" />
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">Step 5: Call the API</h3>
                    <p className="mb-4 text-slate-400">
                        Use this JavaScript client to communicate with the iframe. Configure it with either your origin-specific key or a global key.
                    </p>
                    <CodeBlock code={jsExample} language="javascript" />
                </div>
                
                <div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">Step 6: Test & Debug</h3>
                    <p className="mb-4 text-slate-400">
                    After setting up, use the <a href="#log" onClick={(e) => { e.preventDefault(); window.location.hash = '#log'; }} className="text-teal-400 font-semibold hover:underline">API Connection Log</a> to monitor requests. This is the best way to debug connection issues.
                    </p>
                    <ul className="list-disc list-inside space-y-3 text-slate-400 pl-2">
                        <li><span className="font-semibold text-red-400">"Invalid Credentials" Error:</span> This means your API key is wrong, or if using an origin-specific key, your origin is not whitelisted or doesn't match the key.</li>
                        <li><span className="font-semibold text-red-400">"Rate Limit Exceeded" Error:</span> You've sent too many requests too quickly. Check the "API Usage Limits" section and implement a retry mechanism in your client using the provided <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">retryAfter</code> value.</li>
                        <li><span className="font-semibold text-slate-300">Requests not working?</span> Your test code must be run from a web server (e.g., using a local server like <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">npx serve</code>). Browsers block <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">postMessage</code> API calls from pages opened directly from the filesystem (<code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">file:///...</code>).</li>
                    </ul>
                </div>
            </div>
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Developed by Ban2Lab | Powered by Google Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default ApiDocsPage;
