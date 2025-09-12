import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { router, useGlobalSearchParams } from "expo-router";
import { useAttendanceSummary } from "../../../hooks/useAttendanceSummary";
import ProfessorView from "../../../components/ProfessorView";
import StudentView from "../../../components/StudentView";
import Header from "../../../components/Header";
import Loading from "../../../components/Loading";

export default function SummaryPage() {
  const { class_id } = useGlobalSearchParams();
  const { data, loading, fetchSummary } = useAttendanceSummary();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (class_id) {
      fetchSummary(class_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [class_id]);

  // ฟังก์ชันสำหรับ Pull to Refresh
  const onRefresh = useCallback(async () => {
    if (!class_id) return;

    setIsRefreshing(true);
    try {
      await fetchSummary(class_id);
    } finally {
      setIsRefreshing(false);
    }
  }, [class_id, fetchSummary]);

  if (loading || !data) {
    return <Loading />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#121212" }}>
      <Header backgroundColor="#252525" onBackPress={() => router.push("/")} />
      <StatusBar barStyle="light-content" />

      {/* แสดงตัวบ่งชี้การรีเฟรช เมื่อกำลังอัปเดตข้อมูล */}
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
          <Text className="text-gray-400 mt-1">
            {data.isOwner ? "ภาพรวมสำหรับอาจารย์" : "สำหรับนักศึกษา"}
          </Text>
        </View>

        <View className="px-5 mt-5">
          {data.isOwner ? (
            <ProfessorView data={data} />
          ) : (
            <StudentView data={data} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
