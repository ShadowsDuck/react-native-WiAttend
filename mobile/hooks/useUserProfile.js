import axios from "axios";
import { useState, useCallback } from "react";

const API_URL = "http://192.168.0.3:3000/api/users";

export const useUserProfile = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (user_id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/profile/${user_id}`);
      setUsers(res.data);
    } catch (error) {
      setError(error);
      console.log("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUserProfile = async (token) => {
    try {
      const res = await axios.post(
        `${API_URL}/profile`,
        {}, // ถ้า backend ไม่ต้องการ body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error("❌ Error creating user:", error.response?.data || error);
      throw error;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUserProfile,
  };
};
