import { Stack } from "expo-router";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AccentColorProvider } from "@/context/accent-color";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AccentColorProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation:
              Platform.OS === "android" ? "slide_from_right" : "default",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="topic/[id]"
            options={{
              animation: "slide_from_right",
              gestureEnabled: true,
              gestureDirection: "horizontal",
            }}
          />
        </Stack>
      </AccentColorProvider>
    </GestureHandlerRootView>
  );
}
