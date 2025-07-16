import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSocialAuth } from "@/hooks/useSocialAuth.js";
import { Image } from "expo-image";

const SignIn = () => {
  const { isLoading, handleSocialAuth } = useSocialAuth();

  return (
    <View className="flex-1 justify-center items-center bg-[#121212]">
      <Image
        source={require("../../assets/images/wifi1.png")}
        style={{ width: "100%", height: 400, marginBottom: 30 }}
        contentFit="contain"
      />
      <View className="flex-col gap-7">
        {/* GOOGLE SIGNIN */}
        <TouchableOpacity
          className="justify-center items-center min-w-96 min-h-16 rounded-lg border border-white"
          onPress={() => handleSocialAuth("oauth_google")}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View className="flex-row p-4">
              <Image
                source={require("../../assets/images/google.png")}
                style={{ width: 30, height: 20, marginTop: 2 }}
              />
              <Text className="text-lg ml-1 text-white">
                Continue with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* FACEBOOK SIGNIN */}
        <TouchableOpacity
          className="justify-center items-center min-w-96 min-h-16 rounded-lg border border-white"
          onPress={() => handleSocialAuth("oauth_facebook")}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View className="flex-row p-4">
              <Image
                // className="justify-center items-center"
                source={require("../../assets/images/facebook.png")}
                style={{ width: 20, height: 20, marginTop: 2 }}
              />
              <Text className="text-lg ml-3 text-white">
                Continue with Facebook
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Terms and Privacy */}
      <View className="pl-16 pr-16 pt-7">
        <Text className="text-center text-white text-sm ">
          By signing up, you agree to our <Text>Terms</Text>
          {", "}
          <Text className="text-[#3B82F6]">Privacy Policy</Text>
          {", and "}
          <Text className="text-[#3B82F6]">Cookie Use</Text>.
        </Text>
      </View>
    </View>
  );
};

export default SignIn;
