import {
  View,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import FloatingButton from "../../components/FloatingButton";
import ClassCard from "../../components/ClassCard";
import Loading from "../../components/Loading";
import { useClassroom } from "../../hooks/useClassroom";
import { useRouter } from "expo-router";
import { StatusBarBackground } from "@/components/StatusBar";

export default function App() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { classrooms, loading, error, fetchUserClasses } = useClassroom();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoaded && user) fetchUserClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserClasses();
    setRefreshing(false);
  };

  if (loading && !refreshing) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBarBackground />

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

      {error ? (
        <Text className="text-red-400 text-center mt-10">เกิดข้อผิดพลาด</Text>
      ) : classrooms.length === 0 ? (
        <Text className="text-gray-400 text-center mt-10">ไม่มีชั้นเรียน</Text>
      ) : (
        <FlatList
          data={classrooms}
          renderItem={({ item }) => <ClassCard item={item} />}
          keyExtractor={(item) => item.class_id.toString()}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          ListHeaderComponent={() => (
            <Text className="text-gray-400 text-sm px-6 mb-2 mt-4">
              ชั้นเรียนที่คุณเข้าร่วม
            </Text>
          )}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />
      )}
      <FloatingButton />
    </View>
  );
}
