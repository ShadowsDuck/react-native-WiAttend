import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BackButton = ({ size = 26, router }) => {
  return (
    <TouchableOpacity
      className="bg-[#3f3f3f] py-2 px-2 rounded-2xl absolute left-0"
      onPress={() => router.back()}
    >
      <Ionicons name="chevron-back" size={size} color="white" />
    </TouchableOpacity>
  );
};

export default BackButton;
