import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState, useRef, useEffect } from "react";

const TimePicker = ({ label, error }) => {
  const [showTime, setShowTime] = useState(false);
  const [formData, setFormData] = useState({
    time: "",
  });

  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showTime) {
      setIsFocused(false);
    }
  }, [showTime]);

  // แสดง label ถ้ามีค่า
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || formData.time ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, formData.time, labelAnim]);

  // ปรับ label style
  const labelStyle = {
    position: "absolute",
    left: 18,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error ? "#f87171" : isFocused ? "#6D28D9" : "#aaa",
    backgroundColor: "#121212",
    paddingHorizontal: 4,
  };

  const getBorderColor = () => {
    if (error) return "#f87171";
    if (isFocused) return "#6D28D9";
    return "rgba(255,255,255,0.2)";
  };

  return (
    <View style={{ marginBottom: 10 }}>
      {showTime && (
        <DateTimePicker
          value={formData.time ? new Date(formData.time) : new Date()}
          mode="time"
          display="default"
          is24Hour={true}
          onChange={(event, selectedTime) => {
            setShowTime(false);
            if (event.type === "set" && selectedTime) {
              setFormData({ ...formData, time: selectedTime.toISOString() });
            }
          }}
        />
      )}
      <View
        style={[
          styles.container,
          {
            borderColor: getBorderColor(),
          },
        ]}
      >
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => {
            setIsFocused(true);
            setShowTime(true);
          }}
        >
          <TextInput
            style={styles.text}
            placeholder=""
            editable={false}
            value={
              formData.time
                ? new Date(formData.time).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false, // <-- บอกว่าไม่ใช้ AM/PM
                  })
                : ""
            }
            onBlur={() => setIsFocused(false)}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: "#121212",
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingLeft: 6,
    paddingTop: 10,
    justifyContent: "center",
  },
  text: {
    color: "white",
    marginLeft: 15,
    fontSize: 16,
  },
  error: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 6,
  },
});

export default TimePicker;
