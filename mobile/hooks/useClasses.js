import { useCallback, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { Alert } from "react-native";
import API_URL from "../config/api";

/**
 * Custom Hook สำหรับจัดการข้อมูลทั้งหมดที่เกี่ยวกับคลาสเรียน (Classes)
 * แก้ไขปัญหา Infinite Loop และเพิ่ม Error Handling ที่ดีขึ้น
 */
export const useClasses = () => {
  // State หลัก: loading, error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State สำหรับข้อมูล:
  const [classes, setClasses] = useState([]); // เก็บ "รายการ" คลาสทั้งหมด (Array)
  const [classData, setClassData] = useState(null); // เก็บข้อมูลของ "คลาสเดียว" (Object)

  // ดึงฟังก์ชัน getToken จาก Clerk's useAuth hook
  const { getToken } = useAuth();

  // --- Helper Functions ---

  /**
   * ฟังก์ชันสำหรับจัดการ Error
   */
  const handleError = (err, action) => {
    console.error(`❌ Error ${action}:`, err.response?.data || err.message);
    setError(err);

    // แสดง Alert เฉพาะ error ที่สำคัญ
    if (err.response?.status === 401) {
      Alert.alert("ผิดพลาด", "กรุณาเข้าสู่ระบบใหม่");
    } else if (err.response?.status === 404) {
      Alert.alert("ผิดพลาด", "ไม่พบข้อมูลที่ต้องการ");
    } else if (err.response?.status >= 500) {
      Alert.alert("ผิดพลาด", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
    }
  };

  // --- Functions ---

  /**
   * สร้างคลาสเรียนใหม่
   */
  const createClass = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      const res = await axios.post(`${API_URL}/classes`, data, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 วินาที timeout
      });

      // อัพเดต classes list
      await fetchUserClasses();
      return res.data;
    } catch (err) {
      handleError(err, "creating class");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ดึง "รายการ" คลาสทั้งหมดที่ผู้ใช้เกี่ยวข้อง
   */
  const fetchUserClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      const res = await axios.get(`${API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      setClasses(Array.isArray(res.data) ? res.data : []);
      return res.data;
    } catch (err) {
      handleError(err, "fetching user classes");
      setClasses([]); // ใส่ array ว่างแทน throw error
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ดึงข้อมูลของ "คลาสเดียว" ตาม ID
   */
  const fetchClassById = useCallback(async (classId) => {
    if (!classId) {
      console.warn("fetchClassById: No classId provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      const res = await axios.get(`${API_URL}/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      setClassData(res.data);
      return res.data;
    } catch (err) {
      console.log(
        `❌ Failed to fetch class ${classId}:`,
        err.response?.data || err.message
      );
      handleError(err, `fetching class ${classId}`);
      setClassData(null);
      throw err; // ส่ง error ต่อไปเพื่อให้ component จัดการ
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * อัปเดตข้อมูลของคลาสตาม ID
   */
  const updateClassesById = useCallback(async (classId, updatedData) => {
    if (!classId) throw new Error("ClassId is required.");

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      const res = await axios.put(
        `${API_URL}/classes/${classId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      // อัพเดต state
      setClassData(res.data);
      setClasses((prev) =>
        prev.map((cls) =>
          cls.class_id === Number(classId)
            ? { ...cls, ...res.data.classDetail }
            : cls
        )
      );

      return res.data;
    } catch (err) {
      handleError(err, "updating class");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * เข้าร่วมคลาสด้วย Join Code
   */
  const joinClass = useCallback(async (joinCode) => {
    if (!joinCode) {
      Alert.alert("ผิดพลาด", "กรุณาใส่รหัสเข้าร่วม");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      const res = await axios.post(
        `${API_URL}/classes/join`,
        { join_code: joinCode },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      // อัพเดต classes list
      await fetchUserClasses();
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        Alert.alert("ผิดพลาด", "ไม่พบคลาสที่ต้องการเข้าร่วม");
      } else if (err.response?.status === 409) {
        Alert.alert("ผิดพลาด", "คุณเป็นสมาชิกของคลาสนี้อยู่แล้ว");
      } else {
        handleError(err, "joining class");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ลบคลาสตาม ID
   */
  const deleteClassById = useCallback(async (classId) => {
    if (!classId) throw new Error("ClassId is required.");

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      await axios.delete(`${API_URL}/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      // อัพเดต state
      setClasses((prev) =>
        prev.filter((cls) => cls.class_id !== Number(classId))
      );

      // // ถ้าคลาสที่ลบคือคลาสที่กำลังดูอยู่ ให้ clear classData
      // if (classData?.classDetail?.class_id === Number(classId)) {
      //   setClassData(null);
      // }

      return true;
    } catch (error) {
      console.error(
        "❌ Error deleting class:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Return ---
  return {
    loading,
    error,
    classes,
    classData,
    createClass,
    fetchUserClasses,
    fetchClassById,
    updateClassesById,
    joinClass,
    deleteClassById,
  };
};
