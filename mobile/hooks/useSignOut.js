import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Alert } from "react-native";

export const useSignOut = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      Alert.alert("ยืนยัน", "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?", [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ออกจากระบบ",
          style: "destructive",
          onPress: () => {
            // ไม่ใช้ async/await ตรงนี้ เพราะ Alert ไม่รองรับ
            signOut().then(() => {
              router.replace("/(auth)/sign-in");
            });
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  return handleSignOut;
};
