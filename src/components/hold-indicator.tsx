import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const RADIUS = 28;
const STROKE = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  progress: SharedValue<number>;
  color: string;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function HoldIndicator({ progress, color }: Props) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Svg width={RADIUS * 2 + STROKE} height={RADIUS * 2 + STROKE} style={styles.container}>
      <Circle
        cx={RADIUS + STROKE / 2}
        cy={RADIUS + STROKE / 2}
        r={RADIUS}
        stroke={color}
        strokeWidth={STROKE}
        strokeOpacity={0.25}
        fill="none"
      />
      <AnimatedCircle
        cx={RADIUS + STROKE / 2}
        cy={RADIUS + STROKE / 2}
        r={RADIUS}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={CIRCUMFERENCE}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${RADIUS + STROKE / 2} ${RADIUS + STROKE / 2})`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
