import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Dropdown from "./Dropdown";

const statusItems = [
  { label: "มีเรียนตามปกติ", value: "have_attended" },
  { label: "ยกเลิกคลาส (ไม่มีเรียน)", value: "no_attended" },
];

const ManageSessionModal = ({ visible, session, onClose, onSave }) => {
  // State ภายใน Modal
  const [isCanceled, setIsCanceled] = useState("have_attended");
  const [note, setNote] = useState("");

  // อัปเดต State เมื่อ prop `session` เปลี่ยน (เมื่อเปิด Modal ใหม่)
  useEffect(() => {
    if (session) {
      setIsCanceled(session.is_canceled ? "no_attended" : "have_attended");
      setNote(session.custom_note || "");
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    onSave({
      sessionId: session.session_id,
      isCanceled: isCanceled === "no_attended", // true ถ้าเลือก no_attended
      note,
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>จัดการคาบเรียน</Text>
          <Text style={styles.modalSubtitle}>
            วันที่: {session.session_date}
          </Text>

          {/* Dropdown เลือกสถานะ */}
          <Text style={styles.label}>สถานะคาบเรียน</Text>
          <Dropdown
            label="เลือกสถานะ"
            items={statusItems}
            value={isCanceled}
            onChange={(value) => setIsCanceled(value)}
            search={false}
          />

          {/* Input สำหรับหมายเหตุ */}
          <Text style={styles.label}>หมายเหตุ (ถ้ามี)</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น อาจารย์ไปทำธุระ"
            placeholderTextColor="#888"
            value={note}
            onChangeText={setNote}
            multiline
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onClose}
            >
              <Text style={styles.textStyle}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={handleSave}
            >
              <Text style={styles.textStyle}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Styles ---
// ผมใช้ StyleSheet ปกติแทน NativeWind เพื่อความกระชับ
// คุณสามารถแปลงเป็น className ของ NativeWind ได้
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#a0a0a0",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "white",
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#2E2E2E",
    color: "white",
    borderRadius: 10,
    padding: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    marginLeft: 10,
  },
  buttonClose: {
    backgroundColor: "#444",
  },
  buttonSave: {
    backgroundColor: "#3b82f6",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ManageSessionModal;
