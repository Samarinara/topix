import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AccentColorProvider, useAccentColor } from "@/context/accent-color";

function Navigation() {
  const { isDark } = useAccentColor();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 500,
        fullScreenGestureEnabled: true,
        contentStyle: {
          backgroundColor: isDark ? "#08080e" : "#f0f0f5",
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="topic/[id]"
        options={{
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#08080e" }}>
      <AccentColorProvider>
        <Navigation />
      </AccentColorProvider>
    </GestureHandlerRootView>
  );
}
