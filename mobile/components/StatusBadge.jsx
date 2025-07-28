import { View, Text } from "react-native";

const StatusBadge = ({ status }) => {
  if (status === "active") {
    return (
      <View className="bg-green-500/20 px-2.5 py-1 rounded-full">
        <Text className="text-green-400 font-semibold text-xs">กำลังทำงาน</Text>
      </View>
    );
  }
  if (status === "expired") {
    return (
      <View className="bg-red-500/20 px-2.5 py-1 rounded-full">
        <Text className="text-red-400 font-semibold text-xs">หมดเวลา</Text>
      </View>
    );
  }
  return (
    <View className="bg-gray-500/20 px-2.5 py-1 rounded-full">
      <Text className="text-gray-400 font-semibold text-xs">ยังไม่เริ่ม</Text>
    </View>
  );
};

export default StatusBadge;
