import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useGlobalSearchParams } from "expo-router";
import { useAttendanceSummary } from "../../../hooks/useAttendanceSummary";
import ProfessorView from "../../../components/ProfessorView";
import StudentView from "../../../components/StudentView";
import Header from "../../../components/Header";

export default function SummaryPage() {
  const { class_id } = useGlobalSearchParams();
  const { data, loading, fetchSummary } = useAttendanceSummary();

  useEffect(() => {
    if (class_id) {
      fetchSummary(class_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [class_id]);

  if (loading || !data) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#121212" }}
      >
        <ActivityIndicator size="large" color="#fff" />
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
