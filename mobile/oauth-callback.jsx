// app/oauth-callback.tsx
import { View, ActivityIndicator } from "react-native";
import React from "react";

const OAuthCallback = () => {
  // หน้านี้จะแสดงแค่ชั่วครู่เดียวตอนที่แอปกำลังจัดการ session
  // Clerk จะจัดการปิดหน้านี้ให้เองเมื่อเสร็จสิ้น
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default OAuthCallback;
