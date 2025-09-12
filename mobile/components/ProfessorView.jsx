import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Card, CircularProgress, PercentageBadge } from "./CircularProgress";
import Dropdown from "./Dropdown";
import { Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import ExportButton from "./ExportButton";

const filterItems = [
  { label: "ทั้งหมด", value: "all" },
  { label: ">= 80%", value: ">=80" },
  { label: "50-79%", value: "50-79" },
  { label: "< 49%", value: "<49" },
];

const ProfessorView = ({ data }) => {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState("all");

  const members = data.members || [];
  const sessionsHeldSoFar = data.sessions_held_so_far || 0;
  const totalPlannedSessions = data.total_planned_sessions || 0;

  const classProgressPercentage =
    totalPlannedSessions > 0
      ? Math.round((sessionsHeldSoFar / totalPlannedSessions) * 100)
      : 0;

  const percentages = members.map((m) => {
    const presentCount = m.attendances.filter((a) => a.is_present).length;
    return sessionsHeldSoFar > 0 ? (presentCount / sessionsHeldSoFar) * 100 : 0;
  });

  const avgPercent =
    percentages.length > 0
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0;

  const filteredStudents = members.filter((student) => {
    const presentCount = student.attendances.filter((a) => a.is_present).length;
    const percentage =
      sessionsHeldSoFar > 0
        ? Math.round((presentCount / sessionsHeldSoFar) * 100)
        : 0;

    const matchFilter =
      filter === "all" ||
      (filter === ">=80" && percentage >= 80) ||
      (filter === "50-79" && percentage >= 50 && percentage < 80) ||
      (filter === "<49" && percentage < 49);

    const matchSearch = student.full_name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <>
      <Card>
        <View className="flex-row justify-around items-center">
          <View className="items-center flex-1">
            <CircularProgress percentage={avgPercent} />
            <Text className="text-gray-200 text-sm mt-2">
              เปอร์เซ็นต์เข้าเรียนเฉลี่ย
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              จากนักเรียนทั้งหมด {members.length} คน
            </Text>
          </View>
          <View className="items-center flex-1">
            <CircularProgress
              percentage={classProgressPercentage}
              color="#A78BFA"
              displayText={String(sessionsHeldSoFar)}
            />
            <Text className="text-gray-200 text-sm mt-2">
              จำนวนวันที่เรียนไปแล้ว
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              จากทั้งหมด {totalPlannedSessions} วัน
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">รายละเอียดคลาส</Text>
          <ExportButton class_id={data.class_id} />
        </View>
        <View className="flex-row items-center mb-4">
          <TextInput
            placeholder="ค้นหานักเรียน..."
            placeholderTextColor="#888"
            className="flex-1 bg-[#2E2E2E] text-white rounded-lg px-4 py-3 mr-2"
            value={searchText}
            onChangeText={setSearchText}
          />
          <View className="w-36 pt-2">
            <Dropdown
              label="ตัวกรอง"
              value={filter}
              onChange={(value) => setFilter(value)}
              items={filterItems}
              height={44}
              search={false}
            />
          </View>
        </View>

        {members.length === 0 ? (
          // 1. ถ้าไม่มีนักเรียนในคลาสเลย
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400">
              ยังไม่มีนักเรียนในชั้นเรียนนี้
            </Text>
          </View>
        ) : filteredStudents.length === 0 ? (
          // 2. ถ้ามีนักเรียน แต่กรอง/ค้นหาแล้วไม่เจอ
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400">
              ไม่พบนักเรียนที่ตรงกับเงื่อนไข
            </Text>
          </View>
        ) : (
          // กรณีปกติ: แสดงรายชื่อนักเรียน
          filteredStudents.map((student) => {
            const presentCount = student.attendances.filter(
              (a) => a.is_present
            ).length;
            const pct =
              sessionsHeldSoFar > 0
                ? Math.round((presentCount / sessionsHeldSoFar) * 100)
                : 0;
            return (
              <View
                key={student.user_id}
                className="flex-row justify-between items-center bg-[#2E2E2E] p-3 rounded-lg mb-2"
              >
                <View className="flex-row items-center">
                  {student.imageUrl ? (
                    <Image
                      source={{ uri: student.imageUrl }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        marginRight: 12,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-9 h-9 rounded-full bg-[#6366F1]/30 items-center justify-center mr-3">
                      <Text className="text-[#A78BFA] font-bold">
                        {student.full_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <Text className="text-white font-medium text-base">
                    {student.full_name}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <PercentageBadge
                    percentage={pct}
                    text={`${pct}% (${presentCount}/${sessionsHeldSoFar})`}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(attendance)/studentAttendanceDetailPage",
                        params: {
                          userId: student.user_id,
                          classId: data.class_id,
                        },
                      })
                    }
                  >
                    <Entypo
                      name="dots-three-vertical"
                      size={14}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </>
  );
};

export default ProfessorView;
