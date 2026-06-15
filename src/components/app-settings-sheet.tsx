import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  BackHandler,
} from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useAccentColor } from "@/context/accent-color";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeMode } from "@/data/storage";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const options: { label: string; value: ThemeMode }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export function AppSettingsSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { themeMode, setThemeMode, accentColor } = useAccentColor();

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (visible) {
      handleClose();
      return true;
    }
    return false;
  }, [visible, handleClose]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [handleBack]);

  const handleSelect = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  if (!visible) return null;

  return (
    <Animated.View style={styles.overlay}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.backdrop }]} onPress={handleClose} />
      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(250)}
        style={[styles.sheet, { backgroundColor: theme.backgroundSheet, paddingBottom: insets.bottom + 16 }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.handle }]} />
        <Text style={[styles.title, { color: theme.text }]}>App Settings</Text>

        <View style={[styles.segmentRow, { backgroundColor: theme.backgroundElement }]}>
          {options.map((opt) => {
            const active = themeMode === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.segment,
                  active && { backgroundColor: accentColor },
                  pressed && !active && styles.segmentPressed,
                ]}
                onPress={() => handleSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textTertiary },
                    active && { color: "#fff" },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  segmentRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentPressed: {
    opacity: 0.7,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
