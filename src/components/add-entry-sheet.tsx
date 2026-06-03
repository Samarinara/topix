import { useState, useRef, useEffect, useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  Text,
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

import { useTheme } from "@/hooks/use-theme";

type Props = {
  visible: boolean;
  onSave: (text: string) => void;
  onClose: () => void;
  initialText?: string;
};

export function AddEntrySheet({
  visible,
  onSave,
  onClose,
  initialText,
}: Props) {
  const theme = useTheme();
  const [text, setText] = useState(initialText ?? "");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setText(initialText ?? "");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [visible, initialText]);

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

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(trimmed);
    setText("");
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.backdrop }]} onPress={handleClose} />
      <Animated.View
        entering={SlideInUp.duration(300)}
        exiting={SlideOutDown.duration(250)}
        style={[styles.sheet, { backgroundColor: theme.backgroundSheet, paddingBottom: insets.bottom + 16 }]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {initialText ? "Edit Entry" : "New Entry"}
        </Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Brain dump here..."
          placeholderTextColor={theme.textTertiary}
          multiline
          autoFocus
        />
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            !text.trim() && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!text.trim()}
        >
          <Text style={styles.saveText}>
            {initialText ? "Update" : "Save"}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: "#4a7cf7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnPressed: {
    opacity: 0.7,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
