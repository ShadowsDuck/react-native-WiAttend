// useClasses.js
import { useCallback, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import axios from "axios";
import API_URL from "../config/api";

export const useClasses = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classData, setClassData] = useState(null);

  const createClass = useCallback(
    async (data) => {
      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });

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
    },
    [getToken]
  );

  const fetchUserClasses = useCallback(
    async (options = {}) => {
      const { retryCount = 0 } = options;
      if (!user) {
        setHasInitialized(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getToken({ template: "wiattend-api" });
        const res = await axios.get(`${API_URL}/classes`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });

        setClasses(res.data || []);
        // โหลดสำเร็จ - เปลี่ยน hasInitialized เป็น true
        setHasInitialized(true);
      } catch (error) {
        const isServerNotReady =
          typeof error.response?.data === "string" &&
          error.response.data.includes("<!DOCTYPE html>");

        if (isServerNotReady && retryCount < 3) {
          console.log(
            `🔄 Server not ready, retrying... (Attempt ${retryCount + 1})`
          );
          const waitTime = (retryCount + 1) * 1500;
          // ไม่เปลี่ยน hasInitialized ตรงนี้ ให้ยังคง loading ต่อไป
          setTimeout(
            () => fetchUserClasses({ retryCount: retryCount + 1 }),
            waitTime
          );
          return; // ออกจากการทำงานเพื่อรอ retry
        }

        console.error(
          "❌ Error fetching classes (Final):",
          error.response?.data || error.message
        );
        setError(error);
        // retry หมดแล้ว หรือ error อื่นๆ - เปลี่ยน hasInitialized เป็น true
        setHasInitialized(true);
      } finally {
        setLoading(false);
      }
    },
    [user, getToken]
  );

  const fetchClassById = useCallback(
    async (classId, options = {}) => {
      const { retryCount = 0 } = options;
      if (!classId) return;

      setLoading(true);
      setError(null);

      try {
        const token = await getToken({ template: "wiattend-api" });
        const res = await axios.get(`${API_URL}/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });

        setClassData(res.data);
        // โหลดสำเร็จ - เปลี่ยน hasInitialized เป็น true
        setHasInitialized(true);
      } catch (error) {
        const isServerNotReady =
          typeof error.response?.data === "string" &&
          error.response.data.includes("<!DOCTYPE html>");

        if (isServerNotReady && retryCount < 2) {
          console.log(
            `🔄 Retrying fetchClassById... (Attempt ${retryCount + 1})`
          );
          const waitTime = (retryCount + 1) * 1500;
          // ไม่เปลี่ยน hasInitialized ตรงนี้ ให้ยังคง loading ต่อไป
          setTimeout(
            () => fetchClassById(classId, { retryCount: retryCount + 1 }),
            waitTime
          );
          return; // ออกจากการทำงานเพื่อรอ retry
        }

        console.error(
          "❌ Error fetching class by ID (Final):",
          error.response?.data || error.message
        );
        setError(error);
        setClassData(null); // ล้างข้อมูลเก่าหากล้มเหลว
        // retry หมดแล้ว หรือ error อื่นๆ - เปลี่ยน hasInitialized เป็น true
        setHasInitialized(true);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  const updateClassesById = useCallback(
    async (classId, updatedData) => {
      if (!classId) throw new Error("ClassId is required.");

      setLoading(true);
      setError(null);

      try {
        const token = await getToken({ template: "wiattend-api" });

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
    },
    [getToken]
  );

  const joinClass = useCallback(
    async (data) => {
      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });

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
        console.error(
          "❌ Error join classroom:",
          error.response?.data || error
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  const deleteClassById = useCallback(
    async (classId) => {
      if (!classId) throw new Error("ClassId is required.");

      setLoading(true);
      setError(null);

      try {
        const token = await getToken({ template: "wiattend-api" });

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
    },
    [getToken]
  );

  // เพิ่มฟังก์ชันสำหรับ reset state เมื่อเปลี่ยนคลาส
  const resetClassData = useCallback(() => {
    setClassData(null);
    setError(null);
    setHasInitialized(false);
    setLoading(false);
  }, []);

  return {
    loading,
    hasInitialized,
    error,
    classes,
    classData,
    createClass,
    fetchUserClasses,
    fetchClassById,
    resetClassData,
    updateClassesById,
    joinClass,
    deleteClassById,
  };
};
