/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',
    textInverse: '#FFFFFF',
    background: '#F0F0F5',
    backgroundSheet: '#FFFFFF',
    backgroundElement: '#F2F2F7',
    backgroundSelected: '#E5E5EA',
    backgroundCard: '#FFFFFF',
    line: 'rgba(60, 60, 67, 0.08)',
    lineSelection: 'rgba(60, 60, 67, 0.16)',
    backdrop: 'rgba(0, 0, 0, 0.15)',
    handle: '#C6C6C8',
    accentOverlay: 0.3,
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    textInverse: '#000000',
    background: '#08080E',
    backgroundSheet: '#1A1A2E',
    backgroundElement: '#2A2A3E',
    backgroundSelected: '#3A3A4E',
    backgroundCard: 'rgba(255, 255, 255, 0.05)',
    line: 'rgba(255, 255, 255, 0.08)',
    lineSelection: 'rgba(255, 255, 255, 0.16)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    handle: '#444444',
    accentOverlay: 0.5,
  },
} as const;

export type ThemeColor = Exclude<keyof typeof Colors.light & keyof typeof Colors.dark, 'accentOverlay'>;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
