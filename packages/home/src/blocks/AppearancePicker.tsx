import React, { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@distri/components';

// ---------------------------------------------------------------------------
// AppearancePicker — theme switcher (light / dark / system).
//
// We use a localStorage-based approach that is compatible with both
// next-themes (ThemeProvider from @distri/react) and any other provider.
// The component reads/writes the 'distri-theme' key that ThemeProvider uses
// by default, and applies the class manually so it works standalone too.
// ---------------------------------------------------------------------------

export interface AppearancePickerProps {
  /** Optional storage key matching the ThemeProvider storageKey prop. Default: 'distri-theme'. */
  storageKey?: string;
  className?: string;
}

type Theme = 'light' | 'dark' | 'system';

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

function applyTheme(theme: Theme) {
  try {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  } catch {
    // Ignore errors in test environments where document manipulation may not be available
  }
}

export function AppearancePicker({
  storageKey = 'distri-theme',
  className,
}: AppearancePickerProps = {}) {
  const stored =
    (typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null) ?? 'system';
  const [theme, setThemeState] = useState<Theme>(stored as Theme);

  const handleSelect = (value: Theme) => {
    setThemeState(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, value);
    }
    applyTheme(value);
  };

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground">
        Choose how Distri looks. System follows your OS preference.
      </p>
      <div className="flex items-center gap-2">
        {THEMES.map(({ value, label, icon }) => {
          const active = theme === value;
          return (
            <Button
              key={value}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelect(value)}
              className="flex items-center gap-2"
            >
              {icon}
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
