import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";

const FloatingDropdown = ({ label, value, onChange, items, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const dropdownRef = useRef(null);

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [labelAnim, isFocused, value]);

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
    zIndex: 10,
  };

  const renderItem = (item) => (
    <View style={styles.item}>
      <Text style={styles.textItem}>{item.label}</Text>
      {item.value === value && (
        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
      )}
    </View>
  );

  return (
    <View style={{ width: "100%", marginBottom: error ? 20 : 10 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          dropdownRef.current?.open?.(); // สำหรับบาง version ที่ expose open()
        }}
        style={{ position: "relative", minHeight: 64 }}
      >
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <Dropdown
          ref={dropdownRef}
          style={[
            styles.dropdown,
            {
              borderColor: error
                ? "#f87171"
                : isFocused
                ? "#6D28D9"
                : "rgba(255,255,255,0.20)",
            },
          ]}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownContainer}
          activeColor="#1e1e1e"
          searchPlaceholderTextColor="#aaa"
          data={items}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder=""
          searchPlaceholder="ค้นหา..."
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(item) => {
            onChange(item.value);
            setIsFocused(false);
          }}
          renderItem={renderItem}
        />
      </TouchableOpacity>

      {error && (
        <Text style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default FloatingDropdown;

const styles = StyleSheet.create({
  dropdown: {
    height: 64,
    backgroundColor: "#121212",
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingLeft: 6,
    justifyContent: "center",
  },
  item: {
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textItem: {
    flex: 1,
    fontSize: 14,
    color: "white",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "white",
    marginLeft: 15,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 16,
    color: "white",
  },
  dropdownContainer: {
    backgroundColor: "#121212",
    borderRadius: 10,
    borderColor: "rgba(255,255,255,0.20)",
  },
});
