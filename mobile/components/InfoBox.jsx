import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const InfoBox = ({ text, subText }) => {
  return (
    <View className="flex-col items-start p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mt-5">
      <View className="flex-row">
        <Ionicons name="information-circle-outline" size={24} color="#FBBF24" />
        <Text className="text-yellow-400 text-[16px] font-semibold ml-2">
          {text}
        </Text>
      </View>
      <Text className="text-yellow-400 text-base ml-9 mt-1">{subText}</Text>
    </View>
  );
};

export default InfoBox;
