import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TabsLayout = () => {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href={"/(auth)/sign-in"} />;
  }

  return (
    <Tabs
    // screenOptions={{
    //   tabBarActiveTintColor: colors.primary,
    //   tabBarInactiveTintColor: colors.textMuted,
    //   tabBarStyle: {
    //     backgroundColor: colors.surface,
    //     borderTopWidth: 1,
    //     borderColor: colors.border,
    //     height: 90,
    //     paddingBottom: 30,
    //     paddingTop: 10,
    //   },
    //   tabBarLabelStyle: {
    //     fontSize: 12,
    //     fontWeight: "600",
    //   },
    //   headerShown: false,
    // }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Check",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" size={size} color={color}></Ionicons>
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={color}
            ></Ionicons>
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={color}
            ></Ionicons>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
