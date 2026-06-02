import { useMemo, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";

import { RolodexItem } from "./rolodex-item";
import { HoldIndicator } from "./hold-indicator";
import type { Topic } from "@/data/types";

const ITEM_HEIGHT = 72;

type RolodexItemData = Topic & { isNew?: boolean };

type Props = {
  topics: Topic[];
  onTopicTap: (topic: Topic) => void;
  onTopicLongPress: (topic: Topic) => void;
  onNewTopic: () => void;
  onFocusChange: (index: number) => void;
};

export function Rolodex({
  topics,
  onTopicTap,
  onTopicLongPress,
  onNewTopic,
  onFocusChange,
}: Props) {
  const [containerHeight, setContainerHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const focusedIndex = useSharedValue(0);
  const holdProgress = useSharedValue(0);

  const data: RolodexItemData[] = useMemo(
    () => [
      ...topics,
      {
        id: "+new",
        name: "+ New Topic",
        color: "#888",
        createdAt: 0,
        isNew: true,
      },
    ],
    [topics],
  );

  const centerOffset =
    containerHeight > 0 ? (containerHeight - ITEM_HEIGHT) / 2 : 0;

  const handleFocusChange = useCallback(
    (index: number) => {
      onFocusChange(index);
    },
    [onFocusChange],
  );

  const triggerTap = useCallback(() => {
    const index = Math.round(focusedIndex.value);
    if (index >= 0 && index < data.length) {
      const item = data[index];
      if (item.isNew) {
        onNewTopic();
      } else {
        onTopicTap(item as Topic);
      }
    }
  }, [data, onNewTopic, onTopicTap]);

  const triggerLongPress = useCallback(() => {
    const index = Math.round(focusedIndex.value);
    if (index >= 0 && index < data.length) {
      const item = data[index];
      if (item.isNew) {
        onNewTopic();
      } else {
        onTopicLongPress(item as Topic);
      }
    }
  }, [data, onNewTopic, onTopicLongPress]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const newIndex = event.contentOffset.y / ITEM_HEIGHT;
      focusedIndex.value = newIndex;
      runOnJS(handleFocusChange)(Math.round(newIndex));
    },
  });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(triggerTap)();
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onBegin(() => {
      holdProgress.value = withTiming(1, { duration: 600 });
    })
    .onStart(() => {
      runOnJS(triggerLongPress)();
    })
    .onFinalize(() => {
      holdProgress.value = withTiming(0, { duration: 150 });
    });

  const composed = Gesture.Exclusive(longPressGesture, tapGesture);

  if (containerHeight === 0) {
    return (
      <View
        style={styles.container}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      />
    );
  }

  const currentTopicColor =
    topics[Math.round(focusedIndex.value)]?.color ?? "#888";

  return (
    <GestureDetector gesture={composed}>
      <View
        style={styles.container}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      >
        <Animated.FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <RolodexItem
              index={index}
              item={item}
              scrollY={scrollY}
              containerHeight={containerHeight}
            />
          )}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{
            paddingTop: centerOffset,
            paddingBottom: centerOffset,
          }}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
        />

        <View
          style={[
            styles.selectionTrack,
            { top: centerOffset, height: ITEM_HEIGHT },
          ]}
          pointerEvents="none"
        >
          <View style={styles.selectionLine} />
          <View style={styles.indicatorContainer}>
            <HoldIndicator progress={holdProgress} color={currentTopicColor} />
          </View>
          <View style={styles.selectionLine} />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "visible",
    backgroundColor: "transparent",
  },
  selectionTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  selectionLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  indicatorContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.4,
  },
});
