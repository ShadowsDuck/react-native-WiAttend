// HomePage.js
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { Book1, User, Key, CopySuccess } from "iconsax-react-native";
import * as Clipboard from "expo-clipboard";

// --- Hooks & Constants ---
import { useClasses } from "../../../hooks/useClasses";
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
  const { classData, loading, fetchClassById } = useClasses();
  const { isCheckingIn, attemptCheckIn } = useCheckInProcess();
  const [isCopied, setIsCopied] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();

  const copyToClipboard = async () => {
    if (isCopied) return;
    const joinCode = classData?.classDetail?.join_code;
    if (joinCode) {
      await Clipboard.setStringAsync(joinCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    }
  };

  // ฟังก์ชันสำหรับโหลดข้อมูล
  const loadClassData = useCallback(async () => {
    if (!class_id) return;

    try {
      setLoadError(false);
      await fetchClassById(class_id);
    } catch (error) {
      console.log("❌ Failed to load class data:", error);
      setLoadError(true);
    } finally {
      setHasAttemptedLoad(true);
    }
  }, [class_id, fetchClassById]);

  // โหลดข้อมูลครั้งแรกเมื่อ component mount
  useEffect(() => {
    if (class_id && !hasAttemptedLoad) {
      loadClassData();
    }
  }, [class_id, hasAttemptedLoad, loadClassData]);

  // Refresh เมื่อกลับมาที่หน้านี้ (ยกเว้นครั้งแรก)
  useFocusEffect(
    useCallback(() => {
      if (class_id && hasAttemptedLoad) {
        loadClassData();
      }
    }, [class_id, hasAttemptedLoad, loadClassData])
  );

  const handleCheckInPress = async (sessionId) => {
    try {
      await attemptCheckIn(sessionId);
      loadClassData(); // Re-fetch data to update UI
    } catch (_error) {
      console.log("Check-in attempt failed, alert shown by hook.");
    }
  };

  const handleRetry = () => {
    setHasAttemptedLoad(false);
    setLoadError(false);
  };

  // กรณีที่ไม่มี class_id
  if (!class_id) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 text-lg">ไม่มีรหัสคลาส</Text>
        </View>
      </View>
    );
  }

  // แสดง Loading เมื่อ:
  // 1. ยังไม่เคยพยายามโหลด หรือ
  // 2. กำลังโหลดอยู่ และยังไม่มีข้อมูล
  if (!hasAttemptedLoad || (loading && !classData)) {
    return <Loading />;
  }

  // แสดง Error เมื่อโหลดแล้วแต่มี error หรือไม่มีข้อมูล
  if (loadError || !classData || !classData.classDetail) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" />
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-red-500 text-lg text-center mb-2">
            ไม่พบข้อมูลคลาส
          </Text>
          <Text className="text-gray-400 text-sm text-center mb-6">
            อาจเกิดจากปัญหาการเชื่อมต่อหรือคลาสไม่มีอยู่
          </Text>
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={handleRetry}
            disabled={loading}
          >
            <Text className="text-white font-semibold">
              {loading ? "กำลังโหลด..." : "ลองอีกครั้ง"}
            </Text>
          </TouchableOpacity>
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
  } = classData;

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

      {/* แสดง Loading indicator เล็กๆ ตอน refresh */}
      {loading && classData && (
        <View className="absolute top-20 right-5 z-10 bg-blue-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs">กำลังอัพเดต...</Text>
        </View>
      )}

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
              <TouchableOpacity
                className="bg-blue-500 px-3 py-1.5 rounded-lg"
                onPress={() => {
                  router.push({
                    pathname: "/(class)/editClass",
                    params: { class_id: class_id },
                  });
                }}
              >
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
