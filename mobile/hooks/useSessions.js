import axios from "axios";
import { useCallback, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { API_URL } from "../constants/api.js";

export const useSessions = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  // const [classrooms, setClassrooms] = useState([]);
  // const [classInfo, setClassInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkin = async (sessionId) => {
    if (!sessionId) {
      console.error("❌ Check-in failed: sessionId is missing.");
      throw new Error("Session ID is required.");
    }

    setLoading(true);
    try {
      const token = await getToken();

      const res = await axios.post(
        `${API_URL}/sessions/${sessionId}/checkin`,
        {},
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
  };

  return {
    loading,
    checkin,
  };
};
