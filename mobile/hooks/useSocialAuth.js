import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO, useAuth } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { useUserProfile } from "./useUserProfile";
import DeviceInfo from "react-native-device-info";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export const useSocialAuth = () => {
  useWarmUpBrowser();

  const [isLoading, setIsLoading] = useState(false);
  const { startSSOFlow } = useSSO();
  const { createUserProfile } = useUserProfile();
  const { signOut } = useAuth();

  const handleSocialAuth = async (provider) => {
    setIsLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "mobile",
        path: "oauth-callback",
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: provider,
        redirectUrl: redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        const device_id = await DeviceInfo.getUniqueId();

        try {
          const user = await createUserProfile(device_id);
          return user;
        } catch (profileError) {
          // ตรวจสอบว่าเป็น Error จาก device ซ้ำหรือไม่ (Backend ส่ง 403)
          if (profileError.response?.status === 403) {
            Alert.alert(
              "เข้าสู่ระบบไม่สำเร็จ",
              "อุปกรณ์นี้ได้ถูกลงทะเบียนกับบัญชีผู้ใช้อื่นแล้ว"
            );
            await signOut(); // สั่ง Logout ทันที
            return; // จบการทำงาน ไม่ต้องไปต่อ
          }

          // ถ้าเป็น Error อื่นๆ ที่เกี่ยวกับการสร้างโปรไฟล์
          console.log("An unexpected profile error occurred:", profileError);
          Alert.alert(
            "เกิดข้อผิดพลาด",
            "ไม่สามารถสร้างข้อมูลผู้ใช้ได้ กรุณาลองอีกครั้ง"
          );
          await signOut(); // สั่ง Logout เพราะถือว่าการลงทะเบียนไม่สมบูรณ์
          return;
        }
      }
    } catch (error) {
      console.log(
        "Error in social auth flow (e.g., user cancellation):",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSocialAuth };
};
