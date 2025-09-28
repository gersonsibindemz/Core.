import React, { useState, useRef, useEffect } from 'react';

const ApiDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-slate-300 hover:text-teal-400 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        API
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-30 animate-fade-in-down">
          <a
            href="#docs"
            onClick={(e) => { e.preventDefault(); window.location.hash = '#docs'; setIsOpen(false); }}
            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-teal-400 transition-colors"
          >
            API Docs
          </a>
          <a
            href="#log"
            onClick={(e) => { e.preventDefault(); window.location.hash = '#log'; setIsOpen(false); }}
            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-teal-400 transition-colors"
          >
            API Log
          </a>
        </div>
      )}
       <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ApiDropdown;
