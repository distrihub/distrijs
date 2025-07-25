import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
        className="flex items-center justify-center w-9 h-9 rounded-md border  bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-card border  rounded-md shadow-lg z-50">
          <button
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${theme === 'light' ? 'bg-accent text-accent-foreground' : 'text-card-foreground'
              } rounded-t-md`}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </button>
          <button
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${theme === 'dark' ? 'bg-accent text-accent-foreground' : 'text-card-foreground'
              }`}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${theme === 'system' ? 'bg-accent text-accent-foreground' : 'text-card-foreground'
              } rounded-b-md`}
          >
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </button>
        </div>
      )}
    </div>
  );
} 