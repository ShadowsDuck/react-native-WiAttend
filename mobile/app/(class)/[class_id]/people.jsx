import {
  View,
  Text,
  ScrollView,
  Image,
  Button,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import Header from "../../../components/Header";
import { router, useGlobalSearchParams } from "expo-router";
import { useClassMembers } from "../../../hooks/useClassMembers";
import Loading from "../../../components/Loading";

// --- คอมโพเนนต์สำหรับแสดงรายชื่อ ---
const PersonRow = ({ name, avatar }) => (
  <View className="flex-row items-center py-3">
    <Image source={{ uri: avatar }} className="w-12 h-12 rounded-full" />
    <Text className="ml-4 text-base text-white flex-1">{name}</Text>
  </View>
);

// --- คอมโพเนนต์หลักของหน้า ---
const PeoplePage = () => {
  const { class_id } = useGlobalSearchParams();
  const { membersData, loading, error, refetch } = useClassMembers(class_id);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ฟังก์ชันสำหรับ Pull to Refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // --- แสดงสถานะขณะโหลดข้อมูล ---
  if (loading) {
    return <Loading />;
  }

  // --- แสดงข้อความเมื่อเกิดข้อผิดพลาด ---
  if (error) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header
          backgroundColor="#252525"
          onBackPress={() => router.push("/")}
        />
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
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-red-500 mb-4 text-lg text-center">
              ไม่สามารถโหลดข้อมูลได้
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-6">
              ลองดึงหน้าจอลงเพื่อรีเฟรช หรือกดปุ่มด้านล่าง
            </Text>
            <Button title="ลองอีกครั้ง" onPress={refetch} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#252525" onBackPress={() => router.push("/")} />

      {/* แสดงตัวบ่งชี้การรีเฟรช */}
      {isRefreshing && (
        <View className="absolute top-20 right-5 z-10 bg-blue-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs">กำลังอัพเดต...</Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
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
        <View className="p-6">
          {/* --- ส่วนของอาจารย์ --- */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-2xl font-semibold">อาจารย์</Text>
            </View>
            <View className="border-b border-gray-600" />

            {membersData.teacher && (
              <PersonRow
                name={membersData.teacher.fullName}
                avatar={membersData.teacher.imageUrl}
              />
            )}
          </View>

          {/* --- ส่วนของ Students --- */}
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-2xl font-semibold">
                เพื่อนร่วมชั้น
              </Text>
              <Text className="text-gray-500 text-lg">
                นักเรียนทั้งหมด {membersData.students?.length || 0} คน
              </Text>
            </View>
            <View className="border-b border-gray-600" />

            {membersData.students?.length === 0 ? (
              <View className="flex items-center justify-center p-10">
                <Text className="text-gray-400 text-base mt-8">
                  ยังไม่มีนักเรียนในชั้นเรียนนี้
                </Text>
              </View>
            ) : (
              membersData.students?.map((student) => (
                <PersonRow
                  key={student.userId}
                  name={student.fullName}
                  avatar={student.imageUrl}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PeoplePage;
