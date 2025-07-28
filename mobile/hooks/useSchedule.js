import { useCallback, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import API_URL from "../config/api";

export const useSchedule = () => {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);

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

  const fetchScheduleById = useCallback(
    async (scheduleId) => {
      if (!scheduleId) throw new Error("scheduleId is required");

      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });

        const res = await axios.get(`${API_URL}/schedules/${scheduleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setScheduleData(res.data);
        return res.data;
      } catch (error) {
        console.error(
          "❌ Error fetching schedule:",
          error.response?.data?.message || error.message
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  const updateScheduleById = useCallback(
    async (scheduleId, updatedData) => {
      if (!scheduleId) throw new Error("scheduleId is required.");
      if (!updatedData || typeof updatedData !== "object") {
        throw new Error("updatedData must be an object.");
      }

      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });

        const res = await axios.put(
          `${API_URL}/schedules/${scheduleId}`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.status === 200) {
          setScheduleData(res.data);
          return res.data;
        } else {
          throw new Error("Failed to update schedule");
        }
      } catch (error) {
        console.error(
          "❌ Error updating schedule:",
          error.response?.data || error.message
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  const deleteScheduleById = useCallback(
    async (scheduleId) => {
      if (!scheduleId) throw new Error("scheduleId is required.");

      setLoading(true);
      try {
        const token = await getToken({ template: "wiattend-api" });

        await axios.delete(`${API_URL}/schedules/${scheduleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        return true;
      } catch (error) {
        console.error(
          "❌ Error deleting schedule:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    loading,
    scheduleData,
    createSchedule,
    fetchScheduleById,
    updateScheduleById,
    deleteScheduleById,
  };
};
