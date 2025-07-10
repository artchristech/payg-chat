import React from 'react';
import { PresetOption } from '../types/chat';
import { 
  Lightbulb, 
  MessageCircle,
  Puzzle,
  PenTool
} from 'lucide-react';

interface PresetButtonsProps {
  onPresetClick: (prompt: string) => void;
}

const presetOptions: PresetOption[] = [
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    prompt: 'Help me brainstorm creative ideas for:',
    icon: 'Lightbulb',
  },
  {
    id: 'explain',
    label: 'Explain',
    prompt: 'Explain this concept in simple terms:',
    icon: 'MessageCircle',
  },
  {
    id: 'solve',
    label: 'Solve',
    prompt: 'Help me solve this problem step by step:',
    icon: 'Puzzle',
  },
  {
    id: 'write',
    label: 'Write',
    prompt: 'Help me write professional content for:',
    icon: 'PenTool',
  },
];

const IconComponent = ({ name }: { name: string }) => {
  const iconMap = {
    Lightbulb,
    MessageCircle,
    Puzzle,
    PenTool,
  };
  
  const Icon = iconMap[name as keyof typeof iconMap] || Lightbulb;
  return <Icon className="w-4 h-4" />;
};

export function PresetButtons({ onPresetClick }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {presetOptions.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onPresetClick(preset.prompt)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-sm font-medium text-gray-100 shadow-sm hover:shadow-md"
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-all duration-200 text-sm font-medium text-gray-100"
        >
          <IconComponent name={preset.icon} />
          {preset.label}
        </button>
      ))}
    </div>
  );
}