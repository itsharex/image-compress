import { useState, useEffect } from 'react';
import { Theme, THEME_KEY, PRIMARY_COLOR_KEY, DEFAULT_QUALITY_KEY } from '@/constants';

interface SettingsState {
  theme: Theme;
  primaryColor: string;
  defaultQuality: number;
}

const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>({
    theme: localStorage.getItem(THEME_KEY) as Theme | null || 'light',
    primaryColor: localStorage.getItem(PRIMARY_COLOR_KEY) || '#1677ff',
    defaultQuality: Number(localStorage.getItem(DEFAULT_QUALITY_KEY) || 80)
  });

  const changeTheme = (theme: Theme) => {
    setSettings(prev => ({
      ...prev,
      theme
    }));
    localStorage.setItem(THEME_KEY, theme);
  };

  const changePrimaryColor = (color: string) => {
    setSettings(prev => ({ ...prev, primaryColor: color }));
    localStorage.setItem(PRIMARY_COLOR_KEY, color);
  };

  const changeDefaultQuality = (quality: number | null) => {
    setSettings(prev => ({ ...prev, defaultQuality: quality || 80 }));
    localStorage.setItem(DEFAULT_QUALITY_KEY, String(quality));
  };

  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        setSettings(prev => ({ ...prev, theme: newTheme }));
      }
    };

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [settings.theme]);

  return {
    settings,
    changeTheme,
    changePrimaryColor,
    changeDefaultQuality,
  };
};

export default useSettings;
