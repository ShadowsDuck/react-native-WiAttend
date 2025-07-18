import { StyleSheet, View, Text } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";

const DropdownComponent = ({
  label,
  icon,
  placeholder,
  value,
  onChange,
  items,
}) => {
  const renderItem = (item) => {
    return (
      <View style={styles.item}>
        <Text style={styles.textItem}>{item.label}</Text>
        {item.value === value && (
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
        )}
      </View>
    );
  };

  return (
    <View style={{ width: "100%" }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
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
        placeholder={placeholder}
        searchPlaceholder="ค้นหา..."
        value={value}
        onChange={(item) => {
          onChange(item.value);
        }}
        renderLeftIcon={() => icon}
        renderItem={renderItem}
      />
    </View>
  );
};

export default DropdownComponent;

const styles = StyleSheet.create({
  dropdown: {
    margin: 0,
    height: 64,
    backgroundColor: "#1f1f1f",
    borderRadius: 20,
    borderColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
  },
  icon: {
    marginRight: 5,
    color: "white",
  },
  item: {
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textItem: {
    flex: 1,
    fontSize: 16,
    color: "white",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#aaa",
    marginLeft: 15,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "white",
    marginLeft: 15,
  },
  iconStyle: {
    width: 25,
    height: 25,
    marginRight: 10,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 16,
    color: "white",
  },
  dropdownContainer: {
    backgroundColor: "#121212",
    borderRadius: 10,
    borderColor: "rgba(255,255,255,0.20)",
  },
});
