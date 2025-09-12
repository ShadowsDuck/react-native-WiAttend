// ViewAttendancePage.js
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useCallback } from "react";
import { User, Clock, Calendar } from "iconsax-react-native";

// --- Hooks ---
import { useAttendances } from "../../hooks/useAttendances";

// --- Components ---
import Header from "../../components/Header";
import Loading from "../../components/Loading";

// --- Utils ---
import { formatThaiDate } from "../../utils/calendarConfig";

const ViewAttendancePage = () => {
  const { session_id } = useLocalSearchParams();
  const router = useRouter();
  const { attendanceData, loading, fetchAttendanceSessionById } =
    useAttendances();

  // ดึงข้อมูลการเช็คชื่อเมื่อเข้าหน้า
  useEffect(() => {
    if (session_id) {
      fetchAttendanceSessionById(session_id);
    }
  }, [session_id]);

  const handleRetry = useCallback(() => {
    if (session_id) {
      fetchAttendanceSessionById(session_id);
    }
  }, [session_id, fetchAttendanceSessionById]);

  // Loading state
  if (loading || !attendanceData) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" onBackPress={() => router.back()} />
        <Loading />
      </View>
    );
  }

  // Error state
  if (!attendanceData.session_id) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" onBackPress={() => router.back()} />
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-red-500 text-lg text-center mb-2">
            ไม่สามารถโหลดข้อมูลการเช็คชื่อได้
          </Text>
          <Text className="text-gray-400 text-sm text-center mb-6">
            อาจเกิดจากปัญหาการเชื่อมต่อหรือคาบเรียนนี้ไม่มีอยู่จริง
          </Text>
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={handleRetry}
          >
            <Text className="text-white font-semibold">ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sessionInfo = {
    date: attendanceData.session_date,
    time: attendanceData.session_time || "ไม่ระบุ",
    status: attendanceData.is_canceled ? "ยกเลิก" : "ปกติ",
  };

  const attendanceList = attendanceData.attendances || [];
  const attendedCount = attendanceList.filter((item) => item.is_present).length;
  const totalCount = attendanceList.length;

  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#252525" onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Info Section */}
        <View className="bg-[#1E1E1E] rounded-2xl p-5 mb-6 mx-5 mt-6">
          <Text className="text-white text-xl font-bold mb-4">
            ข้อมูลคาบเรียน
          </Text>

          <View className="flex-row items-center mb-3">
            <Calendar size="20" color="#6366F1" />
            <Text className="text-gray-300 text-base ml-3">
              วันที่: {formatThaiDate(sessionInfo.date)}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Clock size="20" color="#10B981" />
            <Text className="text-gray-300 text-base ml-3">
              เวลา: {sessionInfo.time}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-600">
            <Text className="text-white text-lg font-semibold">
              สถิติการเช็คชื่อ
            </Text>
            <View className="flex-row items-center">
              <Text className="text-green-400 text-lg font-bold mr-2">
                {attendedCount}
              </Text>
              <Text className="text-gray-400 text-base">/ {totalCount} คน</Text>
            </View>
          </View>
        </View>

        {/* Attendance List Section */}
        <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5">
          <Text className="text-white text-xl font-bold mb-4">
            รายชื่อสมาชิก ({totalCount} คน)
          </Text>

          {attendanceList.length === 0 ? (
            <View className="flex items-center justify-center p-10">
              <User size="48" color="#6B7280" />
              <Text className="text-gray-400 text-base mt-3">
                ยังไม่มีสมาชิกเช็คชื่อ
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {attendanceList.map((attendance, index) => (
                <View
                  key={`${attendance.user_id}-${index}`}
                  className={`bg-[#2C2C2C] rounded-xl p-4 flex-row items-center justify-between mb-2 ${
                    attendance.is_present
                      ? "border-l-4 border-green-500"
                      : "border-l-4 border-red-500"
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    {attendance.imageUrl ? (
                      <Image
                        source={{ uri: attendance.imageUrl }}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <View className="bg-[#3C3C3C] rounded-full p-2 mr-3">
                        <User size="20" color="#E5E7EB" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold">
                        {attendance.user_name || "ไม่ระบุชื่อ"}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {attendance.checked_at
                          ? `เช็คชื่อเมื่อ: ${new Date(
                              attendance.checked_at
                            ).toLocaleString("th-TH", {
                              timeZone: "UTC",
                              hour12: false,
                            })}`
                          : "ยังไม่ได้เช็คชื่อ"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    {attendance.is_present ? (
                      <View className="bg-green-500/20 px-3 py-1.5 rounded-full flex-row items-center">
                        <Text style={{ color: "#10B981" }}>✓ </Text>
                        <Text className="text-green-400 text-sm font-semibold ml-1">
                          มาเรียน
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-red-500/20 px-3 py-1.5 rounded-full flex-row items-center">
                        <Text style={{ color: "#EF4444" }}>✗ </Text>
                        <Text className="text-red-400 text-sm font-semibold ml-1">
                          ขาดเรียน
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary Stats */}
        {attendanceList.length > 0 && (
          <View className="bg-[#1E1E1E] rounded-2xl p-5 mx-5 mt-6">
            <Text className="text-white text-lg font-bold mb-4">สรุปสถิติ</Text>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-300 text-base">จำนวนที่มาเรียน</Text>
              <Text className="text-green-400 text-base font-semibold">
                {attendedCount} คน
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-300 text-base">จำนวนที่ขาดเรียน</Text>
              <Text className="text-red-400 text-base font-semibold">
                {totalCount - attendedCount} คน
              </Text>
            </View>

            <View className="flex-row justify-between items-center pt-3 border-t border-gray-600">
              <Text className="text-white text-base font-semibold">
                เปอร์เซ็นต์การมาเรียน
              </Text>
              <Text className="text-blue-400 text-lg font-bold">
                {totalCount > 0
                  ? Math.round((attendedCount / totalCount) * 100)
                  : 0}
                %
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ViewAttendancePage;
