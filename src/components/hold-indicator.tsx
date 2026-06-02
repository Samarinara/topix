import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type Props = {
  progress: SharedValue<number>;
  color: string;
};

export function HoldIndicator({ progress, color }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  fill: {
    height: '100%',
  },
});
