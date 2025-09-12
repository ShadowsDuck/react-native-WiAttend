import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import API_URL from "../config/api";

export const useClassMembers = (classId) => {
  const { getToken } = useAuth();
  const [membersData, setMembersData] = useState({
    teacher: null,
    students: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClassMembers = useCallback(async () => {
    if (!classId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "wiattend-api" });
      const finalUrl = `${API_URL}/classes/${classId}/members`;

      const response = await axios.get(finalUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembersData(response.data);
    } catch (err) {
      console.error(
        "❌ Error fetching class members:",
        err.response?.data || err.message
      );
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassMembers();
  }, [fetchClassMembers]);

  // คืนค่า error และ function refetch ไปด้วย เพื่อให้ UI จัดการได้
  return { membersData, loading, error, refetch: fetchClassMembers };
};
