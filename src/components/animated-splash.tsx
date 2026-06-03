import { useEffect, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoIcon } from './logo-icon';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onDismiss: () => void;
};

const ENTRANCE_DURATION = 400;
const HOLD_DURATION = 300;
const EXIT_DURATION = 500;

export function AnimatedSplash({ onDismiss }: Props) {
  const theme = useTheme();
  const isDarkBg = theme.background === '#08080E';
  const gradientColors: [string, string, string] = isDarkBg
    ? ['#08080e', '#0d0d1a', '#08080e']
    : ['#f0f0f5', '#e8e8f0', '#f0f0f5'];

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);
  const overlayOpacity = useSharedValue(1);
  const exitScale = useSharedValue(1);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: ENTRANCE_DURATION,
      easing: Easing.out(Easing.ease),
    });
    logoScale.value = withTiming(1, {
      duration: ENTRANCE_DURATION,
      easing: Easing.out(Easing.ease),
    });
    textOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }),
    );
    textTranslateY.value = withDelay(
      200,
      withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const totalDelay = ENTRANCE_DURATION + HOLD_DURATION;
    const timer = setTimeout(() => {
      overlayOpacity.value = withTiming(
        0,
        {
          duration: EXIT_DURATION,
          easing: Easing.out(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleDismiss)();
          }
        },
      );
      exitScale.value = withTiming(1.05, {
        duration: EXIT_DURATION,
        easing: Easing.out(Easing.ease),
      });
    }, totalDelay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: theme.background }, overlayAnimatedStyle]}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <LogoIcon size={120} />
      </Animated.View>
      <Animated.Text style={[styles.text, { color: theme.text }, textAnimatedStyle]}>
        topix
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 4,
  },
  text: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
