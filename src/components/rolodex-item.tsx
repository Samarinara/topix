import { Text, View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import type { Topic } from "@/data/types";

const ITEM_HEIGHT = 72;

type RolodexItemData = Topic & { isNew?: boolean };

type Props = {
  index: number;
  item: RolodexItemData;
  scrollY: SharedValue<number>;
  containerHeight: number;
};

export function RolodexItem({ index, item, scrollY, containerHeight }: Props) {
  const centerOffset = (containerHeight - ITEM_HEIGHT) / 2;

  const animatedStyle = useAnimatedStyle(() => {
    const itemCenter =
      centerOffset + index * ITEM_HEIGHT + ITEM_HEIGHT / 2 - scrollY.value;
    const viewportCenter = containerHeight / 2;
    const distance = Math.abs(itemCenter - viewportCenter) / ITEM_HEIGHT;
    const sign = Math.sign(viewportCenter - itemCenter);

    const rotateX = sign * Math.min(distance, 5) * 14;
    const scale = Math.max(0.4, 1 - distance * 0.15);
    const opacity = Math.max(0.15, 1 - distance * 0.35);

    return {
      transform: [
        { perspective: 800 },
        { rotateX: `${rotateX}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      {item.isNew ? (
        <View style={styles.newTopicRow}>
          <View style={styles.plusCircle}>
            <Text style={styles.plusText}>+</Text>
          </View>
          <Text style={[styles.itemText, styles.newText]}>New Topic</Text>
        </View>
      ) : (
        <View style={styles.topicRow}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.itemText}>{item.name}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 32,
    overflow: "visible",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  itemText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "500",
    flex: 1,
  },
  indicatorWrap: {
    position: "absolute",
    right: 0,
    top: -ITEM_HEIGHT / 2 + 8,
    justifyContent: "center",
    alignItems: "center",
  },
  newTopicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  plusCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "700",
    marginTop: -1,
  },
  newText: {
    color: "#888",
  },
});
