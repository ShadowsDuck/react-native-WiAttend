// HomePage.js
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Book1, User, Key, CopySuccess } from "iconsax-react-native";
import * as Clipboard from "expo-clipboard";

// --- Hooks & Constants ---
import { useClassroom } from "../../../hooks/useClassroom";
import { useCheckInProcess } from "../../../hooks/useCheckInProcess";

// --- Components ---
import Header from "../../../components/Header";
import ClassCard from "../../../components/ClassCard";
import Loading from "../../../components/Loading";
import ClassDetailRow from "../../../components/ClassDetailRow";
import ScheduleSectionHeader from "../../../components/ScheduleSectionHeader";
import ScheduleCard from "../../../components/ScheduleCard";

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

  const handleCheckInPress = async (sessionId) => {
    try {
      await attemptCheckIn(sessionId);
      fetchClassesById(class_id); // Re-fetch data to update UI
    } catch (_error) {
      console.log("Check-in attempt failed, alert shown by hook.");
    }
  };

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

  const {
    classDetail,
    classSchedules,
    memberCount,
    currentUserStatus,
    all_today_sessions,
  } = classInfo;

  const renderJoinCode = () => (
    <TouchableOpacity onPress={copyToClipboard} activeOpacity={0.7}>
      {isCopied ? (
        <View className="flex-row items-center justify-center font-mono py-2.5 px-3 rounded-lg bg-[#1C3A2E] border border-[#34D399]">
          <CopySuccess size="18" color="#34D399" variant="Bold" />
          <Text className="text-[#34D399] text-lg font-bold ml-2">
            คัดลอกแล้ว!
          </Text>
        </View>
      ) : (
        <Text className="text-[#FBBF24] bg-[#2E2E2E] border border-[#2E2E2E] text-lg font-bold font-mono py-2.5 px-3 rounded-lg text-center">
          {classDetail.join_code || "N/A"}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#252525" />
      <ScrollView
        contentContainerClassName="py-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <ClassCard item={classDetail} />
        </View>

        {/* --- ส่วนรายละเอียดคลาส --- */}
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

          <ClassDetailRow
            icon={<User size="22" color="#A78BFA" />}
            label="สร้างโดย"
          >
            <Text className="text-white text-base font-medium">
              {classDetail.owner_name}
            </Text>
          </ClassDetailRow>

          <ClassDetailRow
            icon={<Book1 size="22" color="#6366F1" />}
            label="วิชา"
          >
            <Text className="text-white text-base font-medium">
              {classDetail.subject_name || "N/A"}
            </Text>
          </ClassDetailRow>

          <ClassDetailRow
            icon={<User size="22" color="#34D399" />}
            label="จำนวนสมาชิก"
          >
            <Text className="text-white text-base font-medium">
              {memberCount} คน
            </Text>
          </ClassDetailRow>

          {currentUserStatus?.isOwner && (
            <ClassDetailRow
              icon={<Key size="22" color="#FBBF24" />}
              label="รหัสเข้าร่วม (แตะเพื่อคัดลอก)"
            >
              {renderJoinCode()}
            </ClassDetailRow>
          )}
        </View>

        {/* --- ส่วนตารางเรียน --- */}
        <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5">
          <ScheduleSectionHeader
            scheduleCount={classSchedules?.length || 0}
            isOwner={currentUserStatus?.isOwner}
            onAddSchedule={() =>
              Alert.alert(
                "Coming Soon!",
                "ฟังก์ชันเพิ่มตารางเรียนยังไม่เปิดใช้งาน"
              )
            }
          />

          {classSchedules?.length > 0 ? (
            classSchedules.map((schedule) => {
              const todaySession = (all_today_sessions || []).find(
                (session) => session.schedule_id === schedule.schedule_id
              );
              return (
                <ScheduleCard
                  key={schedule.schedule_id}
                  schedule={schedule}
                  todaySession={todaySession}
                  isOwner={currentUserStatus?.isOwner}
                  isCheckingIn={isCheckingIn}
                  onCheckIn={handleCheckInPress}
                />
              );
            })
          ) : (
            <View className="flex items-center justify-center p-10">
              <Text className="text-gray-400">ไม่มีตารางเรียน</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;
