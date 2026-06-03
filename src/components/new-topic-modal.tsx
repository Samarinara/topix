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
import { hsvToHex } from "@/data/color-utils";

type Props = {
  visible: boolean;
  onConfirm: (name: string, color: string) => void;
  onClose: () => void;
};

export function NewTopicModal({ visible, onConfirm, onClose }: Props) {
  const [name, setName] = useState("");
  const [hue, setHue] = useState(200);
  const [sat, setSat] = useState(0.7);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [wheelSize, setWheelSize] = useState(280);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setName("");
      setHue(200);
      setSat(0.7);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [visible]);

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

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(trimmed, currentColor);
    setName("");
    onClose();
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
        <Text style={styles.title}>New Topic</Text>

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
            styles.createBtn,
            pressed && styles.createBtnPressed,
            !name.trim() && styles.createBtnDisabled,
            { backgroundColor: name.trim() ? currentColor : "#333" },
          ]}
          onPress={handleCreate}
          disabled={!name.trim()}
        >
          <Text style={styles.createBtnText}>Create Topic</Text>
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
  createBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  createBtnPressed: {
    opacity: 0.7,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
