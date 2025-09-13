import {
  ScrollView,
  View,
  Text,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import StudentView from "../../components/StudentView";
import Header from "../../components/Header";
import { useStudentAttendanceDetail } from "../../hooks/useStudentAttendanceDetail";
import Loading from "../../components/Loading";

const StudentAttendanceDetailPage = () => {
  const { classId, userId } = useLocalSearchParams();
  const { studentData, loading, error, refetch } = useStudentAttendanceDetail(
    classId,
    userId
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ฟังก์ชันสำหรับ Pull to Refresh
  const onRefresh = useCallback(async () => {
    if (!classId || !userId) return;

    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [classId, userId, refetch]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" />
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={["#6366F1"]}
              progressBackgroundColor="#1E1E1E"
            />
          }
        >
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-red-400 text-lg text-center mb-2">
              โหลดข้อมูลไม่สำเร็จ
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              ลองดึงหน้าจอลงเพื่อรีเฟรช
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" />
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={["#6366F1"]}
              progressBackgroundColor="#1E1E1E"
            />
          }
        >
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-gray-400 text-lg text-center mb-2">
              ไม่พบข้อมูล
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              ลองดึงหน้าจอลงเพื่อรีเฟรช
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#121212" }}>
      <Header backgroundColor="#252525" />
      <StatusBar barStyle="light-content" />

      {/* แสดงตัวบ่งชี้การรีเฟรช */}
      {isRefreshing && (
        <View className="absolute top-20 right-5 z-10 bg-blue-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs">กำลังอัพเดต...</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        className="pt-5"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={["#6366F1"]}
            progressBackgroundColor="#1E1E1E"
          />
        }
      >
        <View className="px-5">
          <Text className="text-white text-3xl font-bold">
            สรุปการเข้าเรียน
          </Text>
          <View>
            <Text className="text-gray-300 text-lg mt-2">
              ของ {studentData.student.full_name}
            </Text>
            <Text className="text-gray-400 mt-2">
              รหัสนิสิต {studentData?.student?.student_id || "null"} ชั้นปีที่{" "}
              {studentData?.student?.year || "null"} สาขา{" "}
              {studentData?.student?.major || "null"}
            </Text>
          </View>
        </View>

        <View className="px-5 mt-5">
          <StudentView data={studentData} />
        </View>
      </ScrollView>
    </View>
  );
};

export default StudentAttendanceDetailPage;
