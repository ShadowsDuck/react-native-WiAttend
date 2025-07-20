import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import BackButton from "../../components/BackButton";
import Input from "../../components/Input";
import { useState } from "react";
import { useClassroom } from "../../hooks/useClassroom";
import Loading from "../../components/Loading";

const JoinClassroom = () => {
  const router = useRouter();

  const { loading, joinClassroom } = useClassroom();

  const [joinCode, setJoinCode] = useState("");

  const handleCreate = async () => {
    try {
      if (!joinCode?.trim()) {
        Alert.alert("รหัสชั้นเรียนผิด", "กรุณากรอกรหัสชั้นเรียนให้ถูกต้อง");
        return;
      }

      await joinClassroom({
        join_code: joinCode.trim(),
      });

      Alert.alert("เข้าร่วมสำเร็จ", "เข้าร่วมชั้นเรียนสำเร็จแล้ว");
      router.replace("/");
    } catch (error) {
      console.error("❌ Update error:", error);

      if (error?.response?.status === 409) {
        Alert.alert("เข้าร่วมแล้ว", "คุณเข้าร่วมชั้นเรียนนี้ไปแล้ว");
        return;
      }

      if (error?.response?.status === 404) {
        Alert.alert(
          "ไม่พบชั้นเรียน",
          "รหัสชั้นเรียนไม่ถูกต้อง กรุณาตรวจสอบใหม่"
        );
        return;
      }

      Alert.alert(
        "ผิดพลาด",
        "ไม่สามารถเข้าร่วมชั้นเรียนได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  if (loading) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-center mt-5 gap-10 mx-8">
        <BackButton router={router} />
        <Text className="text-white font-semibold text-4xl">
          เข้าร่วมชั้นเรียน
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="flex-1 px-16 mt-12">
        {/* form */}
        <Text className="text-white text-lg">
          ขอรหัสชั้นเรียนจากอาจารย์ แล้วป้อนรหัสที่นี่
        </Text>
        <View className="gap-5 mt-3">
          <Input
            label="รหัสของชั้นเรียน"
            value={joinCode}
            onChangeText={setJoinCode}
          />

          <TouchableOpacity
            className="bg-[#0F56B3] py-4 mt-5 rounded-xl"
            onPress={handleCreate}
          >
            <Text className="text-white text-center font-semibold">
              เข้าร่วมชั้นเรียน
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default JoinClassroom;
