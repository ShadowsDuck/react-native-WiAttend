// components/ScheduleCard.js
import { View, Text, TouchableOpacity } from "react-native";
import { Clock, Location } from "iconsax-react-native";
import { DAY_OF_WEEK_THAI } from "../utils/dayOfWeekThai";
import ScheduleActionButton from "./ScheduleActionButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const ScheduleCard = ({
  schedule,
  todaySession,
  isOwner,
  isCheckingIn,
  onCheckIn,
}) => {
  const router = useRouter();
  const scheduleId = schedule?.schedule_id;

  return (
    <View className="bg-[#2C2C2C] rounded-xl p-4 px-5 mb-3">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white text-lg font-bold">
          วัน
          {DAY_OF_WEEK_THAI[schedule?.day_of_week.toLowerCase()] ||
            schedule?.day_of_week}
        </Text>
        {isOwner && (
          <TouchableOpacity
            className="border border-gray-600 p-2 rounded-full bg-gray-700/30 shadow-sm active:bg-gray-600/50"
            onPress={() => {
              router.push({
                pathname: "/(schedule)/editSchedule",
                params: { schedule_id: scheduleId },
              });
            }}
          >
            <Ionicons name="settings-outline" size={16} color="#E5E7EB" />
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row items-center mt-2">
        <Clock size="16" color="#9CA3AF" />
        <Text className="text-gray-300 text-sm ml-2">
          เวลา: {schedule.start_time?.slice(0, 5)} -{" "}
          {schedule.end_time?.slice(0, 5)}
        </Text>
      </View>
      <View className="flex-row items-center mt-2 mb-1">
        <Location size="16" color="#9CA3AF" />
        <Text className="text-gray-300 text-sm ml-2">
          ห้อง: {schedule?.room_id}
        </Text>
      </View>

      <ScheduleActionButton
        isOwner={isOwner}
        session={todaySession}
        isCheckingIn={isCheckingIn}
        onCheckIn={onCheckIn}
      />
    </View>
  );
};

export default ScheduleCard;
