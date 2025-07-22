import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import FloatingLabel from "./FloatingLabel";

const TimePicker = ({ label, error }) => {
  const [showTime, setShowTime] = useState(false);
  const [formData, setFormData] = useState({
    time: "",
  });
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return "#f87171";
    if (isFocused) return "#a8c6fc";
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
        <FloatingLabel
          label={label}
          isFocused={isFocused}
          value={formData.time}
          error={error}
          activeColor="#a8c6fc"
        />

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
                    hour12: false,
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
