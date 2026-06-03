import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  BackHandler,
  Alert,
} from "react-native";
import Animated, {
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ColorWheel } from "./color-wheel";
import { hexToHsv, hsvToHex } from "@/data/color-utils";
import type { Topic } from "@/data/types";

type Props = {
  visible: boolean;
  topic: Topic;
  onSave: (name: string, color: string) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function TopicSettingsSheet({ visible, topic, onSave, onDelete, onClose }: Props) {
  const { h: initialHue, s: initialSat } = hexToHsv(topic.color);
  const [name, setName] = useState(topic.name);
  const [hue, setHue] = useState(initialHue);
  const [sat, setSat] = useState(initialSat);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [wheelSize, setWheelSize] = useState(280);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setName(topic.name);
      const { h, s } = hexToHsv(topic.color);
      setHue(h);
      setSat(s);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [visible, topic]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        keyboardHeight.value = withTiming(e.endCoordinates.height, {
          duration: 250,
        });
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        keyboardHeight.value = withTiming(0, { duration: 250 });
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [keyboardHeight]);

  const containerStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value,
  }));

  const handleBack = useCallback(() => {
    if (visible) {
      handleClose();
      return true;
    }
    return false;
  }, [visible]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [handleBack]);

  if (!visible) return null;

  const currentColor = hsvToHex(hue, sat, 1);
  const hasChanges = name.trim() && (name.trim() !== topic.name || currentColor !== topic.color);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(trimmed, currentColor);
    onClose();
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete topic?", "This will also delete all entries in this topic.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDelete();
          onClose();
        },
      },
    ]);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(250)}
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Topic Settings</Text>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Topic name"
          placeholderTextColor="#666"
        />

        <View
          style={styles.wheelContainer}
          onLayout={(e) => {
            const w = Math.min(e.nativeEvent.layout.width - 32, 320);
            setWheelSize(w);
          }}
        >
          <ColorWheel
            hue={hue}
            saturation={sat}
            onChange={(h, s) => {
              setHue(h);
              setSat(s);
            }}
            size={wheelSize}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            !hasChanges && styles.saveBtnDisabled,
            { backgroundColor: hasChanges ? currentColor : "#2a2a3e" },
            hasChanges && { shadowColor: currentColor },
          ]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteBtnText}>Delete Topic</Text>
        </Pressable>
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2a2a3e",
    color: "#fff",
    fontSize: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  wheelContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  deleteBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.3)",
  },
  deleteBtnPressed: {
    backgroundColor: "rgba(255,69,58,0.1)",
  },
  deleteBtnText: {
    color: "#ff453a",
    fontSize: 16,
    fontWeight: "600",
  },
});
