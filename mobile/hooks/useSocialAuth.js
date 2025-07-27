import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { useUserProfile } from "./useUserProfile";

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

        try {
          const user = await createUserProfile();
          return user;
        } catch (profileError) {
          // ถ้า profile error แต่ login สำเร็จแล้ว - ให้ผ่านไป
          console.log(
            "Profile creation failed but login successful:",
            profileError
          );
          return { message: "Login successful" };
        }
      }
    } catch (error) {
      console.log("Error in social auth", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSocialAuth };
};
