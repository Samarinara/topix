import { Colors } from '@/constants/theme';
import { useAccentColor } from '@/context/accent-color';

export function useTheme() {
  const { isDark } = useAccentColor();
  return isDark ? Colors.dark : Colors.light;
}
