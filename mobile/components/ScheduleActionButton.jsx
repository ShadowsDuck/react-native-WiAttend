// components/ScheduleActionButton.js
import { View, Text, Alert } from "react-native";
import CheckInButton from "./CheckInButton";
import CheckButton from "./CheckButton";

const StatusBadge = ({ status }) => {
  if (status === "active") {
    return (
      <View className="bg-green-500/20 px-2.5 py-1 rounded-full">
        <Text className="text-green-400 font-semibold text-xs">กำลังทำงาน</Text>
      </View>
    );
  }
  if (status === "expired") {
    return (
      <View className="bg-red-500/20 px-2.5 py-1 rounded-full">
        <Text className="text-red-400 font-semibold text-xs">หมดเวลา</Text>
      </View>
    );
  }
  return (
    <View className="bg-gray-500/20 px-2.5 py-1 rounded-full">
      <Text className="text-gray-400 font-semibold text-xs">ยังไม่เริ่ม</Text>
    </View>
  );
};

const ScheduleActionButton = ({
  isOwner,
  session,
  isCheckingIn,
  onCheckIn,
}) => {
  const status = session?.status;
  const has_checked_in = session?.has_checked_in;

  // --- มุมมองของเจ้าของคลาส ---
  if (isOwner) {
    return (
      <View className="bg-[#2C2C2C] rounded-xl p-4 mt-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white font-bold text-base">
            การเช็คชื่อวันนี้
          </Text>
          <StatusBadge status={status} />
        </View>

        {status === "active" && session && (
          <>
            <Text className="text-gray-400 text-center text-sm mb-2">
              นักเรียนสามารถเช็คชื่อได้จนกว่าเวลาจะหมด
            </Text>
            <CheckInButton
              session={session}
              onPress={() => Alert.alert("สถานะ", "การเช็คชื่อกำลังดำเนินอยู่")}
            />
          </>
        )}

        {status === "expired" && (
          <CheckButton
            disabled={true}
            buttonStyle="rounded-lg py-3 mt-2 bg-red-800/50"
            textStyle="text-red-400 text-center font-bold text-base"
            text="หมดเวลาเช็คชื่อ"
          />
        )}

        {status !== "active" && status !== "expired" && (
          <CheckButton
            disabled={true}
            buttonStyle="rounded-lg py-3 mt-2 bg-gray-600/50"
            textStyle="text-white text-center font-semibold text-base"
            text="ยังไม่ถึงเวลาเช็คชื่อ"
          />
        )}
      </View>
    );
  }

  // --- มุมมองของสมาชิก ---
  if (has_checked_in) {
    return (
      <CheckButton
        disabled={true}
        buttonStyle="rounded-lg py-2.5 mt-4 bg-blue-600/50"
        textStyle="text-white text-center font-semibold text-base"
        text="เช็คชื่อสำเร็จ"
      />
    );
  }

  if (status === "active") {
    return (
      <CheckInButton
        session={session}
        disabled={isCheckingIn}
        onPress={() => onCheckIn(session.session_id)}
      />
    );
  }

  if (status === "expired") {
    return (
      <CheckButton
        disabled={true}
        buttonStyle="rounded-lg py-3 mt-2 bg-red-800/50"
        textStyle="text-red-400 text-center font-bold text-base"
        text="หมดเวลาเช็คชื่อ"
      />
    );
  }

  // (status !== 'active' && status !== 'expired' && !has_checked_in)
  return (
    <CheckButton
      disabled={true}
      buttonStyle="rounded-lg py-3 mt-2 bg-gray-600/50"
      textStyle="text-white text-center font-semibold text-base"
      text="ยังไม่ถึงเวลาเช็คชื่อ"
    />
  );
};

export default ScheduleActionButton;
