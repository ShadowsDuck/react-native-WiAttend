// HomePage.js
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { Book1, User, Key, CopySuccess, Calendar } from "iconsax-react-native";
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
  const router = useRouter();

  const {
    classData,
    loading,
    error,
    hasInitialized,
    fetchClassById,
    resetClassData,
  } = useClasses();
  const { isCheckingIn, attemptCheckIn } = useCheckInProcess();
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset ข้อมูลเมื่อ class_id เปลี่ยน
  useEffect(() => {
    resetClassData();
  }, [class_id, resetClassData]);

  // ดึงข้อมูลเมื่อเข้าหน้าหรือกลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      if (class_id) {
        fetchClassById(class_id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [class_id])
  );

  const handleRetry = () => {
    if (class_id) {
      fetchClassById(class_id);
    }
  };

  // ฟังก์ชันสำหรับ Pull to Refresh
  const onRefresh = useCallback(async () => {
    if (!class_id) return;

    setIsRefreshing(true);
    try {
      await fetchClassById(class_id);
    } finally {
      setIsRefreshing(false);
    }
  }, [class_id, fetchClassById]);

  const copyToClipboard = async () => {
    if (isCopied) return;
    const joinCode = classData?.classDetail?.join_code;
    if (joinCode) {
      await Clipboard.setStringAsync(joinCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    }
  };

  const handleCheckInPress = async (sessionId) => {
    try {
      await attemptCheckIn(sessionId);
      if (class_id) {
        fetchClassById(class_id);
      }
    } catch (_error) {
      console.log("Check-in attempt failed, alert shown by hook.");
    }
  };

  // ฟังก์ชันสำหรับไปหน้า Manage Sessions
  const handleViewManageSessionsPage = () => {
    router.push({
      pathname: "/(session)/manageSessionsPage",
      params: { class_id: class_id, isOwner: currentUserStatus?.isOwner },
    });
  };

  // แสดง Loading เมื่อ: ยังไม่ initialize หรือกำลัง loading (ไม่ว่าจะมีข้อมูลเก่าหรือไม่)
  if (!hasInitialized || loading || !class_id) {
    return <Loading />;
  }

  // แสดง Error เมื่อ: มี error หรือไม่มีข้อมูล (หลังจาก initialize แล้วและไม่ได้กำลัง loading)
  if (error || !classData?.classDetail) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#121212" />
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#6366F1"
              colors={["#6366F1"]}
              progressBackgroundColor="#1E1E1E"
            />
          }
        >
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-red-500 text-lg text-center mb-2">
              ไม่สามารถโหลดข้อมูลคลาสได้
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-6">
              อาจเกิดจากปัญหาการเชื่อมต่อหรือคลาสนี้ไม่มีอยู่จริง
            </Text>
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-lg"
              onPress={handleRetry}
            >
              <Text className="text-white font-semibold">ลองอีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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

      {/* แสดงตัวบ่งชี้การรีเฟรช เมื่อมีข้อมูลเก่าแล้วกำลังโหลดใหม่ */}
      {loading && classData && (
        <View className="absolute top-20 right-5 z-10 bg-blue-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs">กำลังอัพเดต...</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={["#6366F1"]}
            progressBackgroundColor="#1E1E1E"
          />
        }
      >
        <View className="my-6">
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
              router.push({
                pathname: "/(schedule)/createSchedule",
                params: { class_id: class_id },
              })
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

        {/* --- ส่วนปุ่มดูปฏิทินคาบเรียน --- */}
        <View className="mx-5 mt-6">
          <TouchableOpacity
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 flex-row items-center justify-center"
            onPress={handleViewManageSessionsPage}
            style={{
              backgroundColor: "#6366F1",
            }}
          >
            <Calendar size="24" color="#ffffff" variant="Bold" />
            <Text className="text-white text-lg font-bold ml-3">
              ดูปฏิทินคาบเรียน
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomePage;
