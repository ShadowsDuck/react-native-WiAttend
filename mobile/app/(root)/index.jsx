import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicatorBase,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import FloatingButton from "../../components/FloatingButton";

export default function App() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-5 mt-5 px-8">
        <View className="flex-row items-end">
          <Text className="text-3xl font-semibold text-white">WiAttend</Text>
          <Text className="text-[24px] font-medium text-gray-300 ml-2">
            Classroom
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")}>
          <View className="flex-row items-center">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-500" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <FloatingButton />
    </View>
  );
}
