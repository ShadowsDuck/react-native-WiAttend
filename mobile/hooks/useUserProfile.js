import axios from "axios";
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import API_URL from "../config/api";

export const useUserProfile = () => {
  const { getToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserProfile = useCallback(async (user_id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/profile/${user_id}`);
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

  const createUserProfile = async (device_id) => {
    try {
      const token = await getToken();

      const res = await axios.post(
        `${API_URL}/users/profile`,
        { device_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (error) {
      if (
        error.response?.status === 409 ||
        error.response?.status === 400 ||
        error.response?.data?.message?.includes("already exists")
      ) {
        console.log("User already exists, continuing...");
        return { message: "User exists" };
      }

      throw error;
    }
  };

  const updateUserProfile = useCallback(
    async (updatedData) => {
      setLoading(true);
      try {
        const token = await getToken();

        const res = await axios.put(
          `${API_URL}/users/profile/editProfile`,
          updatedData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUsers(res.data);
        return res.data;
      } catch (error) {
        console.error(
          "❌ Error updating profile:",
          error.response?.data || error
        );
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตข้อมูลได้");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    users,
    loading,
    fetchUserProfile,
    createUserProfile,
    updateUserProfile,
  };
};
