import { View, Text } from "react-native";
import { Calendar } from "react-native-calendars";
import { CalendarEdit } from "iconsax-react-native";
import { Ionicons } from "@expo/vector-icons";

const CalendarSection = ({
  calendarKey,
  initialDate,
  onDayPress,
  onMonthChange,
  markedDates,
}) => {
  return (
    <View className="bg-[#1E1E1E] rounded-2xl p-5 mb-6 mx-5 mt-6">
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-white text-xl font-bold">ปฏิทินคาบเรียน</Text>
        <View className="flex-row items-center">
          <CalendarEdit size={20} color="#3b82f6" variant="Bold" />
        </View>
      </View>

      <Calendar
        // --- Props ที่สำคัญสำหรับการ Reset ---
        key={calendarKey}
        initialDate={initialDate}
        // --- Props การทำงาน ---
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markedDates={markedDates}
        markingType={"dot"}
        monthFormat={"MMMM yyyy"}
        firstDay={1} // 1 = Monday
        // --- Styling (จากโค้ดของคุณ) ---
        theme={{
          backgroundColor: "#1E1E1E",
          calendarBackground: "#1E1E1E",
          textSectionTitleColor: "#9CA3AF",
          selectedDayBackgroundColor: "#3b82f6",
          selectedDayTextColor: "#ffffff",
          todayTextColor: "#3b82f6",
          dayTextColor: "#ffffff",
          textDisabledColor: "#4b5563",
          dotColor: "#3b82f6",
          selectedDotColor: "#ffffff",
          arrowColor: "#3b82f6",
          monthTextColor: "#ffffff",
          textDayFontWeight: "400",
          textMonthFontWeight: "600",
          textDayHeaderFontWeight: "500",
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 13,
        }}
        renderArrow={(direction) => (
          <Ionicons
            name={direction === "left" ? "chevron-back" : "chevron-forward"}
            size={20}
            color="#3b82f6"
            style={{ marginTop: 4 }}
          />
        )}
      />
    </View>
  );
};

export default CalendarSection;
