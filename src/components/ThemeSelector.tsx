import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, Zap, Waves, Clock } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system' | 'cyber' | 'ambient' | 'vintage';

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>('light');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light-theme', 'dark-theme', 'cyber-theme', 'ambient-theme', 'vintage-theme');
    
    if (theme === 'system') {
      // System theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark-theme');
      } else {
        root.classList.add('light-theme');
      }
    } else {
      // Apply specific theme
      root.classList.add(`${theme}-theme`);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const root = document.documentElement;
        root.classList.remove('light-theme', 'dark-theme');
        if (mediaQuery.matches) {
          root.classList.add('dark-theme');
        } else {
          root.classList.add('light-theme');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

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

  const getThemeIcon = () => {
    if (theme === 'light') return Sun;
    if (theme === 'dark') return Moon;
    if (theme === 'cyber') return Zap;
    if (theme === 'ambient') return Waves;
    if (theme === 'vintage') return Clock;
    return Monitor;
  };

  const ThemeIcon = getThemeIcon();

  const themes = [
    { id: 'light' as Theme, label: 'Light', icon: Sun },
    { id: 'dark' as Theme, label: 'Dark', icon: Moon },
    { id: 'cyber' as Theme, label: 'Cyber', icon: Zap },
    { id: 'ambient' as Theme, label: 'Ambient', icon: Waves },
    { id: 'vintage' as Theme, label: 'Vintage', icon: Clock },
    { id: 'system' as Theme, label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-700 dark:hover:bg-gray-600 hover:text-gray-200 rounded-lg transition-colors"
        title="Change theme"
      >
        <ThemeIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[120px]"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-1">
            {themes.map((themeOption) => {
              const IconComponent = themeOption.icon;
              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setTheme(themeOption.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    theme === themeOption.id
                      ? 'bg-primary text-primary-text'
                      : 'text-text hover:bg-surface-hover'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {themeOption.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}