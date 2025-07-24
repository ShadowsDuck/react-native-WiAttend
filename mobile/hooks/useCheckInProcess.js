import { Alert, PermissionsAndroid, Platform } from "react-native";
import { useState } from "react";
import WifiManager from "react-native-wifi-reborn";
import { useSessions } from "./useSessions";

// ฟังก์ชันจัดการ Error
const handleCheckInError = (error) => {
  // --- ส่วนที่แก้ไข เริ่มต้นที่นี่ ---

  // ตรวจสอบก่อนว่า Error นี้มาจาก Server Response หรือไม่
  if (error.response) {
    // ใช่, มันมาจาก Server (เช่น AxiosError)
    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";

    // แยกกรณีตาม Status Code
    if (status === 400) {
      // Status 400 (Bad Request) คือ Error ที่เราคาดหวังไว้
      // เช่น "ไม่ได้อยู่ในห้องเรียน", "เช็คชื่อไปแล้ว", "หมดเวลา"
      console.log(`Handled a known 400 error: ${message}`);
      Alert.alert("ไม่สำเร็จ", message); // แสดง Alert ที่เป็นมิตร
    } else {
      // ถ้าเป็น Error อื่นๆ จาก Server (เช่น 500 Internal Server Error)
      // ให้ถือว่าเป็น Error ที่ไม่คาดคิด และ Log แบบละเอียด
      console.error("--- UNEXPECTED SERVER ERROR ---", error);
      Alert.alert("เกิดข้อผิดพลาด", "ระบบมีปัญหา กรุณาติดต่อผู้ดูแล");
    }
  } else {
    // ไม่ใช่ Server Response (เช่น Network Error, Permission Error)
    // ให้ถือว่าเป็น Error ที่ไม่คาดคิด
    const title = error.isCustomError ? error.title : "เกิดข้อผิดพลาด";
    const message = error.isCustomError
      ? error.message
      : "ไม่สามารถเชื่อมต่อได้";
    Alert.alert(title, message);
  }
};

// ฟังก์ชันขอ Permission
const requestLocationPermission = async () => {
  if (Platform.OS !== "android") return true;
  try {
    // ขออนุญาตเข้าถึงตำแหน่ง
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "ต้องการสิทธิ์เข้าถึงตำแหน่ง",
        message:
          "แอปพลิเคชันจำเป็นต้องใช้ตำแหน่งของคุณเพื่อสแกนหา Wi-Fi สำหรับการเช็คชื่อในห้องเรียน",
        buttonNeutral: "ถามฉันทีหลัง",
        buttonNegative: "ไม่อนุญาต",
        buttonPositive: "อนุญาต",
      }
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw {
        isCustomError: true,
        title: "ไม่ได้รับอนุญาต",
        message: "แอปไม่สามารถทำงานได้หากไม่ได้รับสิทธิ์เข้าถึงตำแหน่ง",
      };
    }
    return true;
  } catch (err) {
    console.warn(err);
    throw {
      isCustomError: true,
      title: "เกิดข้อผิดพลาด",
      message: "เกิดข้อผิดพลาดในการขอสิทธิ์",
    };
  }
};

// ฟังก์ชันสแกน Wi-Fi
const scanForWifiData = async () => {
  Alert.alert("กำลังสแกน Wi-Fi", "กรุณารอสักครู่...");
  const scanResult = await WifiManager.reScanAndLoadWifiList();

  if (!Array.isArray(scanResult)) {
    throw {
      isCustomError: true,
      title: "สแกน Wi-Fi ไม่สำเร็จ",
      message: "ไม่สามารถอ่านข้อมูล Wi-Fi ได้ กรุณาลองใหม่อีกครั้งใน 1-2 นาที",
    };
  }
  if (scanResult.length === 0) {
    throw {
      isCustomError: true,
      title: "สแกน Wi-Fi ไม่สำเร็จ",
      message: "ไม่พบสัญญาณ Wi-Fi ในบริเวณนี้",
    };
  }

  // คืนค่าเป็น Array of Objects ที่มีทั้ง bssid และ rssi
  return scanResult.map((wifi) => ({
    bssid: wifi.BSSID.toLowerCase(),
    rssi: wifi.level,
  }));
};

export const useCheckInProcess = () => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { checkin } = useSessions();

  const attemptCheckIn = async (sessionId) => {
    if (isCheckingIn) return;
    setIsCheckingIn(true);

    try {
      await requestLocationPermission();

      // เรียกใช้ฟังก์ชันสแกนตัวใหม่
      const scannedWifiData = await scanForWifiData();
      console.log("Found Wi-Fi Data:", scannedWifiData);

      // ส่งข้อมูลโครงสร้างใหม่นี้ไป
      const result = await checkin(sessionId, scannedWifiData);

      Alert.alert("สำเร็จ!", result.message || "เช็คชื่อเรียบร้อยแล้ว");
      return result;
    } catch (error) {
      handleCheckInError(error);
      throw error;
    } finally {
      setIsCheckingIn(false);
    }
  };

  return { isCheckingIn, attemptCheckIn };
};
