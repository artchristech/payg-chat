import React from 'react';

interface PresetButtonsProps {
  onPresetClick: (prompt: string) => void;
}

export function PresetButtons({ onPresetClick }: PresetButtonsProps) {
  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg">Welcome to payg-chat</p>
        <p className="text-sm mt-2">Start a conversation by typing a message below</p>
      </div>
    </div>
  );
}