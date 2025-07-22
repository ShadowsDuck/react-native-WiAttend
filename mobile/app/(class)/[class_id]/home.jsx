import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Book1,
  User,
  Key,
  Calendar,
  Clock,
  Location,
  CopySuccess,
} from "iconsax-react-native";
import * as Clipboard from "expo-clipboard";

import Header from "../../../components/Header";
import ClassCard from "../../../components/ClassCard";
import Loading from "../../../components/Loading";
import { useClassroom } from "../../../hooks/useClassroom";

const HomePage = () => {
  const { class_id } = useLocalSearchParams();
  const { classInfo, loading, fetchClassesById } = useClassroom();
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    if (isCopied) return;
    const joinCode = classInfo?.classDetail?.join_code;
    if (joinCode) {
      await Clipboard.setStringAsync(joinCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (class_id) {
        fetchClassesById(class_id);
      }
    }, [class_id])
  );

  const dayOfWeekThai = {
    monday: "จันทร์",
    tuesday: "อังคาร",
    wednesday: "พุธ",
    thursday: "พฤหัสบดี",
    friday: "ศุกร์",
    saturday: "เสาร์",
    sunday: "อาทิตย์",
  };

  // --- Guard Clauses: จัดการสถานะ Loading และ Error ก่อน ---
  if (loading) {
    return <Loading />;
  }

  if (!classInfo || !classInfo.classDetail) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#1A1A1A" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 text-lg">ไม่พบข้อมูลคลาส</Text>
        </View>
      </View>
    );
  }

  // --- เมื่อข้อมูลพร้อมใช้งาน ---
  // สร้างตัวแปรเพื่อความสะอาดของโค้ด
  const classData = classInfo.classDetail;
  const schedulesData = classInfo.classSchedules;
  const memberCountData = classInfo.memberCount;

  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#1A1A1A" />
      <ScrollView contentContainerClassName="py-6 pb-10">
        <View className="mb-6">
          {/* ส่ง object classData ทั้งหมดที่มี owner_name สำเร็จรูปเข้าไป */}
          <ClassCard item={classData} />
        </View>

        <View className="bg-[#1E1E1E] rounded-2xl p-5 mb-6 mx-5">
          <Text className="text-white text-xl font-bold mb-5">
            รายละเอียดคลาส
          </Text>

          {/* สร้างโดย */}
          <View className="flex-row items-center mb-5">
            <View className="w-11 h-11 rounded-full bg-white/5 justify-center items-center mr-4">
              <User size="22" color="#A78BFA" />
            </View>
            <View>
              <Text className="text-[#A0A0A0] text-sm mb-1">สร้างโดย</Text>
              <Text className="text-white text-base font-medium">
                {classData.owner_name}
              </Text>
            </View>
          </View>

          {/* วิชา */}
          <View className="flex-row items-center mb-5">
            <View className="w-11 h-11 rounded-full bg-white/5 justify-center items-center mr-4">
              <Book1 size="22" color="#6366F1" />
            </View>
            <View>
              <Text className="text-[#A0A0A0] text-sm mb-1">วิชา</Text>
              <Text className="text-white text-base font-medium">
                {classData.subject_name || "N/A"}
              </Text>
            </View>
          </View>

          {/* จำนวนสมาชิก */}
          <View className="flex-row items-center mb-5">
            <View className="w-11 h-11 rounded-full bg-white/5 justify-center items-center mr-4">
              <User size="22" color="#34D399" />
            </View>
            <View>
              <Text className="text-[#A0A0A0] text-sm mb-1">จำนวนสมาชิก</Text>
              <Text className="text-white text-base font-medium">
                {memberCountData} คน
              </Text>
            </View>
          </View>

          {/* รหัสเข้าร่วม */}
          <View className="flex-row items-center">
            <View className="w-11 h-11 rounded-full bg-white/5 justify-center items-center mr-4">
              <Key size="22" color="#FBBF24" />
            </View>
            <View className="flex-1">
              <Text className="text-[#A0A0A0] text-sm mb-1.5">
                รหัสเข้าร่วม (แตะเพื่อคัดลอก)
              </Text>
              <TouchableOpacity onPress={copyToClipboard} activeOpacity={0.7}>
                {isCopied ? (
                  <View className="flex-row items-center justify-center font-mono py-2.5 px-3 rounded-lg bg-[#1C3A2E] border border-[#34D399]">
                    <CopySuccess size="18" color="#34D399" variant="Bold" />
                    <Text className="text-[#34D399] text-lg font-bold ml-2">
                      คัดลอกแล้ว!
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[#FBBF24] bg-[#2E2E2E] text-lg font-bold font-mono py-2.5 px-3 rounded-lg text-center">
                    {classData.join_code || "N/A"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ตารางเรียน */}
        {schedulesData?.length > 0 && (
          <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Calendar size={20} color="#A78BFA" style={{ marginTop: 2 }} />
              <Text className="text-white text-xl font-bold">ตารางเรียน</Text>
            </View>
            {schedulesData.map((schedule, index) => (
              <View key={index} className="bg-[#2C2C2C] rounded-xl p-4 mb-3">
                <Text className="text-white text-lg font-bold mb-3">
                  วัน
                  {dayOfWeekThai[schedule.day_of_week.toLowerCase()] ||
                    schedule.day_of_week}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Clock size="16" color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">
                    {schedule.start_time} - {schedule.end_time}
                  </Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Location size="16" color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-2">
                    ห้อง: {schedule.room_id}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomePage;
