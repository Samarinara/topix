import { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, BackHandler } from "react-native";
import { useRouter } from "expo-router";
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Rolodex } from "@/components/rolodex";
import { AddEntrySheet } from "@/components/add-entry-sheet";
import { NewTopicModal } from "@/components/new-topic-modal";
import { useAccentColor } from "@/context/accent-color";
import { loadTopics, addTopic, addEntry } from "@/data/storage";
import type { Topic, Entry } from "@/data/types";

export default function IndexScreen() {
  const router = useRouter();
  const { accentColor, setAccentColor, isDark } = useAccentColor();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [displayColor, setDisplayColor] = useState(accentColor);

  const animatedBg = useSharedValue(accentColor);

  useAnimatedReaction(
    () => animatedBg.value,
    (value) => {
      runOnJS(setDisplayColor)(value);
    },
  );

  useEffect(() => {
    loadTopics().then(setTopics);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    animatedBg.value = withTiming(accentColor, { duration: 250 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentColor]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showNewTopic) {
        setShowNewTopic(false);
        return true;
      }
      if (showEntrySheet) {
        setShowEntrySheet(false);
        setSelectedTopic(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [showNewTopic, showEntrySheet]);

  const reloadTopics = useCallback(async () => {
    setTopics(await loadTopics());
  }, []);

  const handleFocusChange = useCallback(
    (index: number) => {
      if (index >= 0 && index < topics.length) {
        setAccentColor(topics[index].color);
      } else {
        setAccentColor("#000000");
      }
    },
    [topics, setAccentColor],
  );

  const handleTopicTap = useCallback((topic: Topic) => {
    setSelectedTopic(topic);
    setShowEntrySheet(true);
  }, []);

  const handleTopicLongPress = useCallback(
    (topic: Topic) => {
      setAccentColor(topic.color);
      router.push({ pathname: "/topic/[id]" as any, params: { id: topic.id } });
    },
    [router, setAccentColor],
  );

  const handleSaveEntry = useCallback(
    async (text: string) => {
      if (!selectedTopic) return;
      const entry: Entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        topicId: selectedTopic.id,
        text,
        createdAt: Date.now(),
      };
      await addEntry(entry);
    },
    [selectedTopic],
  );

  const handleCreateTopic = useCallback(
    async (name: string, color: string) => {
      const topic: Topic = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        name,
        color,
        createdAt: Date.now(),
      };
      await addTopic(topic);
      await reloadTopics();
    },
    [reloadTopics],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#08080e" : "#f0f0f5" },
      ]}
    >
      <LinearGradient
        colors={["transparent", displayColor, displayColor, "transparent"]}
        locations={[0.05, 0.4, 0.6, 0.95]}
        style={[styles.accentOverlay, { opacity: isDark ? 0.5 : 0.2 }]}
        pointerEvents="none"
      />

      <Rolodex
        topics={topics}
        onTopicTap={handleTopicTap}
        onTopicLongPress={handleTopicLongPress}
        onNewTopic={() => setShowNewTopic(true)}
        onFocusChange={handleFocusChange}
      />

      <AddEntrySheet
        visible={showEntrySheet}
        onSave={handleSaveEntry}
        onClose={() => {
          setShowEntrySheet(false);
          setSelectedTopic(null);
        }}
      />

      <NewTopicModal
        visible={showNewTopic}
        onConfirm={handleCreateTopic}
        onClose={() => setShowNewTopic(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accentOverlay: {
    ...StyleSheet.absoluteFill,
  },
});
