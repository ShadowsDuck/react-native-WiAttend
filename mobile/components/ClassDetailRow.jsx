// components/ClassDetailRow.js
import { View, Text } from "react-native";

const ClassDetailRow = ({ icon, label, children }) => {
  return (
    <View className="flex-row items-center mb-5">
      <View className="w-11 h-11 rounded-full bg-white/5 justify-center items-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[#A0A0A0] text-sm mb-1">{label}</Text>
        {children}
      </View>
    </View>
  );
};

export default ClassDetailRow;
