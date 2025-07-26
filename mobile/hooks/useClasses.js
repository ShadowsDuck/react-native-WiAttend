import { useCallback, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import axios from "axios";
import API_URL from "../config/api";

export const useClasses = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  // ใช้ useRef เพื่อเก็บ getToken โดยไม่ให้มันเป็น dependency
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken; // อัปเดต ref ทุกครั้งที่ render

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classData, setClassData] = useState(null);

  // เพิ่ม state สำหรับติดตามว่าเคยโหลดข้อมูลแล้วหรือยัง
  const [hasInitialized, setHasInitialized] = useState(false);

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMessage, setRetryMessage] = useState("");

  const createClass = useCallback(async (data) => {
    setLoading(true);
    try {
      const token = await getTokenRef.current();

      const res = await axios.post(
        `${API_URL}/classes`,
        {
          subject_name: data.subject_name,
          semester_start_date: data.semester_start_date,
          semester_weeks: parseInt(data.semester_weeks),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error(
        "❌ Error creating classroom:",
        error.response?.data || error
      );
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserClasses = useCallback(
    async (options = {}) => {
      const { retryCount = 0, isRefresh = false } = options;

      if (!user) {
        setInitialLoading(false);
        return;
      }

      setLoading(true);
      if (retryCount === 0) {
        setError(null);
        setIsRetrying(false);
      } else {
        if (!isRefresh) {
          setIsRetrying(true);
        }
      }
      setRetryAttempt(retryCount);

      try {
        const token = await getTokenRef.current();
        const res = await axios.get(`${API_URL}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 6000,
        });

        if (Array.isArray(res.data)) {
          setClasses(res.data);
          setInitialLoading(false);
          setIsRetrying(false);
        } else {
          setClasses([]);
          setInitialLoading(false);
          setIsRetrying(false);
        }
        setLoading(false);
      } catch (error) {
        console.log(
          `❌ Fetch failed (attempt ${retryCount + 1}):`,
          error.message
        );
        const isServerNotReady =
          typeof error.response?.data === "string" &&
          error.response.data.includes("<!DOCTYPE html>");

        if (isServerNotReady && retryCount < 2) {
          const waitTime = (retryCount + 1) * 1500;
          console.log(
            `🔄 Server not ready, retrying in ${waitTime / 1000} seconds...`
          );
          setRetryMessage(`เซิร์ฟเวอร์ยังไม่พร้อม รอ ${waitTime / 1000} วิ...`);

          setTimeout(() => {
            fetchUserClasses({ ...options, retryCount: retryCount + 1 });
          }, waitTime);

          return;
        } else {
          console.error(
            "❌ Error fetching classes (Final)",
            error.response?.data || error.message
          );
          setError(error);
          setClasses([]);
          setInitialLoading(false);
          setIsRetrying(false);
          setLoading(false);
        }
      }
    },
    [user]
  );

  const fetchClassById = useCallback(async (classId) => {
    if (!classId) {
      console.warn("fetchClassById: No classId provided");
      setError(null);
      setClassData(null);
      setHasInitialized(true); // ถึงแม้ไม่มี classId ก็ถือว่า initialized แล้ว
      return;
    }

    // ถ้ายังไม่เคย initialize ให้เซ็ต loading เป็น true
    if (!hasInitialized) {
      setLoading(true);
    } else {
      // ถ้า initialize แล้ว ให้เซ็ต loading แค่เมื่อไม่มีข้อมูลเก่า
      setLoading(!classData);
    }

    setError(null);

    try {
      const token = await getTokenRef.current();

      const res = await axios.get(`${API_URL}/classes/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.classDetail) {
        setClassData(res.data);
        setError(null);
      } else {
        console.warn("Unexpected response", res.data);
        setClassData(null);
        throw new Error("Invalid data structure received from server.");
      }
    } catch (error) {
      console.error(
        "❌ Error fetching classes by id",
        error.response?.data || error.message
      );
      setError(error);
      setClassData(null);
    } finally {
      setLoading(false);
      setHasInitialized(true); // เซ็ตว่า initialized แล้วไม่ว่าจะสำเร็จหรือไม่
    }
  }, []);

  const updateClassesById = useCallback(async (classId, updatedData) => {
    if (!classId) throw new Error("ClassId is required.");

    setLoading(true);
    setError(null);

    try {
      const token = await getTokenRef.current();

      const res = await axios.put(
        `${API_URL}/classes/${classId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setClassData(res.data);
      setClasses((prev) =>
        prev.map((cls) =>
          cls.class_id === Number(classId)
            ? { ...cls, ...res.data.classDetail }
            : cls
        )
      );

      return res.data;
    } catch (error) {
      console.error(
        "❌ Error updating class:",
        error.response?.data || error.message
      );
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinClass = useCallback(async (data) => {
    setLoading(true);
    try {
      const token = await getTokenRef.current();

      const res = await axios.post(
        `${API_URL}/classes/join`,
        {
          join_code: data.join_code,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error("❌ Error join classroom:", error.response?.data || error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteClassById = useCallback(async (classId) => {
    if (!classId) throw new Error("ClassId is required.");

    setLoading(true);
    setError(null);

    try {
      const token = await getTokenRef.current();

      await axios.delete(`${API_URL}/classes/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setClasses((prev) =>
        prev.filter((cls) => cls.class_id !== Number(classId))
      );

      return true;
    } catch (error) {
      console.error(
        "❌ Error deleting class:",
        error.response?.data || error.message
      );
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // เพิ่มฟังก์ชันสำหรับ reset state เมื่อเปลี่ยนคลาส
  const resetClassData = useCallback(() => {
    setClassData(null);
    setError(null);
    setHasInitialized(false);
    setLoading(false);
  }, []);

  return {
    loading,
    initialLoading,
    error,
    classes,
    classData,
    hasInitialized,
    isRetrying,
    retryAttempt,
    retryMessage,
    createClass,
    fetchUserClasses,
    fetchClassById,
    resetClassData,
    updateClassesById,
    joinClass,
    deleteClassById,
  };
};
