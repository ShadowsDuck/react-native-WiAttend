import axios from "axios";
import { useCallback, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { API_URL } from "../constants/api.js";

export const useClassroom = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [classrooms, setClassrooms] = useState([]);
  const [classInfo, setClassInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createClassroom = async (data) => {
    setLoading(true);
    try {
      const token = await getToken();

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
  };

  const fetchUserClasses = async () => {
    if (!user) {
      console.warn("User not ready");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      const res = await axios.get(`${API_URL}/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (Array.isArray(res.data)) {
        setClassrooms(res.data);
      } else {
        console.warn("Unexpected response", res.data);
        setClassrooms([]);
      }
    } catch (error) {
      console.error(
        "❌ Error fetching classes",
        error.response?.data || error.message
      );
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const joinClassroom = async (data) => {
    setLoading(true);
    try {
      const token = await getToken();

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
  };

  const fetchClassesById = useCallback(async (classId) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();

      const res = await axios.get(`${API_URL}/classes/${classId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data && res.data.classDetail) {
        setClassInfo(res.data);
      } else {
        console.warn("Unexpected response", res.data);
        setClassInfo(null);
      }
    } catch (error) {
      console.error(
        "❌ Error fetching classes by id",
        error.response?.data || error.message
      );
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    classrooms,
    loading,
    error,
    fetchUserClasses,
    createClassroom,
    joinClassroom,
    classInfo,
    fetchClassesById,
  };
};
