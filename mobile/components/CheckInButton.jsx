import { useState, useEffect } from "react";
import { TouchableOpacity, Text } from "react-native";

// ฟังก์ชันเสริมสำหรับจัดรูปแบบเวลา MM:SS
const formatTime = (totalSeconds) => {
  // ป้องกันเวลาติดลบจากการคำนวณที่อาจคลาดเคลื่อนเล็กน้อย
  if (totalSeconds < 0) return "00:00";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // ใช้ padStart เพื่อให้มีเลข 0 นำหน้าเสมอ เช่น 09:05
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const CheckInButton = ({
  session,
  onPress,
  disabled = false,
  isDisplayOnly = false,
}) => {
  // State สำหรับเก็บเวลาที่เหลือ (เป็นวินาที)
  const [remainingTime, setRemainingTime] = useState(null);

  // State ใหม่: เพื่อจัดการสถานะ "กำลังคำนวณ" ในตอนแรก
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // คำนวณเวลาสิ้นสุดการเช็คชื่อ
    // เราต้องสร้าง Date object ของเวลาเริ่มและเวลาสิ้นสุดบน Client
    // โดยอิงจากข้อมูลเวลาที่ได้มาจาก Server
    const [startHour, startMinute] = session.start_time.split(":");
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    const closeTime = new Date(
      startTime.getTime() + session.checkin_close_after_min * 60000
    );

    // --- ตั้งค่า Interval Timer ---
    // ตัวแปร interval นี้จะเก็บ ID ของ timer ที่เราสร้าง
    const interval = setInterval(() => {
      const now = new Date();
      // คำนวณหาผลต่างของเวลาเป็นวินาที
      const differenceInSeconds = Math.round(
        (closeTime.getTime() - now.getTime()) / 1000
      );

      // เมื่อคำนวณเสร็จในรอบแรกสุด ให้เปลี่ยนสถานะ "กำลังคำนวณ" เป็น false
      if (isCalculating) {
        setIsCalculating(false);
      }

      // อัปเดตเวลาที่เหลือ
      setRemainingTime(differenceInSeconds);

      // ถ้าเวลาหมดแล้ว ให้หยุดการทำงานของ timer เพื่อไม่ให้ทำงานโดยไม่จำเป็น
      if (differenceInSeconds < 0) {
        clearInterval(interval);
      }
    }, 1000); // ทำงานทุกๆ 1 วินาที

    // --- ฟังก์ชัน Cleanup ---
    // ฟังก์ชันนี้สำคัญมาก! React จะเรียกใช้เมื่อ Component ถูกทำลาย (unmount)
    // เพื่อให้แน่ใจว่า interval timer ของเราถูกล้างค่าออกไป ไม่เกิด Memory Leak
    return () => clearInterval(interval);

    // เราต้องการให้ useEffect นี้ทำงานแค่ครั้งเดียวเมื่อ component ถูกสร้าง
    // และทำงานอีกครั้งเมื่อข้อมูล 'session' เปลี่ยนไปเท่านั้น
  }, [session]);

  // --- ส่วนของการแสดงผล (Render) ---

  // เงื่อนไขที่ 1: ถ้ายังอยู่ในสถานะ "กำลังคำนวณ"
  if (isCalculating) {
    return (
      <TouchableOpacity
        disabled={true}
        className="rounded-lg py-2.5 mt-4 bg-gray-600/50"
      >
        <Text className="text-white text-center font-semibold text-base">
          กำลังคำนวณ...
        </Text>
      </TouchableOpacity>
    );
  }

  // เงื่อนไขที่ 2: ถ้าคำนวณเสร็จแล้ว และเวลาหมด (น้อยกว่าหรือเท่ากับ 0)
  if (remainingTime <= 0) {
    return (
      <TouchableOpacity
        disabled={true}
        className="rounded-lg py-2.5 mt-4 bg-red-800/50"
      >
        <Text className="text-white text-center font-bold text-base">
          หมดเวลาเช็คชื่อ
        </Text>
      </TouchableOpacity>
    );
  }

  // เงื่อนไขสุดท้าย: ถ้าทุกอย่างปกติ ให้แสดงปุ่มนับถอยหลัง
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className="rounded-lg py-2.5 mt-4 bg-green-600"
    >
      <Text className="text-white text-center font-semibold text-base">
        {disabled
          ? "กำลังดำเนินการ..."
          : `เช็คชื่อ (เหลือ ${formatTime(remainingTime)})`}
      </Text>
    </TouchableOpacity>
  );
};

export default CheckInButton;
