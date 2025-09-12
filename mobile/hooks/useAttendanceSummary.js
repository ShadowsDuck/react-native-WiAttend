import axios from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
import API_URL from "../config/api";

export const useAttendanceSummary = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(
    async (classId) => {
      if (!classId) return;
      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });
        const res = await axios.get(`${API_URL}/classes/${classId}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error(
          "❌ Error fetching summary:",
          err.response?.data || err.message
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return { data, loading, fetchSummary };
};
