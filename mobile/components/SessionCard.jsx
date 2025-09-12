import { View, Text, TouchableOpacity } from "react-native";
import { Clock, Location } from "iconsax-react-native";

const SessionCard = ({
  session,
  onManage,
  onViewAttendance,
  isLast,
  isOwner,
}) => {
  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // แสดงแค่ HH:MM
  };

  return (
    <View className={`bg-[#2C2C2C] rounded-xl p-4 ${isLast ? "" : "mb-3"}`}>
      {/* Session Status */}
      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-bold">คาบเรียน</Text>
          <View
            className={`px-3 py-1 rounded-full ${
              session.is_canceled ? "bg-red-500/20" : "bg-green-500/20"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                session.is_canceled ? "text-red-400" : "text-green-400"
              }`}
            >
              {session.is_canceled ? "ยกเลิก" : "เปิดใช้งาน"}
            </Text>
          </View>
        </View>

        {/* Time */}
        <View className="flex-row items-center mt-2">
          <Clock size="16" color="#9CA3AF" />
          <Text className="text-gray-300 text-sm ml-2">
            เวลา: {formatTime(session.start_time)} -{" "}
            {formatTime(session.end_time)}
          </Text>
        </View>

        {/* Room */}
        {session.room_id && (
          <View className="flex-row items-center mt-2">
            <Location size="16" color="#9CA3AF" />
            <Text className="text-gray-300 text-sm ml-2">
              ห้อง: {session.room_id}
            </Text>
          </View>
        )}

        {/* Custom Note */}
        {session.custom_note && (
          <View className="mt-2">
            <Text className="text-gray-300 text-sm">
              หมายเหตุ: {session.custom_note}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {isOwner && (
        <View className="flex-row mt-2 gap-2">
          <TouchableOpacity
            onPress={() => onManage(session)}
            className="flex-1 py-3 rounded-lg bg-blue-500/20 border border-blue-500/30"
            activeOpacity={0.7}
          >
            <Text className="text-blue-400 font-semibold text-center text-sm">
              จัดการ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onViewAttendance(session.session_id)}
            className={`flex-1 py-3 rounded-lg border ${
              session.is_canceled
                ? "bg-gray-500/20 border-gray-500/30"
                : "bg-green-500/20 border-green-500/30"
            }`}
            activeOpacity={session.is_canceled ? 0.5 : 0.7}
            disabled={session.is_canceled}
          >
            <Text
              className={`font-semibold text-center text-sm ${
                session.is_canceled ? "text-gray-400" : "text-green-400"
              }`}
            >
              สรุปการเข้าเรียน
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default SessionCard;
