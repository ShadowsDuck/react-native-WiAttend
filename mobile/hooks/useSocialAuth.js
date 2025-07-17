import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO, useAuth } from "@clerk/clerk-expo";
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

  const { getToken } = useAuth();
  const { createUserProfile } = useUserProfile();

  const handleSocialAuth = async (provider) => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: provider,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }

      const token = await getToken();
      const user = await createUserProfile(token); // สร้าง user profile ใน DB ของเรา
      return user;
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
