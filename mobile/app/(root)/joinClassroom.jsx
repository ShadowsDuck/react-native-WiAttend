import { useRouter } from "expo-router";
import { View, Text, ScrollView, Alert } from "react-native";
import Input from "../../components/Input";
import { useState } from "react";
import { useClassroom } from "../../hooks/useClassroom";
import Loading from "../../components/Loading";
import Header from "../../components/Header";

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
      <Header
        title="เข้าร่วมชั้นเรียน"
        backgroundColor="#292a2c"
        statusBarStyle="light"
        textButton="เข้าร่วม"
        textColor="#1f3d74"
        backgroundColorButton="#a8c6fc"
        onPress={handleCreate}
      />

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
        </View>
      </ScrollView>
    </View>
  );
};

export default JoinClassroom;
