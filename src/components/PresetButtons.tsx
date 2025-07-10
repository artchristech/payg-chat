import React from 'react';
import { PresetOption } from '../types/chat';
import { 
  Map, 
  Image,
  Mic,
  Store
} from 'lucide-react';

interface PresetButtonsProps {
  onPresetClick: (prompt: string) => void;
}

const presetOptions: PresetOption[] = [
  {
    id: 'travel',
    label: 'Explore Travel Plans',
    prompt: 'Help me plan a trip to:',
    icon: 'Map',
  },
  {
    id: 'image',
    label: 'Generate Image',
    prompt: 'Create an image of:',
    icon: 'Image',
  },
  {
    id: 'voice',
    label: 'Voice Mode',
    prompt: 'Let\'s have a voice conversation about:',
    icon: 'Mic',
  },
  {
    id: 'market',
    label: 'Market',
    prompt: 'Help me with market research and analysis for:',
    icon: 'Store',
  },
];

const IconComponent = ({ name }: { name: string }) => {
  const iconMap = {
    Map,
    Image,
    Mic,
    Store,
  };
  
  const Icon = iconMap[name as keyof typeof iconMap] || Map;
  return <Icon className="w-4 h-4" />;
};

export function PresetButtons({ onPresetClick }: PresetButtonsProps) {
  const topThreeButtons = presetOptions.slice(0, 3);
  const marketButton = presetOptions[3];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Top row with 3 buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {topThreeButtons.map((preset) => (
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
      
      {/* Market button - larger and centered below */}
      <div className="flex justify-center">
        <button
          onClick={() => onPresetClick(marketButton.prompt)}
          className="flex items-center gap-3 px-6 py-3 bg-gray-800 border border-gray-700 rounded-full hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 text-base font-medium text-gray-100 shadow-sm hover:shadow-md"
        >
          <IconComponent name={marketButton.icon} />
          {marketButton.label}
        </button>
      </div>
    </div>
  );
}