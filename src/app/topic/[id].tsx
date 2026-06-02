import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Keyboard,
  BackHandler,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { AddEntrySheet } from "@/components/add-entry-sheet";
import { useAccentColor } from "@/context/accent-color";
import {
  loadTopics,
  loadEntries,
  addEntry,
  updateEntry,
  deleteEntry,
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

export default function TopicEntriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAccentColor, isDark, accentColor } = useAccentColor();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  const animatedBgOpacity = useSharedValue(0);

  const loadData = useCallback(async () => {
    const all = await loadTopics();
    const t = all.find((x) => x.id === id);
    if (!t) return;
    setTopic(t);
    setAccentColor(t.color);
    setEntries(await loadEntries(id));
    animatedBgOpacity.value = withTiming(1, { duration: 1000 });
  }, [id, setAccentColor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = useCallback(() => {
    if (showSheet) {
      setShowSheet(false);
      setSelectedEntry(null);
      return true;
    }
    return false;
  }, [showSheet]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [handleBack]);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: animatedBgOpacity.value * (isDark ? 0.08 : 0.06),
    backgroundColor: accentColor,
  }));

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
      loadData();
    },
    [selectedEntry, topic, loadData],
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

  if (!topic) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor: isDark ? "#08080e" : "#f0f0f5",
          },
        ]}
      >
        <Text style={styles.loadingText}>Topic not found</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#08080e" : "#f0f0f5" },
      ]}
    >
      <StatusBar style="light" />
      <Animated.View
        style={[StyleSheet.absoluteFill, bgStyle]}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {topic.name}
        </Text>
        <View style={[styles.headerDot, { backgroundColor: topic.color }]} />
      </View>

      <Animated.FlatList
        entering={FadeIn.delay(200).duration(400)}
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleLongPress(item)}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.entryCard,
              pressed && styles.entryCardPressed,
            ]}
          >
            <Text style={styles.entryText}>{item.text}</Text>
            <Text style={styles.entryTime}>{relativeTime(item.createdAt)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + to add your first thought
            </Text>
          </View>
        }
      />

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
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddEntrySheet
        visible={showSheet}
        onSave={handleSaveEntry}
        onClose={() => {
          setShowSheet(false);
          setSelectedEntry(null);
        }}
        initialText={selectedEntry?.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    color: "#888",
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
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backArrow: {
    color: "#fff",
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "300",
    marginLeft: -2,
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerTitle: {
    color: "#fff",
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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  entryCardPressed: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  entryText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  entryTime: {
    color: "#555",
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 120,
    gap: 8,
  },
  emptyText: {
    color: "#555",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#444",
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
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },
});
