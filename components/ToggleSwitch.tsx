
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, onChange, disabled = false }) => {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-semibold text-slate-300 ${disabled ? 'opacity-50' : ''}`}>{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 ${
          enabled ? 'bg-teal-600' : 'bg-slate-600'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
