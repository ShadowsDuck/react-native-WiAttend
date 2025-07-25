import { View, ScrollView, Alert, TouchableOpacity, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useClasses } from "../../hooks/useClasses";
import Loading from "../../components/Loading";
import Header from "../../components/Header";
import Input from "../../components/Input";
import DatePicker from "../../components/DatePicker";
import { Ionicons } from "@expo/vector-icons";

const EditClassPage = () => {
  const router = useRouter();
  const { class_id } = useLocalSearchParams();

  // Hook สำหรับจัดการข้อมูล API
  const {
    classData,
    loading,
    fetchClassById,
    updateClassesById,
    deleteClassById,
  } = useClasses();

  // 👈 1. เปลี่ยนมาใช้ useState แบบแยกตัวแปร เหมือนกับหน้า CreateClassroom
  const [subjectName, setSubjectName] = useState("");
  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [semesterWeeks, setSemesterWeeks] = useState("");

  // Effect ที่ 1: ดึงข้อมูลคลาสเมื่อเข้าสู่หน้าจอ
  useEffect(() => {
    if (class_id) {
      fetchClassById(class_id);
    }
  }, [class_id]); // Dependency คือ class_id เท่านั้น

  // Effect ที่ 2: อัปเดต State ของฟอร์มเมื่อข้อมูลจาก API มาถึง
  useEffect(() => {
    if (classData && classData.classDetail) {
      const details = classData.classDetail;
      setSubjectName(details.subject_name || "");
      setSemesterStartDate(details.semester_start_date || "");
      setSemesterWeeks(
        details.semester_weeks ? String(details.semester_weeks) : ""
      );
    }
  }, [classData]);

  // 👈 2. ปรับปรุง handleSave ให้ใช้ State แบบใหม่
  const handleSave = async () => {
    try {
      if (
        !subjectName?.trim() ||
        !semesterStartDate?.trim() ||
        !semesterWeeks?.trim()
      ) {
        Alert.alert("แก้ไขชั้นเรียน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      const semesterWeeksNumber = Number(semesterWeeks.trim());
      if (isNaN(semesterWeeksNumber) || semesterWeeksNumber <= 0) {
        Alert.alert("ข้อมูลผิดพลาด", "จำนวนสัปดาห์ต้องเป็นตัวเลขที่มากกว่า 0");
        return;
      }

      await updateClassesById(class_id, {
        subject_name: subjectName.trim(),
        semester_start_date: semesterStartDate.trim(),
        semester_weeks: semesterWeeksNumber,
      });

      Alert.alert("สำเร็จ", "อัปเดตข้อมูลเรียบร้อยแล้ว");
      router.back();
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
      console.error("❌ Error updating class:", error);
    }
  };

  const handleDeleteClass = async () => {
    try {
      // 1. เรียกใช้ฟังก์ชันลบจาก Hook
      const success = await deleteClassById(class_id);

      // 2. ถ้าสำเร็จ (ฟังก์ชันคืนค่า true) ให้แสดง Alert และนำทาง
      if (success) {
        Alert.alert("สำเร็จ", "ลบชั้นเรียนเรียบร้อยแล้ว");
        router.replace("/");
      }
    } catch (error) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถลบชั้นเรียนได้ กรุณาลองใหม่อีกครั้ง"
      );
      console.error("❌ Error deleting class:", error);
    }
  };

  // เงื่อนไข Loading, จะแสดงเฉพาะตอน fetch ข้อมูลครั้งแรก
  if (loading && !classData) {
    return <Loading />;
  }

  // 👈 3. นำโครงสร้าง UI จาก CreateClassroom.jsx มาใช้ทั้งหมด
  return (
    <View className="flex-1 bg-[#121212]">
      <Header
        title="แก้ไขชั้นเรียน"
        backgroundColor="#252525"
        statusBarStyle="light"
        textButton="บันทึก"
        textColor="#1f3d74"
        backgroundColorButton="#a8c6fc"
        onPress={handleSave}
      />

      {/* CONTENT */}
      <ScrollView className="flex-1 px-16 mt-10">
        {/* form */}
        <View className="gap-5 mt-3">
          <Input
            label="ชื่อชั้นเรียน"
            value={subjectName}
            onChangeText={setSubjectName}
          />

          <DatePicker
            label="วันที่เริ่มต้นภาคเรียน"
            value={semesterStartDate}
            onChange={setSemesterStartDate}
          />

          <Input
            label="ระยะเวลาการสอน (สัปดาห์)"
            value={semesterWeeks}
            onChangeText={setSemesterWeeks}
            keyboardType="numeric"
          />

          <TouchableOpacity
            className="flex-row items-center justify-center py-3 px-5 rounded-xl bg-red-600 active:bg-red-700"
            onPress={() => {
              Alert.alert(
                "ยืนยันการลบ",
                "คุณแน่ใจหรือไม่ว่าต้องการลบชั้นเรียนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
                [
                  { text: "ยกเลิก", style: "cancel" },
                  {
                    text: "ลบ",
                    style: "destructive",
                    onPress: () => handleDeleteClass(),
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              ลบชั้นเรียน
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditClassPage;
