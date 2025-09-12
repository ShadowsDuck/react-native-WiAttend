import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import API_URL from "../config/api";

export const useAttendanceExporter = () => {
  const { getToken } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const exportSummary = useCallback(
    async (classId) => {
      if (!classId) {
        Alert.alert("Error", "Class ID is missing. Cannot export.");
        return;
      }
      setIsExporting(true);

      try {
        // 1. ดึง Token จาก Clerk เหมือนเดิมทุกประการ
        const token = await getToken({ template: "wiattend-api" });

        // 2. สร้าง URL สำหรับ Export
        const exportUrl = `${API_URL}/classes/${classId}/export`;

        // 3. **ข้อแตกต่างสำคัญ**: WebBrowser ไม่สามารถส่ง Custom Headers (เช่น Authorization) ได้
        // เราจึงต้องส่ง Token ไปกับ URL ผ่าน Query Parameter แทน
        const exportUrlWithToken = `${exportUrl}?token=${token}`;

        // 4. เปิด URL ใน In-App Browser
        await WebBrowser.openBrowserAsync(exportUrlWithToken);
      } catch (err) {
        console.error("❌ Error exporting summary:", err);
        Alert.alert(
          "Export Failed",
          "An error occurred while trying to download the file."
        );
      } finally {
        setIsExporting(false);
      }
    },
    [getToken]
  );

  return { isExporting, exportSummary };
};
