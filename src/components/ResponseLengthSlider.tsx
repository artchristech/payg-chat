import React from 'react';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 min-w-[160px]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-400 whitespace-nowrap">Length:</span>
        <span className="text-xs font-medium text-gray-200">
          {value} words
        </span>
      </div>
      
      <div className="w-40 relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
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