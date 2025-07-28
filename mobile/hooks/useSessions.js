import axios from "axios";
import { useCallback, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import API_URL from "../config/api";

export const useSessions = () => {
  const { getToken } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkin = async (sessionId, scannedWifiData) => {
    if (!sessionId) {
      console.error("❌ Check-in failed: sessionId is missing.");
      throw new Error("Session ID is required.");
    }
    if (!scannedWifiData || scannedWifiData.length === 0) {
      throw new Error("Wi-Fi scan data is required.");
    }

    setLoading(true);
    try {
      const token = await getToken();

      const res = await axios.post(
        `${API_URL}/sessions/${sessionId}/checkin`,
        { wifiData: scannedWifiData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionsByClass = useCallback(
    async (classId, month, year) => {
      if (!classId || !month || !year) {
        setSessions([]);
        return;
      }
      setLoading(true);

      try {
        const token = await getToken({ template: "wiattend-api" });
        const res = await axios.get(`${API_URL}/classes/${classId}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
          // ส่ง month และ year เป็น query params
          params: { month, year },
        });
        setSessions(res.data || []);
      } catch (err) {
        console.error(
          "❌ Error fetching class sessions:",
          err.response?.data || err.message
        );
        setSessions([]);
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    loading,
    sessions,
    checkin,
    fetchSessionsByClass,
  };
};
