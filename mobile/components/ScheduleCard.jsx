// components/ScheduleCard.js
import { View, Text } from "react-native";
import { Clock, Location } from "iconsax-react-native";
import { DAY_OF_WEEK_THAI } from "../constants/dayOfWeekThai";
import ScheduleActionButton from "./ScheduleActionButton";

const ScheduleCard = ({
  schedule,
  todaySession,
  isOwner,
  isCheckingIn,
  onCheckIn,
}) => {
  return (
    <View className="bg-[#2C2C2C] rounded-xl p-4 mb-3">
      <Text className="text-white text-lg font-bold mb-1">
        วัน
        {DAY_OF_WEEK_THAI[schedule.day_of_week.toLowerCase()] ||
          schedule.day_of_week}
      </Text>
      <View className="flex-row items-center mt-2">
        <Clock size="16" color="#9CA3AF" />
        <Text className="text-gray-300 text-sm ml-2">
          {schedule.start_time} - {schedule.end_time}
        </Text>
      </View>
      <View className="flex-row items-center mt-2 mb-1">
        <Location size="16" color="#9CA3AF" />
        <Text className="text-gray-300 text-sm ml-2">
          ห้อง: {schedule.room_id}
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
