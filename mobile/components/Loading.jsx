import { View, ActivityIndicator } from "react-native";

const Loading = ({ size = "large", color = "white" }) => {
  return (
    <View className="flex-1 justify-center items-center bg-[#121212]">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default Loading;
