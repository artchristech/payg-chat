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
  {
    id: 'explore',
    label: 'Explore',
    prompt: 'Let me explore and discover:',
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
  const agentButton = presetOptions[0];
  const exploreButton = presetOptions[1];

  return (
    <div className="flex flex-col items-center space-y-8">
      <button
        onClick={() => onPresetClick(agentButton.prompt)}
        className="flex items-center gap-6 px-16 py-8 bg-surface border border-border rounded-2xl hover:bg-surface-hover hover:border-border-hover transition-all duration-200 text-2xl font-semibold text-text shadow-lg hover:shadow-xl hover:scale-105"
      >
        <IconComponent name={agentButton.icon} />
        {agentButton.label}
      </button>
      <button
        onClick={() => onPresetClick(exploreButton.prompt)}
        className="flex items-center gap-6 px-16 py-8 bg-surface border border-border rounded-2xl hover:bg-surface-hover hover:border-border-hover transition-all duration-200 text-2xl font-semibold text-text shadow-lg hover:shadow-xl hover:scale-105"
      >
        <IconComponent name={exploreButton.icon} />
        {exploreButton.label}
      </button>
    </div>
  );
}