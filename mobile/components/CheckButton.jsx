import { Text, TouchableOpacity } from "react-native";

const CheckButton = ({ disabled, buttonStyle, textStyle, text }) => {
  return (
    <TouchableOpacity disabled={disabled} className={buttonStyle}>
      <Text className={textStyle}>{text}</Text>
    </TouchableOpacity>
  );
};

export default CheckButton;
