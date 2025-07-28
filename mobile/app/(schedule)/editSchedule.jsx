import { View, ScrollView, Alert, TouchableOpacity, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

// --- Hooks & Constants & Utils ---
import { useSchedule } from "../../hooks/useSchedule";
import { useRooms } from "../../hooks/useRooms";
import { DAY_OF_WEEK_THAI } from "../../utils/dayOfWeekThai.js";
import { formatTimeToHHMM } from "../../utils/formatTimeToHHMM.js";

// --- Components ---
import Loading from "../../components/Loading";
import Header from "../../components/Header";
import Input from "../../components/Input";
import DisplayField from "../../components/DisplayField";
import TimePicker from "../../components/TimePicker";
import Dropdown from "../../components/Dropdown.jsx";

const EditSchedulePage = () => {
  const router = useRouter();
  const { schedule_id } = useLocalSearchParams();

  const [start_time, setStart_time] = useState(null);
  const [end_time, setEnd_time] = useState(null);
  const [checkinClose, setCheckinClose] = useState("");
  const [room_id, setRoom_id] = useState(null);

  const {
    loading,
    scheduleData,
    fetchScheduleById,
    updateScheduleById,
    deleteScheduleById,
  } = useSchedule();
  const { rooms, loading: roomsLoading, fetchAllRooms } = useRooms();

  // ดึงข้อมูลตารางเรียนเมื่อเข้าสู่หน้าจอ
  useEffect(() => {
    if (schedule_id) {
      fetchScheduleById(schedule_id);
    }
  }, [schedule_id]);

  useEffect(() => {
    fetchAllRooms();
  }, []);

  // useEffect สำหรับอัปเดต State
  useEffect(() => {
    if (scheduleData) {
      // ฟังก์ชันช่วยในการแปลงสตริงเวลา (HH:mm:ss) ให้เป็นออบเจกต์ Date
      const timeStringToDate = (timeString) => {
        if (!timeString || !timeString.includes(":")) {
          return null;
        }
        const [hours, minutes, seconds] = timeString.split(":");
        const date = new Date();
        date.setHours(
          parseInt(hours, 10),
          parseInt(minutes, 10),
          parseInt(seconds, 10)
        );
        return date;
      };

      setStart_time(timeStringToDate(scheduleData.start_time));
      setEnd_time(timeStringToDate(scheduleData.end_time));

      if (scheduleData.checkin_close_after_min !== undefined) {
        setCheckinClose(String(scheduleData.checkin_close_after_min));
      }

      if (scheduleData.room_id) {
        setRoom_id(String(scheduleData.room_id));
      }
    }
  }, [scheduleData]);

  const handleSave = async () => {
    try {
      if (!start_time || !end_time || !room_id || !checkinClose.trim()) {
        Alert.alert("สร้างคาบเรียน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      const startTimeFormatted = formatTimeToHHMM(start_time);
      const endTimeFormatted = formatTimeToHHMM(end_time);

      if (startTimeFormatted >= endTimeFormatted) {
        Alert.alert(
          "ข้อมูลผิดพลาด",
          "เวลาเริ่มชั้นเรียนต้องอยู่ก่อนเวลาสิ้นสุดชั้นเรียน"
        );
        return;
      }

      const checkinMinutes = parseInt(checkinClose.trim(), 10);
      if (isNaN(checkinMinutes)) {
        Alert.alert(
          "ข้อมูลผิดพลาด",
          "กรุณากรอก 'ปิดเช็คชื่อหลังจากเริ่มเรียน (นาที)' เป็นตัวเลขเท่านั้น"
        );
        return;
      }
      if (checkinMinutes < 0) {
        Alert.alert(
          "ข้อมูลไม่ถูกต้อง",
          "ปิดเช็คชื่อหลังจากเริ่มเรียน ต้องมีค่าไม่น้อยกว่า 0 นาที"
        );
        return;
      }

      await updateScheduleById(schedule_id, {
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        checkin_close_after_min: checkinMinutes,
        room_id: room_id,
      });

      Alert.alert("สำเร็จ", "อัปเดตข้อมูลเรียบร้อยแล้ว");
      router.back();
    } catch (error) {
      Alert.alert(
        "ผิดพลาด",
        error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
      console.error("❌ Error updating schedule:", error);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      const success = await deleteScheduleById(schedule_id);
      if (success) {
        Alert.alert("สำเร็จ", "ลบตารางเรียนเรียบร้อยแล้ว");
        router.back();
      }
    } catch (error) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.response?.data?.message || "ไม่สามารถลบตารางเรียนได้"
      );
      console.error("❌ Error deleting class:", error);
    }
  };

  const getThaiDayOfWeek = (dayOfWeek) => {
    if (!dayOfWeek) return "กำลังโหลด...";

    const day = dayOfWeek.toLowerCase();
    return DAY_OF_WEEK_THAI[day] || dayOfWeek;
  };

  if (loading && !scheduleData) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <Header
        title="แก้ไขตารางเรียน"
        backgroundColor="#252525"
        statusBarStyle="light"
        textButton={loading ? "กำลังบันทึก..." : "บันทึก"}
        textColor="#1f3d74"
        backgroundColorButton="#a8c6fc"
        onPress={handleSave}
        disabled={loading}
      />

      {/* CONTENT */}
      <ScrollView className="flex-1 px-16 mt-10">
        <View className="gap-4 mt-3">
          {/* ส่วนที่แก้ไขได้ */}
          <TimePicker
            label="เวลาเริ่มสอน"
            value={start_time}
            onChange={setStart_time}
          />

          <TimePicker
            label="เวลาสิ้นสุด"
            value={end_time}
            onChange={setEnd_time}
          />

          <Input
            label="ปิดเช็คชื่อหลังจากเริ่มเรียน (นาที)"
            value={checkinClose}
            onChangeText={setCheckinClose}
            keyboardType="numeric"
          />

          <Dropdown
            label="ห้องเรียน"
            value={room_id}
            onChange={(value) => setRoom_id(value)}
            items={rooms.map((room) => ({
              label: room.room_id,
              value: room.room_id,
            }))}
            disabled={roomsLoading}
          />

          {/* DisplayField เพื่อแสดงข้อมูลที่แก้ไขไม่ได้ */}
          <DisplayField
            label="วันที่สอน (ไม่สามารถแก้ไขได้)"
            value={`วัน${getThaiDayOfWeek(scheduleData?.day_of_week)}`}
            iconName="calendar-outline"
          />

          <View className="border-t border-gray-700 my-5" />

          {/* ปุ่มลบ */}
          <TouchableOpacity
            className={`flex-row items-center justify-center py-3 px-5 rounded-xl bg-red-600 ${loading ? "opacity-50" : "active:bg-red-700"}`}
            disabled={loading}
            onPress={() => {
              Alert.alert(
                "ยืนยันการลบ",
                "ต้องการลบตารางเรียนนี้ใช่ไหม?\nข้อมูลการเช็คชื่อทั้งหมดจะถูกลบไปด้วยและไม่สามารถกู้คืนได้",
                [
                  { text: "ยกเลิก", style: "cancel" },
                  {
                    text: "ลบ",
                    style: "destructive",
                    onPress: handleDeleteSchedule,
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              ลบตารางเรียน
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditSchedulePage;
