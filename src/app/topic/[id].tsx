import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeInUp,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { AddEntrySheet } from "@/components/add-entry-sheet";
import { TopicSettingsSheet } from "@/components/topic-settings-sheet";
import { useAccentColor } from "@/context/accent-color";
import { useTheme } from "@/hooks/use-theme";
import { Colors } from "@/constants/theme";
import {
  loadTopics,
  loadEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  updateTopic,
  deleteTopic,
} from "@/data/storage";
import type { Topic, Entry } from "@/data/types";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function EntryCard({
  item,
  index,
  topicColor,
  onLongPress,
  theme,
}: {
  item: Entry;
  index: number;
  topicColor: string;
  onLongPress: (entry: Entry) => void;
  theme: typeof Colors.light | typeof Colors.dark;
}) {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);

  const startRipple = (x: number, y: number) => {
    "worklet";
    rippleX.value = x;
    rippleY.value = y;
    rippleScale.value = 0;
    rippleOpacity.value = 0.25;
    rippleScale.value = withTiming(2.5, { duration: 400 });
    rippleOpacity.value = withTiming(0, { duration: 400 });
  };

  const handleLongPress = useCallback(() => onLongPress(item), [item, onLongPress]);

  const tapGesture = Gesture.Tap()
    .onBegin((e) => {
      startRipple(e.x, e.y);
    });

  const rippleStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: rippleX.value - 50,
    top: rippleY.value - 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: topicColor,
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(300 + index * 60)}>
      <GestureDetector gesture={tapGesture}>
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={400}
          style={({ pressed }) => ({
            ...styles.entryCard,
            backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundCard,
          })}
        >
          <View style={styles.entryContent}>
            <Animated.View style={rippleStyle} pointerEvents="none" />
            <Text style={[styles.entryText, { color: theme.text }]}>{item.text}</Text>
            <Text style={[styles.entryTime, { color: theme.textTertiary }]}>{relativeTime(item.createdAt)}</Text>
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

export default function TopicEntriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAccentColor, accentColor } = useAccentColor();
  const theme = useTheme();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const animatedBgOpacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  const emptyScale = useSharedValue(1);
  const emptyOpacity = useSharedValue(0.6);

  const loadData = useCallback(async () => {
    const all = await loadTopics();
    const t = all.find((x) => x.id === id);
    if (!t) return;
    setTopic(t);
    setAccentColor(t.color);
    setEntries(await loadEntries(id));
    animatedBgOpacity.value = withTiming(1, { duration: 1000 });
  }, [id, setAccentColor, animatedBgOpacity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    emptyScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );
    emptyOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 }),
      ),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = useCallback(() => {
    if (showSettings) {
      setShowSettings(false);
      return true;
    }
    if (showSheet) {
      setShowSheet(false);
      setSelectedEntry(null);
      return true;
    }
    return false;
  }, [showSheet, showSettings]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [handleBack]);

  const isDarkBg = theme.background === Colors.dark.background;
  const bgStyle = useAnimatedStyle(() => ({
    opacity: animatedBgOpacity.value * (isDarkBg ? 0.08 : 0.06),
    backgroundColor: accentColor,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    backgroundColor: accentColor,
  }));

  const triggerPulse = useCallback(() => {
    pulseOpacity.value = withSequence(
      withTiming(0.15, { duration: 150 }),
      withTiming(0, { duration: 350 }),
    );
  }, [pulseOpacity]);

  const handleSaveEntry = useCallback(
    async (text: string) => {
      if (selectedEntry) {
        await updateEntry({ ...selectedEntry, text });
      } else if (topic) {
        const entry: Entry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          topicId: topic.id,
          text,
          createdAt: Date.now(),
        };
        await addEntry(entry);
      }
      setSelectedEntry(null);
      await loadData();
      triggerPulse();
    },
    [selectedEntry, topic, loadData, triggerPulse],
  );

  const handleLongPress = useCallback(
    (entry: Entry) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Entry",
        undefined,
        [
          {
            text: "Edit",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedEntry(entry);
              setShowSheet(true);
            },
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert("Delete entry?", undefined, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await deleteEntry(entry.topicId, entry.id);
                    loadData();
                  },
                },
              ]);
            },
          },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true },
      );
    },
    [loadData],
  );

  const handleSaveSettings = useCallback(
    async (name: string, color: string) => {
      if (!topic) return;
      await updateTopic(topic.id, { name, color });
      setAccentColor(color);
      await loadData();
    },
    [topic, setAccentColor, loadData],
  );

  const handleDeleteTopic = useCallback(async () => {
    if (!topic) return;
    await deleteTopic(topic.id);
    router.back();
  }, [topic, router]);

  if (!topic) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.textTertiary }]}>Topic not found</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <StatusBar style="light" />
      <Animated.View
        style={[StyleSheet.absoluteFill, bgStyle]}
        pointerEvents="none"
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, pulseStyle]}
        pointerEvents="none"
      />

      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => ({
            ...styles.backBtn,
            backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
          })}
        >
          <Text style={[styles.backArrow, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Pressable
          style={styles.headerTitleArea}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSettings(true);
          }}
        >
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {topic.name}
          </Text>
          <Animated.View
            entering={BounceIn.duration(600).delay(250)}
            style={[styles.headerDot, { backgroundColor: topic.color }]}
          />
        </Pressable>
      </Animated.View>

      <Animated.FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        renderItem={({ item, index }) => (
          <EntryCard
            item={item}
            index={index}
            topicColor={topic.color}
            onLongPress={handleLongPress}
            theme={theme}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Animated.View
              style={[
                styles.emptyCircle,
                {
                  backgroundColor: topic.color + "20",
                  transform: [{ scale: emptyScale }],
                  opacity: emptyOpacity,
                },
              ]}
            />
            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No entries yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Tap the + to add your first thought
            </Text>
          </View>
        }
      />

      <Animated.View entering={FadeInUp.duration(400).delay(500)}>
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: topic.color },
            pressed && styles.fabPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedEntry(null);
            setShowSheet(true);
          }}
        >
          <Text style={[styles.fabText, { color: theme.textInverse }]}>+</Text>
        </Pressable>
      </Animated.View>

      <AddEntrySheet
        visible={showSheet}
        onSave={handleSaveEntry}
        onClose={() => {
          setShowSheet(false);
          setSelectedEntry(null);
        }}
        initialText={selectedEntry?.text}
      />

      {topic && (
        <TopicSettingsSheet
          visible={showSettings}
          topic={topic}
          onSave={handleSaveSettings}
          onDelete={handleDeleteTopic}
          onClose={() => setShowSettings(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backArrow: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "300",
    marginLeft: -2,
  },
  headerTitleArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  entryCard: {
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  entryContent: {
    overflow: "hidden",
  },
  entryText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  entryTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 120,
    gap: 12,
  },
  emptyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  fabText: {
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },
});
