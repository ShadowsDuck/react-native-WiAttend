import { View, Text, TouchableOpacity } from "react-native";
import BackButton from "./BackButton";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const Header = ({
  title,
  backgroundColor = "#121212",
  statusBarStyle = "light",
  textButton,
  backgroundColorButton,
  onPress,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View>
      {/* StatusBar Background */}
      <View style={{ height: insets.top, backgroundColor }} />
      <StatusBar style={statusBarStyle} />

      {/* Header Content */}
      <View
        className="flex-row p-4 items-center justify-between"
        style={{ backgroundColor }}
      >
        <View className="flex-row">
          <BackButton router={router} />
          <Text className="text-white font-medium text-[22px] ml-5">
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {textButton && backgroundColorButton && (
            <TouchableOpacity
              className="py-3 px-6 rounded-3xl"
              style={{ backgroundColor: backgroundColorButton }}
              onPress={onPress}
            >
              <Text className="text-white font-medium">{textButton}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => alert("ใส่ไว้สวยๆ")}>
            <Ionicons
              className=""
              name="ellipsis-vertical"
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Header;
