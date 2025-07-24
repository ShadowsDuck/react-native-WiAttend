import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
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
import { DAY_OF_WEEK_THAI } from "../../../constants/dayOfWeekThai";
import CheckInButton from "../../../components/CheckInButton";
import CheckButton from "../../../components/CheckButton";
import { useCheckInProcess } from "../../../hooks/useCheckInProcess";

const HomePage = () => {
  const { class_id } = useLocalSearchParams();
  const { classInfo, loading, fetchClassesById } = useClassroom();
  const { isCheckingIn, attemptCheckIn } = useCheckInProcess();
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    if (isCopied) return;
    const joinCode = classInfo?.classDetail?.join_code;
    if (joinCode) {
      await Clipboard.setStringAsync(joinCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (class_id) {
        fetchClassesById(class_id);
      }
    }, [class_id, fetchClassesById])
  );

  if (loading) return <Loading />;

  if (!classInfo || !classInfo.classDetail) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" />
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
  const currentUserStatus = classInfo.currentUserStatus;
  const allTodaySessionsData = classInfo.all_today_sessions || [];

  const handleCheckInPress = async (sessionId) => {
    try {
      await attemptCheckIn(sessionId);
      fetchClassesById(class_id);
    } catch (_error) {
      console.log("Check-in attempt failed, alert shown by hook.");
    }
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#252525" />
      <ScrollView
        contentContainerClassName="py-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          {/* ส่ง object classData ทั้งหมดที่มี owner_name สำเร็จรูปเข้าไป */}
          <ClassCard item={classData} />
        </View>

        <View className="bg-[#1E1E1E] rounded-2xl p-5 mb-6 mx-5">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white text-xl font-bold">รายละเอียดคลาส</Text>

            {currentUserStatus?.isOwner && (
              <TouchableOpacity className="bg-blue-500 px-3 py-1.5 rounded-lg">
                <Text className="text-white font-semibold text-sm">
                  จัดการคลาส
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
          <View className="flex-row items-center">
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

          {currentUserStatus?.isOwner && (
            <>
              {/* รหัสเข้าร่วม */}
              <View className="flex-row items-center mt-5">
                <View className="w-11 h-11 rounded-full bg-white/5 justify-center items-center mr-4">
                  <Key size="22" color="#FBBF24" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#A0A0A0] text-sm mb-1.5">
                    รหัสเข้าร่วม (แตะเพื่อคัดลอก)
                  </Text>
                  <TouchableOpacity
                    onPress={copyToClipboard}
                    activeOpacity={0.7}
                  >
                    {isCopied ? (
                      <View className="flex-row items-center justify-center font-mono py-2.5 px-3 rounded-lg bg-[#1C3A2E] border border-[#34D399]">
                        <CopySuccess size="18" color="#34D399" variant="Bold" />
                        <Text className="text-[#34D399] text-lg font-bold ml-2">
                          คัดลอกแล้ว!
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[#FBBF24] bg-[#2E2E2E] border border-[#2E2E2E] text-lg font-bold font-mono py-2.5 px-3 rounded-lg text-center">
                        {classData.join_code || "N/A"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ตารางเรียน */}
        {schedulesData?.length > 0 ? (
          <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Calendar size={20} color="#A78BFA" style={{ marginTop: 2 }} />
              <Text className="text-white text-xl font-bold">ตารางเรียน</Text>
            </View>
            {schedulesData.map((schedule, index) => {
              // 1. หาข้อมูล session ของวันนี้ที่ตรงกับ schedule ใบนี้
              const todaySessionForThisSchedule = allTodaySessionsData.find(
                (session) => session.schedule_id === schedule.schedule_id
              );

              // 2. ดึงสถานะออกมา (ถ้าไม่มี session ของวันนี้เลย status จะเป็น undefined)
              const status = todaySessionForThisSchedule?.status;

              const has_checked_in =
                todaySessionForThisSchedule?.has_checked_in;

              return (
                <View key={index} className="bg-[#2C2C2C] rounded-xl p-4 mb-3">
                  <Text className="text-white text-lg font-bold mb-3">
                    วัน
                    {DAY_OF_WEEK_THAI[schedule.day_of_week.toLowerCase()] ||
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

                  {/* --- ส่วนแสดงปุ่มตามเงื่อนไขของเจ้าของชั้นเรียน --- */}
                  {currentUserStatus?.isOwner ? (
                    <View className="bg-[#2C2C2C] rounded-xl p-4 mt-4">
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-white font-bold text-base">
                          การเช็คชื่อวันนี้
                        </Text>
                        {/* แสดงสถานะปัจจุบันเป็น Badge สวยๆ */}
                        {status === "active" && (
                          <View className="bg-green-500/20 px-2.5 py-1 rounded-full">
                            <Text className="text-green-400 font-semibold text-xs">
                              กำลังทำงาน
                            </Text>
                          </View>
                        )}
                        {status === "expired" && (
                          <View className="bg-red-500/20 px-2.5 py-1 rounded-full">
                            <Text className="text-red-400 font-semibold text-xs">
                              หมดเวลา
                            </Text>
                          </View>
                        )}
                        {status !== "active" && status !== "expired" && (
                          <View className="bg-gray-500/20 px-2.5 py-1 rounded-full">
                            <Text className="text-gray-400 font-semibold text-xs">
                              ยังไม่เริ่ม
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* --- ปุ่ม Action ที่เปลี่ยนไปตามสถานะ --- */}

                      {/* สถานะ 1: กำลังเช็คชื่อ (Active) -> แสดงปุ่มนับถอยหลัง */}
                      {status === "active" && todaySessionForThisSchedule && (
                        <>
                          <Text className="text-gray-400 text-center text-sm mb-2">
                            นักเรียนสามารถเช็คชื่อได้จนกว่าเวลาจะหมด
                          </Text>
                          <CheckInButton
                            session={todaySessionForThisSchedule}
                            onPress={() =>
                              Alert.alert("สถานะ", "การเช็คชื่อกำลังดำเนินอยู่")
                            }
                          />
                        </>
                      )}

                      {/* สถานะ 2: หมดเวลาแล้ว (Expired) -> แสดงปุ่ม Disabled สีแดง */}
                      {status === "expired" && (
                        <CheckButton
                          disabled={true}
                          buttonStyle={"rounded-lg py-3 mt-2 bg-red-800/50"}
                          textStyle={
                            "text-red-400 text-center font-bold text-base"
                          }
                          text={"หมดเวลาเช็คชื่อ"}
                        />
                      )}

                      {/* สถานะ 3: ยังไม่เริ่ม หรือสถานะอื่นๆ -> แสดงปุ่ม "เริ่มเช็คชื่อ" */}
                      {status !== "active" && status !== "expired" && (
                        <CheckButton
                          disabled={true}
                          buttonStyle={"rounded-lg py-3 mt-2 bg-gray-600/50"}
                          textStyle={
                            "text-white text-center font-semibold text-base"
                          }
                          text={"ยังไม่ถึงเวลาเช็คชื่อ"}
                        />
                      )}
                    </View>
                  ) : (
                    <>
                      {/* --- ส่วนแสดงปุ่มตามเงื่อนไข 4 สถานะของสมาชิก --- */}
                      {/* เงื่อนไขที่ 0: เช็คชื่อสำเร็จแล้ว -> แสดงปุ่มสีน้ำเงิน */}
                      {has_checked_in && (
                        <CheckButton
                          disabled={true}
                          buttonStyle={"rounded-lg py-2.5 mt-4 bg-blue-600/50"}
                          textStyle={
                            "text-white text-center font-semibold text-base"
                          }
                          text={"เช็คชื่อสำเร็จ"}
                        />
                      )}

                      {/* เงื่อนไขที่ 1: สถานะเป็น 'active' -> แสดงปุ่มสีเขียวนับถอยหลัง */}
                      {status === "active" && !has_checked_in && (
                        <CheckInButton
                          session={todaySessionForThisSchedule}
                          disabled={isCheckingIn}
                          onPress={() =>
                            handleCheckInPress(
                              todaySessionForThisSchedule.session_id
                            )
                          }
                        />
                      )}

                      {/* เงื่อนไขที่ 2: สถานะเป็น 'expired' -> แสดงปุ่มสีแดง */}
                      {status === "expired" && !has_checked_in && (
                        <CheckButton
                          disabled={true}
                          buttonStyle={"rounded-lg py-3 mt-2 bg-red-800/50"}
                          textStyle={
                            "text-red-400 text-center font-bold text-base"
                          }
                          text={"หมดเวลาเช็คชื่อ"}
                        />
                      )}

                      {/* เงื่อนไขที่ 3: ไม่มีสถานะ (คือเป็นวันอื่น) หรือสถานะเป็นอย่างอื่น (upcoming, finished) -> แสดงปุ่มสีเทา */}
                      {status !== "active" &&
                        status !== "expired" &&
                        !has_checked_in && (
                          <CheckButton
                            disabled={true}
                            buttonStyle={"rounded-lg py-3 mt-2 bg-gray-600/50"}
                            textStyle={
                              "text-white text-center font-semibold text-base"
                            }
                            text={"ยังไม่ถึงเวลาเช็คชื่อ"}
                          />
                        )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5">
            <View className="flex-row justify-between mb-4">
              <View className="flex-row gap-2">
                <Calendar size={20} color="#A78BFA" style={{ marginTop: 2 }} />
                <Text className="text-white text-xl font-bold">ตารางเรียน</Text>
              </View>

              {currentUserStatus?.isOwner && (
                <TouchableOpacity className="bg-blue-500 px-3 py-1.5 rounded-lg">
                  <Text className="text-white font-semibold text-sm">
                    เพิ่มตารางเรียน
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex items-center justify-center p-10">
              <Text className="text-gray-400">ไม่มีตารางเรียน</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomePage;
