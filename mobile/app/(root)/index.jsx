import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import FloatingButton from "../../components/FloatingButton";
import { useClassroom } from "../../hooks/useClassroom";
import { useEffect, useState } from "react";
import Loading from "../../components/Loading";

export default function App() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const { classrooms, loading, error, fetchUserClasses } = useClassroom();

  const [refreshing, setRefreshing] = useState(false);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserClasses();
    }
  }, [isLoaded]);

  // ฟังก์ชันดึงข้อมูลใหม่เวลารีเฟรช
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserClasses();
    setRefreshing(false);
  };

  // Render item แต่ละอัน
  const renderClassroomItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/classroom/${item.class_id}`)}
      className="bg-gray-800 p-4 m-2 rounded-lg"
    >
      <Text className="text-white text-lg font-semibold">
        {item.subject_name}
      </Text>
      <Text className="text-gray-400">Owner ID: {item.owner_user_id}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-5 mt-5 px-8">
        <View className="flex-row items-end">
          <Text className="text-3xl font-semibold text-white">WiAttend</Text>
          <Text className="text-[24px] font-medium text-gray-300 ml-2">
            Classroom
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-500" />
          )}
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-2">กำลังโหลด...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-400 text-lg">เกิดข้อผิดพลาด</Text>
          <TouchableOpacity
            onPress={fetchUserClasses}
            className="mt-4 bg-blue-500 p-2 rounded"
          >
            <Text className="text-white">ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      ) : classrooms.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-lg">ไม่มีชั้นเรียน</Text>
        </View>
      ) : (
        <FlatList
          data={classrooms}
          renderItem={renderClassroomItem}
          keyExtractor={(item) => item.class_id.toString()}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <FloatingButton />
    </View>
  );
}
