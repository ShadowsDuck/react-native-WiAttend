import {
  View,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
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
  const {
    classes,
    loading,
    initialLoading,
    error,
    isRetrying,
    retryAttempt,
    retryMessage,
    fetchUserClasses,
  } = useClasses();

  useFocusEffect(
    useCallback(() => {
      if (isLoaded && isSignedIn && user) {
        fetchUserClasses();
      }
    }, [isLoaded, isSignedIn, user, fetchUserClasses])
  );

  // Hook สำหรับจัดการปุ่ม Back
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // เมื่ออยู่ที่หน้าหลัก (index) ให้ทำการออกจากแอป
        BackHandler.exitApp();
        return true;
      };

      // เพิ่ม Event Listener เมื่อหน้าจอนี้ถูก focus
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // คืนค่าฟังก์ชันสำหรับลบ Listener ออกเมื่อออกจากหน้าจอนี้
      return () => subscription.remove();
    }, [])
  );

  if (!isLoaded || initialLoading) {
    return <Loading />;
  }

  if (isRetrying) {
    return (
      <View className="flex-1 justify-center items-center bg-[#121212]">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4 text-base">{retryMessage}</Text>
        <Text className="text-gray-400 text-2xl mt-2 text-center">
          ●{"●".repeat(retryAttempt)}
          {"○".repeat(2 - retryAttempt)}
        </Text>
      </View>
    );
  }

  if (error) {
    const isServerError =
      typeof error.response?.data === "string" &&
      error.response.data.includes("<!DOCTYPE html>");

    return (
      <View className="flex-1 justify-center items-center bg-[#121212] px-4">
        <Text className="text-red-400 text-center text-base mb-4">
          {isServerError
            ? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
            : "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
        </Text>
        <TouchableOpacity
          onPress={() => fetchUserClasses()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">ลองใหม่อีกครั้ง</Text>
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
          className="px-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchUserClasses({ isRefresh: true })}
              tintColor="#ffffff"
            />
          }
          ListHeaderComponent={() => (
            <Text className="text-gray-500 text-sm mb-2 mt-4 px-2">
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
