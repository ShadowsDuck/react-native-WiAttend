// hooks/useStudentAttendanceDetail.js
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import API_URL from "../config/api";

export const useStudentAttendanceDetail = (classId, userId) => {
  const { getToken } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentAttendanceDetail = useCallback(async () => {
    if (!classId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "wiattend-api" });
      const finalUrl = `${API_URL}/classes/${classId}/students/${userId}`;

      const response = await axios.get(finalUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentData(response.data);
    } catch (err) {
      console.error(
        "❌ Error fetching student detail:",
        err.response?.data || err.message
      );
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [classId, userId]);

  useEffect(() => {
    fetchStudentAttendanceDetail();
  }, [fetchStudentAttendanceDetail]);

  return { studentData, loading, error, refetch: fetchStudentAttendanceDetail };
};
