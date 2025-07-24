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
        const user = await createUserProfile();
        return user;
      }
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data?.message === "User already exists"
      ) {
        console.log("User already exists, login successful.");
        return { message: "Login successful" };
      } else {
        console.log("Error in social auth", error);
        Alert.alert(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSocialAuth };
};
