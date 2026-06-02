import { createContext, useContext, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type AccentColorContextType = {
  accentColor: string;
  setAccentColor: (color: string) => void;
};

const AccentColorContext = createContext<AccentColorContextType>({
  accentColor: '#000000',
  setAccentColor: () => {},
});

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColor] = useState('#000000');
  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
  const scheme = useColorScheme();
  return {
    accentColor: ctx.accentColor,
    setAccentColor: ctx.setAccentColor,
    isDark: scheme === 'dark',
  };
}
