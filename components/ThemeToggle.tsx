'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';

const THEMES = ['system', 'light', 'dark'] as const;
type Theme = typeof THEMES[number];

const ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Theme, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Mandatory mounted guard — prevents hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder of the same size to prevent layout shift
    return <div className="w-9 h-9" />;
  }

  const current = (theme as Theme) || 'system';
  const currentIndex = THEMES.indexOf(current);
  const next = THEMES[(currentIndex + 1) % THEMES.length];
  const Icon = ICONS[current];

  const handleClick = () => {
    setTheme(next);
    // Silently sync preference to backend — errors are ignored
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) {
        fetch('/api/settings/me/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ theme: next }),
        }).catch(() => {/* ignore */});
      }
    } catch {
      // ignore any storage/fetch errors
    }
  };

  return (
    <button
      onClick={handleClick}
      title={`Switch to ${LABELS[next]} mode`}
      aria-label={`Current theme: ${LABELS[current]}. Click to switch to ${LABELS[next]}`}
      className="
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
        bg-bg-secondary text-tx-secondary border border-bd
        hover:bg-brand-light hover:text-brand
        transition-colors duration-150
      "
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{LABELS[current]}</span>
    </button>
  );
}
