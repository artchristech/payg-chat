import React from 'react';
import { PresetOption } from '../types/chat';
import { Store } from 'lucide-react';

interface PresetButtonsProps {
  onPresetClick: (prompt: string) => void;
}

const presetOptions: PresetOption[] = [
  {
    id: 'market',
    label: 'Agent',
    prompt: 'Help me with market research and analysis for:',
    icon: 'Store',
  },
];

const IconComponent = ({ name }: { name: string }) => {
  const iconMap = {
    Store,
  };
  
  const Icon = iconMap[name as keyof typeof iconMap] || Store;
  return <Icon className="w-5 h-5" />;
};

export function PresetButtons({ onPresetClick }: PresetButtonsProps) {
  const marketButton = presetOptions[0];

  return (
    <div className="flex justify-center">
      <button
        onClick={() => onPresetClick(marketButton.prompt)}
        className="flex items-center gap-3 px-8 py-4 bg-gray-800 border border-gray-600 rounded-2xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 text-lg font-semibold text-gray-100 shadow-lg hover:shadow-xl hover:scale-105"
      >
        <IconComponent name={marketButton.icon} />
        {marketButton.label}
      </button>
    </div>
  );
}