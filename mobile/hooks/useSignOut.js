import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export const useSignOut = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      Alert.alert("Confirm", "Are you sure you want to log out?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  return handleSignOut;
};
