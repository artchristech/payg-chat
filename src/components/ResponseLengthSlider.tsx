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

  // Calculate position percentage for the dot
  const minTokens = 50;
  const maxTokensRange = 2000;
  const position = ((maxTokens - minTokens) / (maxTokensRange - minTokens)) * 100;

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slider Track - fades in when expanded */}
      <div 
        className={`absolute left-0 h-1 bg-gray-600 rounded-full transition-all duration-300 ease-in-out ${
        }
        className={`absolute left-0 h-1 bg-text-muted rounded-full transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-20 opacity-100' : 'w-0 opacity-0'
        }`}
      />

      {/* Dot/Marker */}
      <button
        type="button"
        onClick={handleClick}
        className={`relative w-2 h-2 rounded-full transition-all duration-300 ease-in-out z-10 ${
          isExpanded 
            ? 'bg-primary scale-125' 
            : 'bg-button-secondary hover:bg-button-secondary-hover'
        }`}
        style={{
          left: isExpanded ? `${(position / 100) * 80}px` : '0px'
        }}
        title="Response length"
      />

      {/* Hidden range input for interaction */}
      {isExpanded && (
        <input
          type="range"
          min="50"
          max="2000"
          value={maxTokens}
          onChange={handleSliderChange}
          className="absolute left-0 w-20 h-1 opacity-0 cursor-pointer z-20"
        />
      )}

      {/* Word count label */}
      {isExpanded && (
        <div className="absolute left-24 flex items-center bg-surface border border-border px-2 py-1 rounded shadow-lg transition-all duration-300 ease-in-out whitespace-nowrap z-10">
          <span className="text-xs text-text-secondary">
            {approximateWords}w
          </span>
        </div>
      )}
    </div>
  );
}
}