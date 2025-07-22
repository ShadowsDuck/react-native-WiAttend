import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState, useEffect } from "react";
import { formatDate } from "../utils/formatDate";
import FloatingLabel from "../components/FloatingLabel";

const DatePicker = ({ label, value, onChange, error }) => {
  const [showDate, setShowDate] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!showDate) setIsFocused(false);
  }, [showDate]);

  const getBorderColor = () => {
    if (error) return "#f87171";
    if (isFocused) return "#a8c6fc";
    return "rgba(255,255,255,0.2)";
  };

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
      <View style={[styles.container, { borderColor: getBorderColor() }]}>
        <FloatingLabel
          label={label}
          value={value}
          isFocused={isFocused}
          error={error}
          activeColor="#a8c6fc"
        />
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
