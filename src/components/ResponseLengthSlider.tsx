import React, { useState } from 'react';

interface ResponseLengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ResponseLengthSlider({ 
  value, 
  onChange, 
  min = 50, 
  max = 500, 
  step = 25 
}: ResponseLengthSliderProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleInteractionStart = () => setIsInteracting(true);
  const handleInteractionEnd = () => setIsInteracting(false);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-gray-400 whitespace-nowrap">Response length:</span>
        {isInteracting && (
          <span className="text-sm font-medium text-gray-200 min-w-[60px]">
            {value} words
          </span>
        )}
      </div>
      
      <div className="flex-1 relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseEnter={handleInteractionStart}
          onMouseLeave={handleInteractionEnd}
          onFocus={handleInteractionStart}
          onBlur={handleInteractionEnd}
          onMouseDown={handleInteractionStart}
          onMouseUp={handleInteractionEnd}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #6b7280;
            cursor: pointer;
            border: 2px solid #374151;
            transition: all 0.2s ease;
          }
          
          .slider::-webkit-slider-thumb:hover {
            background: #9ca3af;
            border-color: #4b5563;
            transform: scale(1.1);
          }
          
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #6b7280;
            cursor: pointer;
            border: 2px solid #374151;
            transition: all 0.2s ease;
          }
          
          .slider::-moz-range-thumb:hover {
            background: #9ca3af;
            border-color: #4b5563;
            transform: scale(1.1);
          }
          
          .slider::-webkit-slider-track {
            background: #374151;
            border-radius: 4px;
          }
          
          .slider::-moz-range-track {
            background: #374151;
            border-radius: 4px;
          }
        `}</style>
      </div>
    </div>
  );
}