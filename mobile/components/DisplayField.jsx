import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

const DisplayField = ({ label, value, iconName }) => (
  <View>
    <Text className="text-gray-400 text-sm mb-1">{label}</Text>
    <View className="flex-row items-center bg-[#2E2E2E] p-3 rounded-lg">
      <Ionicons name={iconName} size={20} color="#8A8A8E" className="mr-2" />
      <Text className="text-gray-400 text-base ml-2">{value || "N/A"}</Text>
    </View>
  </View>
);

export default DisplayField;
