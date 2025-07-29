// Vibe Code 100%
import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSessions } from "../../hooks/useSessions";

// --- Components ---
import Header from "../../components/Header";
import CalendarSection from "../../components/CalendarSection";
import SessionsList from "../../components/SessionsList";
import Loading from "../../components/Loading";

// --- Utils ---
import { setupThaiCalendar, formatThaiDate } from "../../utils/calendarConfig";
import { toLocalDateString } from "../../utils/toLocalDateString";

// ตั้งค่าปฏิทินไทยเมื่อแอปเริ่มทำงาน
setupThaiCalendar();

const ManageSessionsPage = () => {
  const { class_id, isOwner } = useLocalSearchParams();
  const { sessions, loading, fetchSessionsByClass } = useSessions();
  const router = useRouter();

  const isUserOwner = isOwner === "true";

  // กำหนดวันที่ปัจจุบันเป็นค่าเริ่มต้นของวันที่เลือก
  const todayString = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString);
  // กำหนดเดือนและปีปัจจุบันเป็นค่าเริ่มต้นของปฏิทิน
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  // สถานะสำหรับเก็บ sessions ทั้งหมดที่โหลดมาได้จากทุกเดือน
  const [allSessions, setAllSessions] = useState([]);

  // ใช้ `useRef` เพื่อจัดการสถานะว่าเดือนไหนถูกโหลดไปแล้วบ้าง และเดือนไหนกำลังโหลดอยู่
  // การใช้ useRef ช่วยให้ข้อมูลเหล่านี้ไม่ทำให้ component re-render เมื่อมีการเปลี่ยนแปลง
  const loadedMonths = useRef(new Set()); // เก็บ key เช่น "2023-1" ของเดือนที่โหลดแล้ว
  const monthLoadingStates = useRef(new Map()); // เก็บ key เช่น "2023-1" ของเดือนที่กำลังโหลดอยู่

  // Effect ที่จะทำงานเมื่อ `sessions` จาก `useSessions` hook มีการเปลี่ยนแปลง
  // ใช้เพื่อรวม sessions ที่เพิ่งโหลดมาใหม่ เข้ากับ `allSessions` ที่มีอยู่แล้ว
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setAllSessions((prevSessions) => {
        // สร้าง Set ของ ID sessions ที่มีอยู่แล้วเพื่อตรวจสอบการซ้ำกันอย่างรวดเร็ว
        const existingSessionIdentifiers = new Set(
          prevSessions.map((s) => s.id || `${s.session_date}-${s.session_time}`)
        );

        // กรองเอาเฉพาะ sessions ใหม่ที่ยังไม่มีใน `allSessions`
        const newSessions = sessions.filter(
          (s) =>
            !existingSessionIdentifiers.has(
              s.id || `${s.session_date}-${s.session_time}`
            )
        );

        // คืนค่าเป็น array ที่รวม sessions เก่าและใหม่
        return [...prevSessions, ...newSessions];
      });
    }
  }, [sessions]); // Dependency คือ `sessions`

  // ฟังก์ชันรวมสำหรับการดึงข้อมูล sessions ของแต่ละเดือน
  // ใช้ useCallback เพื่อป้องกันการสร้างฟังก์ชันใหม่ซ้ำๆ ในทุก re-render
  const fetchMonthData = useCallback(
    async (month, year) => {
      if (!class_id) return; // ถ้าไม่มี class_id ก็ไม่ทำอะไร

      const monthKey = `${year}-${month}`;

      // ป้องกันการดึงข้อมูลซ้ำ ถ้าเดือนนั้นโหลดไปแล้ว หรือกำลังโหลดอยู่
      if (
        loadedMonths.current.has(monthKey) ||
        monthLoadingStates.current.has(monthKey)
      ) {
        return;
      }

      // ตั้งค่าสถานะว่าเดือนนี้กำลังโหลด
      monthLoadingStates.current.set(monthKey, true);

      try {
        await fetchSessionsByClass(class_id, month, year);
        loadedMonths.current.add(monthKey); // เมื่อโหลดสำเร็จ ให้เพิ่มเดือนลงใน set ของเดือนที่โหลดแล้ว
      } catch (error) {
        console.error("Error fetching sessions:", error);
        // สามารถจัดการ error ได้ที่นี่ เช่น แสดงข้อความแจ้งเตือน
        // หรือถ้าอยากให้ลองโหลดใหม่ได้อีก ให้ลบออกจาก loadedMonths.current.delete(monthKey);
      } finally {
        monthLoadingStates.current.delete(monthKey); // ไม่ว่าจะสำเร็จหรือล้มเหลว ก็ลบสถานะ loading ออก
      }
    },
    [class_id, fetchSessionsByClass] // Dependencies สำหรับ useCallback
  );

  // Effect สำหรับการโหลดข้อมูลเริ่มต้นเมื่อ component ถูก mount ครั้งแรก
  // จะโหลดข้อมูลสำหรับเดือนปัจจุบัน
  useEffect(() => {
    if (class_id) {
      fetchMonthData(currentMonth.month, currentMonth.year);
    }
  }, [class_id, fetchMonthData]);

  // Effect สำหรับการโหลดข้อมูลเมื่อมีการเปลี่ยนเดือนในปฏิทิน (เช่น ปัดไปเดือนอื่น)
  useEffect(() => {
    if (class_id) {
      fetchMonthData(currentMonth.month, currentMonth.year);
    }
  }, [class_id, currentMonth.month, currentMonth.year, fetchMonthData]);

  // Effect สำหรับการโหลดข้อมูลเมื่อมีการเลือกวันที่ในปฏิทิน
  // ถ้าวันที่เลือกอยู่ในเดือนที่ยังไม่เคยโหลด ก็จะโหลดข้อมูลสำหรับเดือนนั้น
  useEffect(() => {
    if (class_id && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const selectedMonth = selectedDateObj.getMonth() + 1;
      const selectedYear = selectedDateObj.getFullYear();
      fetchMonthData(selectedMonth, selectedYear);
    }
  }, [class_id, selectedDate, fetchMonthData]);

  // คำนวณสถานะการโหลดสำหรับวันที่ที่เลือกอยู่ปัจจุบัน
  // ใช้ useMemo เพื่อให้คำนวณใหม่เมื่อ `selectedDate` หรือ `sessions` เปลี่ยนเท่านั้น
  const isLoadingForSelectedDate = useMemo(() => {
    if (!selectedDate) return false;
    const selectedDateObj = new Date(selectedDate);
    const selectedMonth = selectedDateObj.getMonth() + 1;
    const selectedYear = selectedDateObj.getFullYear();
    const selectedMonthKey = `${selectedYear}-${selectedMonth}`;
    return monthLoadingStates.current.has(selectedMonthKey);
  }, [selectedDate, sessions]);

  // เตรียมข้อมูล `markedDates` สำหรับปฏิทิน (วันที่ที่มี sessions)
  // ใช้ useMemo เพื่อให้คำนวณใหม่เมื่อ `allSessions` หรือ `selectedDate` เปลี่ยนเท่านั้น
  const markedDates = useMemo(() => {
    const marks = {};

    if (allSessions && allSessions.length > 0) {
      const sessionsByDate = {};
      // จัดกลุ่ม sessions ตามวันที่
      allSessions.forEach((session) => {
        const date = session.session_date;
        if (!sessionsByDate[date]) {
          sessionsByDate[date] = [];
        }
        sessionsByDate[date].push(session);
      });

      // กำหนดเครื่องหมายและสีจุดสำหรับแต่ละวันที่มี sessions
      Object.keys(sessionsByDate).forEach((date) => {
        const sessionsInDay = sessionsByDate[date];
        // ตรวจสอบว่ามี sessions ที่ยังไม่ถูกยกเลิกหรือไม่
        const hasActiveSessions = sessionsInDay.some(
          (session) => !session.is_canceled
        );
        marks[date] = {
          marked: true,
          dotColor: hasActiveSessions ? "#4CAF50" : "#EF5350", // เขียวถ้ามี session ที่ active, แดงถ้ามีแต่ session ที่ถูกยกเลิก
        };
      });
    }

    // เพิ่มสถานะ `selected` สำหรับวันที่ที่ผู้ใช้เลือก
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = "#3b82f6"; // สีฟ้าสำหรับวันที่เลือก
    } else {
      // ถ้าวันที่เลือกไม่มี session เลย ก็แค่แสดงว่าเป็นวันที่เลือก
      marks[selectedDate] = { selected: true, selectedColor: "#3b82f6" };
    }

    return marks;
  }, [allSessions, selectedDate]);

  // กรอง sessions ที่ตรงกับวันที่ผู้ใช้เลือกเท่านั้น
  // ใช้ useMemo เพื่อให้คำนวณใหม่เมื่อ `allSessions` หรือ `selectedDate` เปลี่ยนเท่านั้น
  const sessionsForSelectedDate = useMemo(
    () => allSessions?.filter((s) => s.session_date === selectedDate) || [],
    [allSessions, selectedDate]
  );

  // --- Handlers ---
  // ฟังก์ชันเมื่อผู้ใช้กดที่วันที่ในปฏิทิン
  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString);
  }, []);

  // ฟังก์ชันเมื่อผู้ใช้เปลี่ยนเดือนในปฏิทิน
  const handleMonthChange = useCallback((date) => {
    setCurrentMonth({ month: date.month, year: date.year });
  }, []);

  // ฟังก์ชันสำหรับจัดการเมื่อกดปุ่ม "จัดการคาบเรียน"
  const handleManageSession = useCallback((session) => {
    Alert.alert(`จัดการคาบเรียน`, `วันที่: ${session.session_date}`);
  }, []);

  // ฟังก์ชันสำหรับจัดการเมื่อกดปุ่ม "ดูการเช็คชื่อ" - แก้ไขให้นำทางไปหน้าใหม่
  const handleViewAttendance = (sessionId) => {
    // นำทางไปยังหน้าดูการเช็คชื่อ
    router.push({
      pathname: "/(attendance)/viewAttendance",
      params: {
        session_id: sessionId,
      },
    });
  };

  // แสดง Loading เต็มหน้าจอเฉพาะตอนที่กำลังโหลดข้อมูลครั้งแรก (และยังไม่มี sessions เลย)
  if (loading && allSessions.length === 0) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" onBackPress={() => router.back()} />
        <Loading />
      </View>
    );
  }

  // UI ของหน้า
  return (
    <View className="flex-1 bg-[#121212]">
      {/* Header component */}
      <Header backgroundColor="#252525" onBackPress={() => router.back()} />

      {/* Scrollable content area */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Section */}
        <CalendarSection
          initialDate={selectedDate}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
        />

        {/* Sessions List Section */}
        <SessionsList
          sessions={sessionsForSelectedDate}
          loading={loading || isLoadingForSelectedDate}
          selectedDate={selectedDate}
          onManageSession={handleManageSession}
          onViewAttendance={handleViewAttendance}
          formatThaiDate={formatThaiDate}
          isOwner={isUserOwner}
        />
      </ScrollView>
    </View>
  );
};

export default ManageSessionsPage;
