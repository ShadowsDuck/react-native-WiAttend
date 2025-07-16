import "../global.css";
import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import SafeScreen from "@/components/SafeScreen";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeScreen>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "#121212" },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(root)" />
          <Stack.Screen name="(class)" />
        </Stack>
        <StatusBar style="light" />
      </SafeScreen>
    </ClerkProvider>
  );
}
