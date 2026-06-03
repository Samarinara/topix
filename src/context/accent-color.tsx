import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { loadThemeMode, saveThemeMode, type ThemeMode } from '@/data/storage';

type AccentColorContextType = {
  accentColor: string;
  setAccentColor: (color: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
};

const AccentColorContext = createContext<AccentColorContextType>({
  accentColor: '#000000',
  setAccentColor: () => {},
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
});

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColor] = useState('#000000');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();

  useEffect(() => {
    loadThemeMode().then(setThemeModeState);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemeMode(mode);
  }, []);

  const isDark = themeMode === 'system'
    ? systemScheme === 'dark'
    : themeMode === 'dark';

  return (
    <AccentColorContext.Provider
      value={{ accentColor, setAccentColor, themeMode, setThemeMode, isDark }}
    >
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  return useContext(AccentColorContext);
}
