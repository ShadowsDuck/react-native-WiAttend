import { View, ScrollView, Alert, TouchableOpacity, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useClasses } from "../../hooks/useClasses";
import Loading from "../../components/Loading";
import Header from "../../components/Header";
import Input from "../../components/Input";
import DisplayField from "../../components/DisplayField";
import { Ionicons } from "@expo/vector-icons";

const EditClassPage = () => {
  const router = useRouter();
  const { class_id } = useLocalSearchParams();

  const [subjectName, setSubjectName] = useState("");

  const {
    classData,
    loading,
    fetchClassById,
    updateClassesById,
    deleteClassById,
  } = useClasses();

  // ดึงข้อมูลคลาสเมื่อเข้าสู่หน้าจอ
  useEffect(() => {
    if (class_id) {
      fetchClassById(class_id);
    }
  }, [class_id]);

  // อัปเดต State ของฟอร์มเมื่อข้อมูลจาก API มาถึง
  useEffect(() => {
    if (classData?.classDetail?.subject_name) {
      setSubjectName(classData.classDetail.subject_name);
    }
  }, [classData]);

  const handleSave = async () => {
    if (!subjectName?.trim()) {
      Alert.alert("แก้ไขชั้นเรียน", "กรุณากรอกชื่อชั้นเรียน");
      return;
    }

    try {
      await updateClassesById(class_id, {
        subject_name: subjectName.trim(),
      });

      Alert.alert("สำเร็จ", "อัปเดตข้อมูลเรียบร้อยแล้ว");
      router.back();
    } catch (error) {
      Alert.alert(
        "ผิดพลาด",
        error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
      console.error("❌ Error updating class:", error);
    }
  };

  const handleDeleteClass = async () => {
    try {
      const success = await deleteClassById(class_id);
      if (success) {
        Alert.alert("สำเร็จ", "ลบชั้นเรียนเรียบร้อยแล้ว");
        router.replace("/");
      }
    } catch (error) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.response?.data?.message || "ไม่สามารถลบชั้นเรียนได้"
      );
      console.error("❌ Error deleting class:", error);
    }
  };

  if (loading && !classData) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <Header
        title="แก้ไขชั้นเรียน"
        backgroundColor="#252525"
        statusBarStyle="light"
        textButton={loading ? "กำลังบันทึก..." : "บันทึก"}
        textColor="#1f3d74"
        backgroundColorButton="#a8c6fc"
        onPress={handleSave}
        disabled={loading}
      />

      {/* CONTENT */}
      <ScrollView className="flex-1 px-5 md:px-16 mt-10">
        <View className="gap-5 mt-3">
          {/* ส่วนที่แก้ไขได้ */}
          <Input
            label="ชื่อชั้นเรียน"
            value={subjectName}
            onChangeText={setSubjectName}
          />

          {/* DisplayField เพื่อแสดงข้อมูลที่แก้ไขไม่ได้ */}
          <DisplayField
            label="วันที่เริ่มต้นภาคเรียน (ไม่สามารถแก้ไขได้)"
            value={
              classData?.classDetail?.semester_start_date
                ? new Date(
                    classData.classDetail.semester_start_date
                  ).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    calendar: "buddhist",
                  })
                : "กำลังโหลด..."
            }
            iconName="calendar-outline"
          />

          <DisplayField
            label="ระยะเวลาการสอน (ไม่สามารถแก้ไขได้)"
            value={
              classData?.classDetail?.semester_weeks
                ? `${classData.classDetail.semester_weeks} สัปดาห์`
                : "กำลังโหลด..."
            }
            iconName="time-outline"
          />

          <View className="border-t border-gray-700 my-4" />

          {/* ปุ่มลบ */}
          <TouchableOpacity
            className={`flex-row items-center justify-center py-3 px-5 rounded-xl bg-red-600 ${loading ? "opacity-50" : "active:bg-red-700"}`}
            disabled={loading}
            onPress={() => {
              Alert.alert(
                "ยืนยันการลบ",
                "คุณแน่ใจหรือไม่ว่าต้องการลบชั้นเรียนนี้? \nการกระทำนี้ไม่สามารถย้อนกลับได้ และข้อมูลทั้งหมดของชั้นเรียนจะถูกลบไปด้วย",
                [
                  { text: "ยกเลิก", style: "cancel" },
                  {
                    text: "ลบ",
                    style: "destructive",
                    onPress: handleDeleteClass,
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
