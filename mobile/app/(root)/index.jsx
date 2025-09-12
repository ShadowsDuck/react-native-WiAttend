// index.jsx
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  Image,
  BackHandler,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import FloatingButton from "../../components/FloatingButton";
import ClassCard from "../../components/ClassCard";
import { useClasses } from "../../hooks/useClasses";
import { StatusBarBackground } from "@/components/StatusBar";
import Loading from "../../components/Loading";

export default function App() {
  const router = useRouter();
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();

  const { classes, loading, hasInitialized, error, fetchUserClasses } =
    useClasses();

  // Hook สำหรับดึงข้อมูล
  useFocusEffect(
    useCallback(() => {
      if (isLoaded && isSignedIn && user) {
        fetchUserClasses();
      }
    }, [isLoaded, isSignedIn, user])
  );

  // Hook สำหรับจัดการปุ่ม Back
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

  if (!isLoaded || !hasInitialized) {
    return <Loading />;
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-[#121212] px-4">
        <Text className="text-red-400 text-center text-lg mb-4">
          เกิดข้อผิดพลาดในการโหลดข้อมูล
        </Text>
        <Text className="text-gray-400 text-center text-sm mb-6">
          กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ
        </Text>
        <TouchableOpacity
          onPress={() => fetchUserClasses()} // การกดปุ่มนี้จะเริ่มกระบวนการ Retry อัตโนมัติใหม่
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">ลองอีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBarBackground />
      {/* HEADER */}
      <View className="flex-row items-center justify-between mt-5 mb-5 px-8">
        <View className="flex-row items-end">
          <Text className="text-3xl font-semibold text-white">WiAttend</Text>
          <Text className="text-2xl font-medium text-[#E0E0E0] ml-2">
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

      {/* BODY */}
      {classes.length === 0 ? (
        // ตอนนี้เงื่อนไขนี้จะทำงานเฉพาะเมื่อโหลดเสร็จสมบูรณ์และไม่มีคลาสจริงๆ
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-center text-base">
            ยังไม่มีชั้นเรียน
          </Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={({ item }) => <ClassCard item={item} />}
          keyExtractor={(item) => item.class_id.toString()}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchUserClasses}
              tintColor="#6366F1"
              colors={["#6366F1"]}
              progressBackgroundColor="#1E1E1E"
            />
          }
          ListHeaderComponent={() => (
            <Text className="text-gray-500 text-sm mb-2 mt-2 px-5">
              ชั้นเรียนที่คุณเข้าร่วม
            </Text>
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
        />
      )}
      <FloatingButton />
    </View>
  );
}
