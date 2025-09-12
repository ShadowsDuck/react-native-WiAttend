import { View, Text } from "react-native";
import { Card, CircularProgress, PercentageBadge } from "./CircularProgress";
import { formatDate, formatTime } from "../utils/formatDate";

const StudentView = ({ data }) => {
  const total = data.sessions_held_so_far;
  const present = data.attendances.filter((a) => a.is_present).length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <>
      <Card>
        <View className="flex-row justify-around items-center">
          <View className="items-center">
            <CircularProgress percentage={percentage} />
            <Text className="text-gray-200 text-sm mt-2">
              เปอร์เซ็นต์เข้าเรียน
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              จากทั้งหมด {total} ครั้ง
            </Text>
          </View>
          <View>
            <Text className="text-white text-base mb-3">
              <Text className="font-bold text-[#34D399]">{present}</Text>{" "}
              เข้าเรียน
            </Text>
            <Text className="text-white text-base">
              <Text className="font-bold text-[#F77171]">{absent}</Text>{" "}
              ขาดเรียน
            </Text>
          </View>
        </View>
      </Card>

      <Card title="ประวัติการเข้าเรียน">
        {data.attendances.map((item, index) => (
          <View
            key={index}
            className="flex-row justify-between items-center bg-[#2E2E2E] p-4 rounded-lg mb-2"
          >
            <View>
              <Text className="text-white font-medium">
                {`วันที่ ${formatDate(item.session_date)} • ${item.start_time.slice(0, 5)} น.`}
              </Text>
              {item.is_present && (
                <Text className="text-gray-400 text-sm mt-1">
                  เช็คชื่อเวลา {formatTime(item.checked_in_at)}
                </Text>
              )}
            </View>
            <PercentageBadge
              percentage={item.is_present ? 100 : 0}
              text={item.is_present ? "เข้าเรียน" : "ขาดเรียน"}
            />
          </View>
        ))}
      </Card>
    </>
  );
};

export default StudentView;
