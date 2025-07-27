import { useCallback, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import axios from "axios";
import API_URL from "../config/api";

export const useSchedule = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [schedule, setSchedule] = useState([]);

  const createSchedule = useCallback(
    async (classId, data) => {
      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });

        const res = await axios.post(
          `${API_URL}/classes/${classId}/schedules`,
          {
            day_of_week: data.day_of_week,
            start_time: data.start_time,
            end_time: data.end_time,
            checkin_close_after_min: data.checkin_close_after_min,
            room_id: data.room_id,
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
          "❌ Error creating schedule:",
          error.response?.data || error
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    loading,
    error,
    // schedule,
    createSchedule,
  };
};
