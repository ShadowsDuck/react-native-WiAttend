import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Input from "../../components/Input";
import { useEffect, useState } from "react";
import TimePicker from "../../components/TimePicker";
import Loading from "../../components/Loading";
import Header from "../../components/Header";
import { useSchedule } from "../../hooks/useSchedule";
import Dropdown from "../../components/Dropdown.jsx";
import { useRooms } from "../../hooks/useRooms";
import InfoBox from "../../components/InfoBox.jsx";

const CreateSchedule = () => {
  const { class_id } = useLocalSearchParams();
  const router = useRouter();

  const { loading: isCreating, createSchedule } = useSchedule();
  const { rooms, loading: roomsLoading, fetchAllRooms } = useRooms();

  const [day_of_week, setDay_of_week] = useState("");
  const [start_time, setStart_time] = useState(null);
  const [end_time, setEnd_time] = useState(null);
  const [checkin_close_after_min, setCheckin_close_after_min] = useState("");
  const [room_id, setRoom_id] = useState("");

  const handleCreate = async () => {
    try {
      if (
        !day_of_week ||
        !start_time ||
        !end_time ||
        !room_id ||
        !checkin_close_after_min.trim()
      ) {
        Alert.alert("สร้างตารางเรียน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      if (start_time >= end_time) {
        Alert.alert(
          "ข้อมูลผิดพลาด",
          "เวลาเริ่มชั้นเรียนต้องอยู่ก่อนเวลาสิ้นสุดชั้นเรียน"
        );
        return;
      }

      const checkinMinutes = parseInt(checkin_close_after_min.trim(), 10);
      if (isNaN(checkinMinutes)) {
        Alert.alert(
          "ข้อมูลผิดพลาด",
          "กรุณากรอก 'ปิดเช็คชื่อหลังจากเริ่มเรียน (นาที)' เป็นตัวเลขเท่านั้น"
        );
        return;
      }

      await createSchedule(class_id, {
        day_of_week,
        start_time,
        end_time,
        checkin_close_after_min: checkinMinutes,
        room_id,
      });

      Alert.alert(
        "สร้างสำเร็จ",
        "สร้างตารางเรียนและคาบเรียนทั้งหมดเรียบร้อยแล้ว"
      );
      router.back();
    } catch (error) {
      console.error(
        "Create schedule error:",
        error.response?.data || error.message
      );

      if (error.response && error.response.status === 409) {
        Alert.alert("ตารางเรียนซ้อน", error.response.data.message);
      } else if (error.response && error.response.status === 400) {
        Alert.alert("ข้อมูลไม่ถูกต้อง", error.response.data.message);
      } else {
        Alert.alert(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถสร้างตารางเรียนได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    }
  };

  useEffect(() => {
    fetchAllRooms();
  }, []);

  if (isCreating) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      <Header
        title="สร้างตารางเรียน"
        backgroundColor="#252525"
        statusBarStyle="light"
        textButton="สร้าง"
        textColor="#1f3d74"
        backgroundColorButton="#a8c6fc"
        onPress={handleCreate}
      />

      {/* CONTENT */}
      <ScrollView className="flex-1 px-16 mt-10">
        {/* form */}
        <View className="gap-5 mt-3">
          <Dropdown
            label="วันที่สอน"
            value={day_of_week}
            onChange={(value) => setDay_of_week(value)}
            items={[
              { label: "วันจันทร์", value: "monday" },
              { label: "วันอังคาร", value: "tuesday" },
              { label: "วันพุธ", value: "wednesday" },
              { label: "วันพฤหัสบดี", value: "thursday" },
              { label: "วันศุกร์", value: "friday" },
              { label: "วันเสาร์", value: "saturday" },
              { label: "วันอาทิตย์", value: "sunday" },
            ]}
            search={false}
          />

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
            value={checkin_close_after_min}
            onChangeText={setCheckin_close_after_min}
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
        </View>

        <InfoBox
          text="โปรดตรวจสอบข้อมูลให้ถูกต้อง"
          subText="เนื่องจาก “วันที่สอน” จะไม่สามารถแก้ไขได้ในภายหลัง"
        />
      </ScrollView>
    </View>
  );
};

export default CreateSchedule;
