import { View, Text, ActivityIndicator } from "react-native";
import { CalendarEdit } from "iconsax-react-native";
import SessionCard from "./SessionCard";

const SessionsList = ({
  sessions,
  loading,
  selectedDate,
  onManageSession,
  onViewAttendance,
  formatThaiDate,
  isOwner,
}) => {
  const formatDateForDisplay = (dateString) => {
    if (typeof formatThaiDate === "function") {
      return formatThaiDate(dateString);
    }
    // Fallback format if formatThaiDate is not provided
    return new Date(dateString).toLocaleDateString("th-TH");
  };

  return (
    <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5">
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-white text-xl font-bold">
          คาบเรียนวันที่เลือก
        </Text>
        <Text className="text-gray-400 text-sm">
          {formatDateForDisplay(selectedDate)}
        </Text>
      </View>

      {loading && sessions.length === 0 ? (
        <View className="flex items-center justify-center py-10">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-3">กำลังโหลด...</Text>
        </View>
      ) : sessions.length > 0 ? (
        sessions.map((session, index) => (
          <SessionCard
            key={session.session_id}
            session={session}
            onManage={onManageSession}
            onViewAttendance={onViewAttendance}
            isLast={index === sessions.length - 1}
            isOwner={isOwner}
          />
        ))
      ) : (
        <View className="flex items-center justify-center py-16">
          <CalendarEdit size={48} color="#4b5563" variant="Bulk" />
          <Text className="text-gray-400 text-base mt-3 mb-1">
            ไม่มีคาบเรียนในวันที่เลือก
          </Text>
        </View>
      )}
    </View>
  );
};

export default SessionsList;
