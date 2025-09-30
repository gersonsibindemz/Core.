import React from 'react';
import { LanguageOption } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: LanguageOption;
  onLanguageChange: (language: LanguageOption) => void;
  languages: LanguageOption[];
  label: string;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  languages,
  label,
  disabled = false
}) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const language = languages.find(lang => lang.value === selectedValue);
    if (language) {
      onLanguageChange(language);
    }
  };

  return (
    <div className="flex-grow">
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <select
          value={selectedLanguage.value}
          onChange={handleSelectChange}
          disabled={disabled}
          className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
    </div>
  );
};

export default LanguageSelector;
