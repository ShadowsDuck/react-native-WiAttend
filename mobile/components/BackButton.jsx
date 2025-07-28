import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BackButton = ({ size = 26, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Ionicons name="chevron-back" size={size} color="white" />
    </TouchableOpacity>
  );
};

export default BackButton;
