import { useMemo, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Circle, ClipPath } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { hsvToHex } from '@/data/color-utils';

const SLICES = 72;
const DEG_PER_SLICE = 360 / SLICES;

type Props = {
  hue: number;
  saturation: number;
  onChange: (hue: number, saturation: number) => void;
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

export function ColorWheel({ hue, saturation, onChange, size = 280 }: Props) {
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
      onChange(newHue % 360, Math.min(newSat, 1));
    },
    [cx, cy, radius, onChange],
  );

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const tapGesture = Gesture.Tap().onEnd((e) => {
    runOnJS(updateColor)(e.x, e.y);
    runOnJS(triggerHaptic)();
  });
  const panGesture = Gesture.Pan()
    .onBegin((e) => runOnJS(updateColor)(e.x, e.y))
    .onUpdate((e) => runOnJS(updateColor)(e.x, e.y))
    .onEnd(() => runOnJS(triggerHaptic)());
  const wheelGesture = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={wheelGesture}>
        <View>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="satMask" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="white" stopOpacity="1" />
                <Stop offset="85%" stopColor="white" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="white" stopOpacity="0" />
              </RadialGradient>
              <ClipPath id="wheelClip">
                <Circle cx={cx} cy={cy} r={radius} />
              </ClipPath>
            </Defs>
            {slices.map((s, i) => (
              <Path key={i} d={s.d} fill={s.color} />
            ))}
            <Circle cx={cx} cy={cy} r={radius} fill="url(#satMask)" />
            <Circle
              cx={pickerX}
              cy={pickerY}
              r={14}
              stroke="white"
              strokeWidth={3}
              fill={hsvToHex(hue, saturation, 1)}
              opacity={0.95}
            />
          </Svg>
        </View>
      </GestureDetector>

      <View style={styles.previewRow}>
        <View style={[styles.previewCircle, { backgroundColor: hsvToHex(hue, saturation, 1) }]} />
        <Text style={styles.hexText}>{hsvToHex(hue, saturation, 1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
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
