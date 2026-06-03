import { useState, useCallback, useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AccentColorProvider, useAccentColor } from "@/context/accent-color";
import { AnimatedSplash } from "@/components/animated-splash";

SplashScreen.preventAutoHideAsync();

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
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleSplashDismiss = useCallback(() => {
    setIsSplashDone(true);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#08080e" }}>
      <AccentColorProvider>
        <Navigation />
        {!isSplashDone && <AnimatedSplash onDismiss={handleSplashDismiss} />}
      </AccentColorProvider>
    </GestureHandlerRootView>
  );
}
