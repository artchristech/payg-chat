import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ isOn, onToggle }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none
        ${isOn ? 'bg-blue-500' : 'bg-gray-600'}
      `}
      title="Toggle setting"
    >
      <span
        className={`
          inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out
          ${isOn ? 'translate-x-3.5' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}