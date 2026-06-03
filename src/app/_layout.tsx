import { useState, useCallback, useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AccentColorProvider, useAccentColor } from "@/context/accent-color";
import { useTheme } from "@/hooks/use-theme";
import { AnimatedSplash } from "@/components/animated-splash";

SplashScreen.preventAutoHideAsync();

function Navigation() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 500,
        fullScreenGestureEnabled: true,
        contentStyle: {
          backgroundColor: theme.background,
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

function RootContent() {
  const theme = useTheme();
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const handleSplashDismiss = useCallback(() => {
    setIsSplashDone(true);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <Navigation />
      {!isSplashDone && <AnimatedSplash onDismiss={handleSplashDismiss} />}
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AccentColorProvider>
      <RootContent />
    </AccentColorProvider>
  );
}
