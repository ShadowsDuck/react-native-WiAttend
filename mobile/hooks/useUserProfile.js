import axios from "axios";
import { useState, useCallback } from "react";
import { Alert } from "react-native";

const API_URL = "http://192.168.0.3:3000/api/users";

export const useUserProfile = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserProfile = useCallback(async (user_id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/profile/${user_id}`);
      setUsers(res.data);
    } catch (error) {
      console.log("Error fetching users", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลผู้ใช้ได้", [
        { text: "ตกลง", onPress: () => console.log("OK Pressed") },
      ]);
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
    fetchUserProfile,
    createUserProfile,
  };
};
