import React, { useState } from 'react';

export function TopSlider() {
  const [value, setValue] = useState(125);
  const [isInteracting, setIsInteracting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(e.target.value));
  };

  return (
    <div className="w-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Label */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">Response Length</span>
            <div className={`transition-all duration-300 ${isInteracting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                {value} words
              </span>
            </div>
          </div>

          {/* Center - Slider */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="range"
                min="50"
                max="500"
                value={value}
                onChange={handleChange}
                onMouseEnter={() => setIsInteracting(true)}
                onMouseLeave={() => setIsInteracting(false)}
                onFocus={() => setIsInteracting(true)}
                onBlur={() => setIsInteracting(false)}
                className="slider-custom w-full h-2 bg-gray-600 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-800"
              />
              
              {/* Progress fill */}
              <div 
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full pointer-events-none transition-all duration-200"
                style={{ width: `${((value - 50) / (500 - 50)) * 100}%` }}
              />
              
              {/* Thumb */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-500 pointer-events-none transition-all duration-200 hover:scale-110"
                style={{ left: `calc(${((value - 50) / (500 - 50)) * 100}% - 10px)` }}
              >
                <div className="absolute inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right side - Range indicators */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Short
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              Medium
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Long
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}