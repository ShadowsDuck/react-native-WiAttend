// components/ScheduleSectionHeader.js
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar } from "iconsax-react-native";

const ScheduleSectionHeader = ({ scheduleCount, isOwner, onAddSchedule }) => {
  return (
    <>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row gap-2 items-center">
          <Calendar size={24} color="#A78BFA" style={{ marginTop: 2 }} />
          <View className="flex-col">
            <Text className="text-base font-bold text-white">
              ตารางเรียนและการเช็คชื่อ
            </Text>
            <Text className="text-sm text-gray-500">
              มี {scheduleCount} คาบเรียนต่อสัปดาห์
            </Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity
            onPress={onAddSchedule}
            className="bg-blue-500 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">
              เพิ่มตารางเรียน
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="mb-5 border-b border-gray-600" />
    </>
  );
};

export default ScheduleSectionHeader;
