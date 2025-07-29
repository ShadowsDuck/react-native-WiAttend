import axios from "axios";
import { useCallback, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import API_URL from "../config/api";

export const useAttendances = () => {
  const { getToken } = useAuth();

  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceSessionById = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        setAttendanceData([]);
        return;
      }
      setLoading(true);

      try {
        const token = await getToken({ template: "wiattend-api" });
        const res = await axios.get(
          `${API_URL}/sessions/${sessionId}/attendances`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAttendanceData(res.data || []);
      } catch (err) {
        console.error(
          "❌ Error fetching attendances session:",
          err.response?.data || err.message
        );
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    loading,
    attendanceData,
    fetchAttendanceSessionById,
  };
};
