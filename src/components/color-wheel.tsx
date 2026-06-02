import { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Circle, Rect, LinearGradient, ClipPath } from 'react-native-svg';

import { hsvToHex } from '@/data/color-utils';

const SLICES = 72;
const DEG_PER_SLICE = 360 / SLICES;

type Props = {
  hue: number;
  saturation: number;
  value: number;
  onChange: (hue: number, saturation: number, value: number) => void;
  size?: number;
};

function slicePathData(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const sr = ((startDeg - 90) * Math.PI) / 180;
  const er = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(sr);
  const y1 = cy + r * Math.sin(sr);
  const x2 = cx + r * Math.cos(er);
  const y2 = cy + r * Math.sin(er);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

export function ColorWheel({ hue, saturation, value, onChange, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 4;

  const slices = useMemo(() => {
    const arr: { d: string; color: string }[] = [];
    for (let i = 0; i < SLICES; i++) {
      const start = i * DEG_PER_SLICE;
      const end = start + DEG_PER_SLICE;
      arr.push({
        d: slicePathData(cx, cy, radius, start, end),
        color: `hsl(${start}, 100%, 50%)`,
      });
    }
    return arr;
  }, [cx, cy, radius]);

  const pickerX = cx + saturation * radius * Math.cos(((hue - 90) * Math.PI) / 180);
  const pickerY = cy + saturation * radius * Math.sin(((hue - 90) * Math.PI) / 180);

  const updateColor = useCallback(
    (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) return;
      let newHue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (newHue < 0) newHue += 360;
      const newSat = dist / radius;
      onChange(newHue % 360, Math.min(newSat, 1), value);
    },
    [cx, cy, radius, value, onChange],
  );

  const wheelGesture = Gesture.Pan()
    .onBegin((e) => runOnJS(updateColor)(e.x, e.y))
    .onUpdate((e) => runOnJS(updateColor)(e.x, e.y));

  const thumbPos = useSharedValue(value);
  const thumbStyle = useAnimatedStyle(() => ({
    left: withSpring(thumbPos.value * (size - 28), { damping: 20 }),
  }));

  const updateValue = useCallback(
    (x: number, sliderWidth: number) => {
      const newV = Math.max(0, Math.min(1, (x - 14) / (sliderWidth - 28)));
      thumbPos.value = newV;
      onChange(hue, saturation, newV);
    },
    [hue, saturation, onChange, thumbPos],
  );

  const [sliderWidth, setSliderWidth] = useState(size);
  const onSliderLayout = useCallback((e: LayoutChangeEvent) => {
    setSliderWidth(e.nativeEvent.layout.width);
  }, []);

  const sliderGesture = Gesture.Pan()
    .onBegin((e) => runOnJS(updateValue)(e.x, sliderWidth))
    .onUpdate((e) => runOnJS(updateValue)(e.x, sliderWidth));

  const sliderColor = hsvToHex(hue, saturation, 1);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={wheelGesture}>
        <Animated.View>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="satMask" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="white" stopOpacity="1" />
                <Stop offset="85%" stopColor="white" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="white" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="valMask" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="black" stopOpacity="0" />
                <Stop offset="100%" stopColor="black" stopOpacity={1 - value} />
              </RadialGradient>
              <ClipPath id="wheelClip">
                <Circle cx={cx} cy={cy} r={radius} />
              </ClipPath>
            </Defs>
            {slices.map((s, i) => (
              <Path key={i} d={s.d} fill={s.color} />
            ))}
            <Circle cx={cx} cy={cy} r={radius} fill="url(#satMask)" />
            <Circle cx={cx} cy={cy} r={radius} fill="url(#valMask)" />
            <Circle
              cx={pickerX}
              cy={pickerY}
              r={10}
              stroke="white"
              strokeWidth={2.5}
              fill={hsvToHex(hue, saturation, value)}
            />
          </Svg>
        </Animated.View>
      </GestureDetector>

      <View style={[styles.sliderRow, { width: size }]} onLayout={onSliderLayout}>
        <Svg width={size} height={32}>
          <Defs>
            <LinearGradient id="valGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="black" />
              <Stop offset="100%" stopColor={sliderColor} />
            </LinearGradient>
          </Defs>
          <Rect
            x={14}
            y={10}
            width={size - 28}
            height={12}
            rx={6}
            fill="url(#valGrad)"
          />
        </Svg>
        <GestureDetector gesture={sliderGesture}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </GestureDetector>
      </View>

      <View style={styles.previewRow}>
        <View style={[styles.previewCircle, { backgroundColor: hsvToHex(hue, saturation, value) }]} />
        <Text style={styles.hexText}>{hsvToHex(hue, saturation, value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  sliderRow: {
    position: 'relative',
    height: 32,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hexText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
