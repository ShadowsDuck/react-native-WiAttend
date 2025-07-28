import { View, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useClasses } from "../../hooks/useClasses";

// --- Components ---
import Header from "../../components/Header";
import Input from "../../components/Input";
import DatePicker from "../../components/DatePicker";
import Loading from "../../components/Loading";
import InfoBox from "../../components/InfoBox";

const CreateClassroom = () => {
  const router = useRouter();

  const { loading, createClass } = useClasses();

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

      const semesterWeeksNumber = Number(semesterWeeks.trim());

      if (isNaN(semesterWeeksNumber)) {
        Alert.alert(
          "ข้อมูลผิดพลาด",
          "ระยะเวลาการสอน (สัปดาห์) ต้องเป็นตัวเลขเท่านั้น"
        );
        return;
      }

      if (semesterWeeksNumber <= 0) {
        Alert.alert(
          "ข้อมูลไม่ถูกต้อง",
          "ระยะเวลาการสอนต้องมีอย่างน้อย 1 สัปดาห์"
        );
        return;
      }

      if (semesterWeeksNumber > 48) {
        Alert.alert(
          "ข้อมูลไม่สมเหตุสมผล",
          "ระยะเวลาการสอนไม่ควรเกิน 48 สัปดาห์ (ประมาณ 1 ปี)"
        );
        return;
      }

      await createClass({
        subject_name: subjectName.trim(),
        semester_start_date: semesterStartDate.trim(),
        semester_weeks: semesterWeeksNumber,
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
      <Header
        title="สร้างชั้นเรียน"
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
        </View>

        <InfoBox
          text="โปรดตรวจสอบข้อมูลให้ถูกต้อง"
          subText="เนื่องจาก “วันที่เริ่มต้นภาคเรียน” และ “ระยะเวลาการสอน” จะไม่สามารถแก้ไขได้ในภายหลัง"
        />
      </ScrollView>
    </View>
  );
};

export default CreateClassroom;
