import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BackButton = ({ size = 26, router }) => {
  return (
    <TouchableOpacity onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={size} color="white" />
    </TouchableOpacity>
  );
};

export default BackButton;
