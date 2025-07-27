import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-expo";
import API_URL from "../config/api";

export const useRooms = () => {
  const { getToken } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken({ template: "wiattend-api" });

      const res = await axios.get(`${API_URL}/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ตรวจสอบว่าข้อมูลที่ได้เป็น array
      if (Array.isArray(res.data)) {
        setRooms(res.data);
      } else {
        // ถ้าข้อมูลที่ได้มาไม่ถูกต้อง ให้ตั้งเป็น array ว่าง
        console.warn("Expected an array of rooms, but received:", res.data);
        setRooms([]);
      }
    } catch (err) {
      console.error(
        "❌ Error fetching rooms:",
        err.response?.data || err.message
      );
      setError(err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return { rooms, loading, error, fetchAllRooms };
};
