import React from 'react';
import { ApiConnectionLog } from '../types';
import ApiConnectionLogViewer from '../components/ApiConnectionLogViewer';
import ApiDropdown from '../components/ApiDropdown';

interface ApiLogPageProps {
  logs: ApiConnectionLog[];
}

const ApiLogPage: React.FC<ApiLogPageProps> = ({ logs }) => {
  return (
    <div className="bg-slate-900 font-sans text-slate-200 min-h-screen">
      <header className="sticky top-0 z-20 w-full bg-slate-900 border-b border-slate-700/50">
        <div className="w-full max-w-5xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <div>
              <img src="/logo.png" alt="LonganiCore Logo" className="h-16 md:h-20" />
              <p className="text-slate-400 mt-2">
                API Connection Activity
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
            <h2 className="text-2xl font-semibold text-slate-300 mb-4">API Connection Log</h2>
            <p className="text-slate-400 mb-6">
                This log shows the most recent 100 connection attempts from external websites using the <code className="bg-slate-900 text-teal-300 px-1 py-0.5 rounded">postMessage</code> API. Successful connections are marked with a <span className="text-green-400 font-bold mx-1">✓</span> and failures with a <span className="text-red-400 font-bold mx-1">✗</span>.
            </p>
            <ApiConnectionLogViewer logs={logs} />
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Developed by Ban2Lab | Powered by Google Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default ApiLogPage;
