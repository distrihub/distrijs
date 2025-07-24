import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sun, Moon, Monitor, Bot } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <Sun className="h-4 w-4" />,
    description: 'Light mode'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <Moon className="h-4 w-4" />,
    description: 'Dark mode'
  },
  {
    value: 'chatgpt',
    label: 'ChatGPT',
    icon: <Bot className="h-4 w-4" />,
    description: 'ChatGPT-inspired theme'
  },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor className="h-4 w-4" />,
    description: 'Follow system preference'
  }
];

export function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = themeOptions.find(option => option.value === theme) || themeOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-card border  rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors text-card-foreground"
      >
        <div className="flex items-center space-x-2">
          {currentTheme.icon}
          <span>{currentTheme.label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border  rounded-lg shadow-lg z-50">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value as any);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-accent transition-colors ${theme === option.value ? 'bg-accent text-accent-foreground' : 'text-card-foreground'
                } ${option.value === 'chatgpt' ? 'rounded-t-lg' : ''} ${option.value === 'system' ? 'rounded-b-lg' : ''}`}
            >
              <div className="flex-shrink-0">{option.icon}</div>
              <div className="flex-1 text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 