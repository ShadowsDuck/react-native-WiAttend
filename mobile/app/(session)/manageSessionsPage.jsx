// Vibe Code 100%
import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSessions } from "../../hooks/useSessions";

// --- Components ---
import Header from "../../components/Header";
import CalendarSection from "../../components/CalendarSection";
import SessionsList from "../../components/SessionsList";
import Loading from "../../components/Loading";
import ManageSessionModal from "../../components/ManageSessionModal";

// --- Utils ---
import { setupThaiCalendar, formatThaiDate } from "../../utils/calendarConfig";
import { toLocalDateString } from "../../utils/toLocalDateString";

// ตั้งค่าปฏิทินไทยเมื่อแอปเริ่มทำงาน
setupThaiCalendar();

const ManageSessionsPage = () => {
  const { class_id, isOwner } = useLocalSearchParams();
  const { sessions, fetchSessionsByClass, updateSession, loading } =
    useSessions();
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const isUserOwner = isOwner === "true";

  // วันที่ปัจจุบัน
  const todayString = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString);

  // เดือนและปีปัจจุบัน
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  // เก็บ sessions ทั้งหมด
  const [allSessions, setAllSessions] = useState([]);

  // ใช้สำหรับแสดง Loading ครั้งแรก
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ✅ ใช้ useMemo แทน useRef
  const loadedMonths = useMemo(() => new Set(), []);
  const monthLoadingStates = useMemo(() => new Map(), []);

  // อัปเดต allSessions เมื่อ sessions เปลี่ยน
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setAllSessions((prevSessions) => {
        const existing = new Set(
          prevSessions.map((s) => s.id || `${s.session_date}-${s.session_time}`)
        );

        const newSessions = sessions.filter(
          (s) => !existing.has(s.id || `${s.session_date}-${s.session_time}`)
        );

        return [...prevSessions, ...newSessions];
      });
    }
  }, [sessions]);

  // ฟังก์ชันโหลดข้อมูลของเดือน
  const fetchMonthData = useCallback(
    async (month, year) => {
      if (!class_id) return;

      const monthKey = `${year}-${month}`;
      if (loadedMonths.has(monthKey) || monthLoadingStates.has(monthKey))
        return;

      monthLoadingStates.set(monthKey, true);
      try {
        await fetchSessionsByClass(class_id, month, year);
        loadedMonths.add(monthKey);
      } finally {
        monthLoadingStates.delete(monthKey);
      }
    },
    [class_id, fetchSessionsByClass, loadedMonths, monthLoadingStates]
  );

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    if (class_id) {
      const { month, year } = currentMonth;

      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      Promise.all([
        fetchMonthData(prevMonth, prevYear),
        fetchMonthData(month, year),
        fetchMonthData(nextMonth, nextYear),
      ]).finally(() => setIsInitialLoading(false));
    }
  }, [class_id]);

  // โหลดข้อมูลเมื่อเปลี่ยนเดือน
  useEffect(() => {
    if (class_id && !isInitialLoading) {
      fetchMonthData(currentMonth.month, currentMonth.year);
    }
  }, [class_id, currentMonth, isInitialLoading, fetchMonthData]);

  // โหลดข้อมูลเมื่อเลือกวันที่
  useEffect(() => {
    if (class_id && selectedDate && !isInitialLoading) {
      const d = new Date(selectedDate);
      fetchMonthData(d.getMonth() + 1, d.getFullYear());
    }
  }, [class_id, selectedDate, isInitialLoading, fetchMonthData]);

  // ปักหมุดวันที่ใน Calendar
  const markedDates = useMemo(() => {
    const marks = {};

    if (allSessions.length > 0) {
      const sessionsByDate = {};
      allSessions.forEach((session) => {
        const date = session.session_date;
        if (!sessionsByDate[date]) sessionsByDate[date] = [];
        sessionsByDate[date].push(session);
      });

      Object.keys(sessionsByDate).forEach((date) => {
        const hasActive = sessionsByDate[date].some((s) => !s.is_canceled);
        marks[date] = {
          marked: true,
          dotColor: hasActive ? "#4CAF50" : "#EF5350",
        };
      });
    }

    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = "#3b82f6";
    } else {
      marks[selectedDate] = { selected: true, selectedColor: "#3b82f6" };
    }

    return marks;
  }, [allSessions, selectedDate]);

  const sessionsForSelectedDate = useMemo(
    () => allSessions.filter((s) => s.session_date === selectedDate),
    [allSessions, selectedDate]
  );

  // --- Handlers ---
  const handleDayPress = useCallback((day) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleMonthChange = useCallback((date) => {
    setCurrentMonth({ month: date.month, year: date.year });
  }, []);

  const handleManageSession = useCallback((session) => {
    setSelectedSession(session); // เก็บข้อมูล session ที่ถูกเลือก
    setIsModalVisible(true); // เปิด Modal
  }, []);

  const handleSaveChanges = async ({ sessionId, isCanceled, note }) => {
    try {
      await updateSession(sessionId, isCanceled, note);

      setAllSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId
            ? { ...s, is_canceled: isCanceled, custom_note: note }
            : s
        )
      );

      Alert.alert("สำเร็จ", "อัปเดตสถานะคาบเรียนเรียบร้อยแล้ว");
      handleCloseModal();
    } catch {
      Alert.alert("ผิดพลาด", "ไม่สามารถอัปเดตคาบเรียนได้");
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedSession(null);
  };

  const handleViewAttendance = (sessionId) => {
    router.push({
      pathname: "/(attendance)/viewAttendance",
      params: { session_id: sessionId },
    });
  };

  // Loading state
  if ((isInitialLoading || loading) && allSessions.length === 0) {
    return (
      <View className="flex-1 bg-[#121212]">
        <Header backgroundColor="#252525" onBackPress={() => router.back()} />
        <Loading />
      </View>
    );
  }

  // UI
  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#252525" onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <CalendarSection
          current={`${currentMonth.year}-${String(currentMonth.month).padStart(
            2,
            "0"
          )}-01`}
          selectedDate={selectedDate}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
        />

        <SessionsList
          sessions={sessionsForSelectedDate}
          selectedDate={selectedDate}
          onManageSession={handleManageSession}
          onViewAttendance={handleViewAttendance}
          formatThaiDate={formatThaiDate}
          isOwner={isUserOwner}
        />
      </ScrollView>

      <ManageSessionModal
        visible={isModalVisible}
        session={selectedSession}
        onClose={handleCloseModal}
        onSave={handleSaveChanges}
      />
    </View>
  );
};

export default ManageSessionsPage;
