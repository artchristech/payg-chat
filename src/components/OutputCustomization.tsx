import React, { useState, useRef, useEffect } from 'react';
import { Type, Check } from 'lucide-react';

interface OutputCustomizationProps {
  outputFontFamily: string;
  outputLineSpacing: number;
  onFontFamilyChange: (fontFamily: string) => void;
  onLineSpacingChange: (lineSpacing: number) => void;
}

const fontOptions = [
  { id: 'system-ui', label: 'System', value: 'system-ui, -apple-system, sans-serif' },
  { id: 'inter', label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { id: 'arial', label: 'Arial', value: 'Arial, sans-serif' },
  { id: 'helvetica', label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { id: 'georgia', label: 'Georgia', value: 'Georgia, serif' },
  { id: 'times', label: 'Times', value: 'Times New Roman, serif' },
  { id: 'mono', label: 'Monospace', value: 'Monaco, Consolas, monospace' },
];

export function OutputCustomization({ 
  outputFontFamily, 
  outputLineSpacing, 
  onFontFamilyChange, 
  onLineSpacingChange 
}: OutputCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLineSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLineSpacingChange(parseFloat(e.target.value));
  };

  const getCurrentFontLabel = () => {
    const currentFont = fontOptions.find(font => font.value === outputFontFamily);
    return currentFont?.label || 'Custom';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-text rounded-lg transition-colors"
        title="Customize output font and spacing"
      >
        <Type className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[240px]"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-4 space-y-4">
            {/* Font Family Section */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Font Family
              </label>
              <div className="space-y-1">
                {fontOptions.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      onFontFamilyChange(font.value);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                      outputFontFamily === font.value
                        ? 'bg-primary/20 text-primary'
                        : 'text-text hover:bg-surface-hover'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    <span>{font.label}</span>
                    {outputFontFamily === font.value && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Spacing Section */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Line Spacing: {outputLineSpacing.toFixed(1)}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={outputLineSpacing}
                  onChange={handleLineSpacingChange}
                  className="w-full h-2 bg-surface-active rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Tight</span>
                  <span>Normal</span>
                  <span>Loose</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="pt-2 border-t border-border">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Preview
              </label>
              <div 
                className="p-3 bg-surface-active rounded-md text-sm text-text"
                style={{ 
                  fontFamily: outputFontFamily,
                  lineHeight: outputLineSpacing 
                }}
              >
                This is how the AI responses will appear with your selected font and spacing settings.
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}