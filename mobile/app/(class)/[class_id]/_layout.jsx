import { useEffect } from "react";
import { BackHandler } from "react-native";
import { useRouter, Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

const ClassTabsLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const backAction = () => {
      if (isLoaded && isSignedIn) {
        router.push("/");
      }
      return true;
    };
    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => handler.remove();
  }, [router, isLoaded, isSignedIn]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href={"/(auth)/sign-in"} />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home-outline";

          switch (route.name) {
            case "home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "summary":
              iconName = focused ? "calendar" : "calendar-outline";
              break;
            case "people":
              iconName = focused ? "people" : "people-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#292a2c",
          borderTopWidth: 0,
          borderTopColor: "transparent",
          height: 80,
          paddingBottom: 25,
          // paddingTop: 15,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        // Custom tab bar background สำหรับ active tab
        tabBarBackground: () => null,
        headerShown: false,
      })}
    >
      <Tabs.Screen name="home" options={{ title: "ภาพรวม" }} />
      <Tabs.Screen name="summary" options={{ title: "การเข้าร่วม" }} />
      <Tabs.Screen name="people" options={{ title: "บุคคล" }} />
    </Tabs>
  );
};

export default ClassTabsLayout;
