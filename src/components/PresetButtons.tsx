import React from 'react';
import { PresetOption } from '../types/chat';
import { 
  FileText, 
  Code, 
  Palette, 
  Search, 
  Lightbulb, 
  Brain, 
  GraduationCap 
} from 'lucide-react';

interface PresetButtonsProps {
  onPresetClick: (prompt: string) => void;
}

const presetOptions: PresetOption[] = [
  {
    id: 'summary',
    label: 'Summary',
    prompt: 'Please provide a concise summary of the following:',
    icon: 'FileText',
  },
  {
    id: 'code',
    label: 'Code',
    prompt: 'Help me write code for:',
    icon: 'Code',
  },
  {
    id: 'design',
    label: 'Design',
    prompt: 'Help me design something creative:',
    icon: 'Palette',
  },
  {
    id: 'research',
    label: 'Research',
    prompt: 'I need help researching:',
    icon: 'Search',
  },
  {
    id: 'inspiration',
    label: 'Get Inspired',
    prompt: 'Give me creative ideas for:',
    icon: 'Lightbulb',
  },
  {
    id: 'think',
    label: 'Think Deeply',
    prompt: 'Let\'s think deeply about:',
    icon: 'Brain',
  },
  {
    id: 'learn',
    label: 'Learn Gently',
    prompt: 'Teach me about:',
    icon: 'GraduationCap',
  },
];

const IconComponent = ({ name }: { name: string }) => {
  const iconMap = {
    FileText,
    Code,
    Palette,
    Search,
    Lightbulb,
    Brain,
    GraduationCap,
  };
  
  const Icon = iconMap[name as keyof typeof iconMap] || FileText;
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
        >
          <IconComponent name={preset.icon} />
          {preset.label}
        </button>
      ))}
    </div>
  );
}