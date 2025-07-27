import axios from "axios";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import API_URL from "../config/api";

export const useSessions = () => {
  const { getToken } = useAuth();

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

  return {
    loading,
    checkin,
  };
};
