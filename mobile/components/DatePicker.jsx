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
import { formatDate } from "../utils/formatDate";

const DatePicker = ({ label, value, onChange, error }) => {
  const [showDate, setShowDate] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showDate) {
      setIsFocused(false);
    }
  }, [showDate]);

  // แสดง label ถ้ามีค่า
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, labelAnim]);

  // ปรับ label style
  const labelStyle = {
    position: "absolute",
    left: 18,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18.5, -10],
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

  // const formatDate = (date) => {
  //   const d = new Date(date);
  //   const day = d.getDate().toString().padStart(2, "0");
  //   const month = (d.getMonth() + 1).toString().padStart(2, "0");
  //   const year = d.getFullYear();
  //   return `${day}-${month}-${year}`;
  // };

  return (
    <View style={{ marginBottom: 10 }}>
      {showDate && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDate(false);
            if (event.type === "set" && selectedDate) {
              onChange(selectedDate.toISOString());
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
            setShowDate(true);
          }}
        >
          <TextInput
            style={styles.text}
            placeholder=""
            editable={false}
            value={value ? formatDate(value) : ""}
            onBlur={() => setIsFocused(false)}
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
    paddingTop: 12,
    justifyContent: "center",
  },
  text: {
    color: "white",
    marginLeft: 15,
    fontSize: 14,
  },
  error: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 6,
  },
});

export default DatePicker;
