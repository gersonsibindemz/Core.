
import React, { useState, useCallback, useRef } from 'react';
import { translateWithResearch } from './services/geminiService';
import { createVoiceSession } from './services/geminiLiveService';
import { LanguageOption, Source, VoiceSessionState, TranscriptionData } from './types';
import { LANGUAGES } from './constants';
import LanguageSelector from './components/LanguageSelector';
import CopyButton from './components/CopyButton';
import Spinner from './components/Spinner';
import SwapIcon from './components/SwapIcon';
import MicIcon from './components/MicIcon';
import StopIcon from './components/StopIcon';
import InfoIcon from './components/InfoIcon';
import ApiDropdown from './components/ApiDropdown';
import ToggleSwitch from './components/ToggleSwitch';


const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [pronunciation, setPronunciation] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceLang, setSourceLang] = useState<LanguageOption>(LANGUAGES[0]); // Default to Portuguese
  const [targetLang, setTargetLang] = useState<LanguageOption>(LANGUAGES[1]); // Default to Changana
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Voice translation state
  const [voiceState, setVoiceState] = useState<VoiceSessionState>('idle');
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
  const voiceSessionRef = useRef<{ stop: () => void } | null>(null);
  const [isConversationMode, setIsConversationMode] = useState<boolean>(false);


  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setOutputText('');
    setPronunciation(null);
    setSources([]);

    try {
      const result = await translateWithResearch(inputText, sourceLang.label, targetLang.label);
      setOutputText(result.translation);
      setPronunciation(result.pronunciation);
      setSources(result.sources);
    } catch (err) {
      setError('Failed to get translation. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);
  
  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const handleToggleVoiceSession = useCallback(async () => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.stop();
      voiceSessionRef.current = null;
      return;
    }
    
    setVoiceState('connecting');
    setError(null);

    try {
      const session = await createVoiceSession(
        sourceLang.value, 
        targetLang.value, 
        {
          onStateChange: (state) => setVoiceState(state),
          onTranscriptionUpdate: (data) => setTranscription(data),
          onError: (err) => {
            console.error('Voice session error:', err);
            setError('Voice translation failed. Check console for details.');
            setVoiceState('error');
            voiceSessionRef.current = null;
          },
        },
        isConversationMode ? 'bidirectional' : 'unidirectional'
      );
      voiceSessionRef.current = session;
    } catch (err) {
      setError('Could not start voice session. Please grant microphone permissions.');
      console.error(err);
      setVoiceState('error');
    }
  }, [sourceLang, targetLang, isConversationMode]);

  const isVoiceSessionActive = voiceState !== 'idle' && voiceState !== 'closed' && voiceState !== 'error';
  
  const getVoiceButtonContent = () => {
      if (voiceState === 'connecting') {
          return <><Spinner /><span>Connecting...</span></>;
      }
      if (isVoiceSessionActive) {
          return <><StopIcon /><span>Stop Session</span></>;
      }
      return <><MicIcon /><span>Voice Translation</span></>;
  };

  return (
    <div className="bg-slate-900 font-sans text-slate-200 min-h-screen">
      <header className="sticky top-0 z-20 w-full bg-slate-900 border-b border-slate-700/50">
          <div className="w-full max-w-5xl mx-auto p-4">
            <div className="flex justify-between items-start md:items-center">
                <div>
                <img src="https://i.postimg.cc/BbkGVxv2/Longani-Core.png" alt="LonganiCore Logo" className="h-16 md:h-20" />
                <p className="text-slate-400 mt-2">
                    Context-aware translations for Mozambican languages, powered by Gemini.
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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-4 mb-6">
            <LanguageSelector
              label={isConversationMode ? 'Language A' : 'From'}
              selectedLanguage={sourceLang}
              onLanguageChange={setSourceLang}
              languages={LANGUAGES}
              disabled={isVoiceSessionActive}
            />
             <button
                onClick={handleSwapLanguages}
                disabled={isVoiceSessionActive}
                className="p-2 -mb-1 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Swap languages"
              >
                <SwapIcon />
              </button>
             <LanguageSelector
              label={isConversationMode ? 'Language B' : 'To'}
              selectedLanguage={targetLang}
              onLanguageChange={setTargetLang}
              languages={LANGUAGES}
              disabled={isVoiceSessionActive}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isConversationMode ? "Conversation mode is active..." : "Enter text to translate..."}
              className="w-full h-48 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg resize-y placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
              disabled={isLoading || isVoiceSessionActive || isConversationMode}
            />
            <div>
              <div className="relative w-full h-48">
                <textarea
                  value={isLoading ? 'Translating...' : (error || outputText)}
                  readOnly
                  placeholder="Translation will appear here..."
                  className={`w-full h-full p-4 bg-slate-900 border-2 border-slate-700 rounded-lg resize-y ${error ? 'text-red-500' : ''} placeholder-slate-500`}
                />
                 {!isLoading && outputText && !error && (
                  <div className="absolute top-3 right-3">
                    <CopyButton textToCopy={outputText} />
                  </div>
                )}
              </div>
              {pronunciation && !isLoading && !error && (
                <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-teal-400">Pronunciation (IPA)</span>
                        <div className="relative group text-slate-400 hover:text-slate-200 cursor-pointer">
                            <InfoIcon />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 bg-slate-700 text-slate-200 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                The International Phonetic Alphabet (IPA) is a system for representing phonetic sounds. This guide helps with correct pronunciation.
                            </div>
                        </div>
                    </div>
                    <p className="italic font-serif text-lg text-slate-300 mt-1 pl-1">{pronunciation}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-xl">
              <button
                onClick={handleTranslate}
                disabled={isLoading || !inputText.trim() || isVoiceSessionActive || isConversationMode}
                className="flex items-center justify-center w-full sm:w-1/2 px-8 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? <><Spinner /><span>Translating...</span></> : 'Translate Text'}
              </button>
              <button
                onClick={handleToggleVoiceSession}
                disabled={isLoading || voiceState === 'connecting'}
                className={`flex items-center justify-center w-full sm:w-1/2 px-8 py-4 font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 ${isVoiceSessionActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'} disabled:bg-slate-600 disabled:cursor-not-allowed`}
              >
                {getVoiceButtonContent()}
              </button>
            </div>
            <div className="w-full max-w-xs">
              <ToggleSwitch 
                label="Conversation Mode"
                enabled={isConversationMode}
                onChange={setIsConversationMode}
                disabled={isVoiceSessionActive}
              />
            </div>
          </div>

           {isVoiceSessionActive && transcription && (
            <div className="mt-8 pt-6 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-300 mb-2">{sourceLang.label}{!isConversationMode && ' (You)'}</h3>
                <p className="text-slate-100 min-h-[2em]">{transcription.userInput || '...'}</p>
              </div>
               <div>
                <h3 className="font-semibold text-slate-300 mb-2">{targetLang.label}{!isConversationMode && ' (AI)'}</h3>
                <p className="text-teal-300 min-h-[2em]">{transcription.modelOutput || '...'}</p>
              </div>
            </div>
          )}

          {sources.length > 0 && !isLoading && (
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-slate-300 mb-3">Sources Consulted:</h3>
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {sources.map((source, index) => (
                  <li key={index} className="bg-slate-700/50 p-3 rounded-lg text-sm truncate">
                    <a 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-teal-400 hover:text-teal-300 hover:underline"
                      title={source.title}
                    >
                      {source.title || 'Untitled Source'}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Developed by Ban2Lab | Powered by Google Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
