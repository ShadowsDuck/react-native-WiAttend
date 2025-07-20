import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import BackButton from "../../components/BackButton";
import { useRouter } from "expo-router";
import Input from "../../components/Input";
import { useState } from "react";
import DatePicker from "../../components/DatePicker";
import { useClassroom } from "../../hooks/useClassroom";
import Loading from "../../components/Loading";

const CreateClassroom = () => {
  const router = useRouter();

  const { loading, createClassroom } = useClassroom();

  const [subjectName, setSubjectName] = useState("");
  const [semesterStartDate, setSemesterStartDate] = useState("");
  const [semesterWeeks, setSemesterWeeks] = useState("");

  const handleCreate = async () => {
    try {
      if (
        !subjectName?.trim() ||
        !semesterStartDate?.trim() ||
        !semesterWeeks?.trim()
      ) {
        Alert.alert("สร้างชั้นเรียน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      await createClassroom({
        subject_name: subjectName.trim(),
        semester_start_date: semesterStartDate.trim(),
        semester_weeks: semesterWeeks.trim(),
      });

      Alert.alert("สร้างสำเร็จ", "สร้างชั้นเรียนของคุณสำเร็จแล้ว");
      router.replace("/");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("ผิดพลาด", "ไม่สามารถสร้างชั้นเรียนได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (loading) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-center mt-5 gap-10 mx-8">
        <BackButton router={router} />
        <Text className="text-white font-semibold text-4xl">
          สร้างชั้นเรียน
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="flex-1 px-5 mt-10">
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
          />

          <TouchableOpacity
            className="bg-[#0F56B3] py-4 mt-5 rounded-xl"
            onPress={handleCreate}
          >
            <Text className="text-white text-center font-semibold">
              สร้างชั้นเรียน
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateClassroom;
