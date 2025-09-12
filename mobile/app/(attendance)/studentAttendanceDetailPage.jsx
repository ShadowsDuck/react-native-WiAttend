// pages/StudentAttendanceDetailPage.jsx
import { ScrollView, View, Text, StatusBar } from "react-native";
import { useLocalSearchParams } from "expo-router";
import StudentView from "../../components/StudentView";
import Header from "../../components/Header";
import { useStudentAttendanceDetail } from "../../hooks/useStudentAttendanceDetail";
import Loading from "../../components/Loading";

const StudentAttendanceDetailPage = () => {
  const { classId, userId } = useLocalSearchParams();
  const { studentData, loading, error } = useStudentAttendanceDetail(
    classId,
    userId
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-red-400">โหลดข้อมูลไม่สำเร็จ</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-400">ไม่พบข้อมูล</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#121212" }}>
      <Header backgroundColor="#252525" />
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        className="pt-5"
      >
        <View className="px-5">
          <Text className="text-white text-3xl font-bold">
            สรุปการเข้าเรียน
          </Text>
          <Text className="text-gray-400 mt-1">
            ของ {studentData.student.full_name}
          </Text>
        </View>

        <View className="px-5 mt-5">
          <StudentView data={studentData} />
        </View>
      </ScrollView>
    </View>
  );
};

export default StudentAttendanceDetailPage;
