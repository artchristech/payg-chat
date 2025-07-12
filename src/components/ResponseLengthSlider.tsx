import React, { useState } from 'react';

interface ResponseLengthSliderProps {
  maxTokens: number;
  onValueChange: (value: number) => void;
}

export function ResponseLengthSlider({ maxTokens, onValueChange }: ResponseLengthSliderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseInt(e.target.value));
  };

  // Convert tokens to approximate words (rough estimate: 1 token ≈ 0.75 words)
  const approximateWords = Math.round(maxTokens * 0.75);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dot */}
      <button
        type="button"
        onClick={handleClick}
        className={`w-2 h-2 rounded-full transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'bg-blue-400 scale-125' 
            : 'bg-gray-500 hover:bg-gray-400'
        }`}
        title="Response length"
      />

      {/* Expanded Slider */}
      {isExpanded && (
        <div className="absolute left-4 flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out whitespace-nowrap z-10">
          <input
            type="range"
            min="50"
            max="2000"
            value={maxTokens}
            onChange={handleSliderChange}
            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-xs text-gray-300 min-w-fit">
            {approximateWords}w
          </span>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          border: none;
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}