import { Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { cardDesigns } from "../constants/cardDesigns";
// import { formatJoinDate } from "../utils/formatJoinDate";
import { useUser } from "@clerk/clerk-expo";
import { iconMap } from "../constants/iconMap";

const renderDecorations = (pattern) => {
  const icon = iconMap[pattern];
  if (!icon) return null;

  return (
    <View
      style={{
        position: "absolute",
        pointerEvents: "none",
        ...icon.containerStyle,
      }}
    >
      <Image source={icon.uri} style={icon.style} resizeMode="contain" />
    </View>
  );
};

export default function ClassCard({ item }) {
  const { user } = useUser();
  const router = useRouter();
  const design = cardDesigns[item.class_id % cardDesigns.length];

  const ownerId = item.owner_user_id === user?.id;

  return (
    <LinearGradient
      colors={design.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="p-6 mx-5 mt-1 rounded-2xl shadow-lg relative overflow-hidden"
      style={{
        shadowColor: design.gradientColors[0],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(class)/${item.class_id}/home`)}
        activeOpacity={0.9}
        style={{ flex: 1 }}
      >
        {renderDecorations(design.pattern)}

        {/* Background glow circles */}
        <View className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white opacity-10" />
        <View className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-white opacity-5" />

        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1 mr-4">
            <Text
              className={`${design.textColor} text-2xl font-medium mb-1`}
              numberOfLines={2}
            >
              {item.subject_name}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-10">
          <View className="flex-1">
            {ownerId ? (
              <View className="bg-white px-3 py-1 rounded-full self-start">
                <Text className="text-black text-sm font-semibold">
                  ชั้นเรียนของคุณ
                </Text>
              </View>
            ) : (
              <Text
                className={`${design.subtextColor} text-white text-sm font-medium mt-1`}
              >
                By: {item.owner_name}
              </Text>
            )}
          </View>

          {/* ถ้าต้องการแสดงวันที่เข้าเรียน */}
          {/* {!ownerId && item.joined_at && (
            <Text
              className={`${design.subtextColor} text-sm font-medium mt-1`}
            >
              {formatJoinDate(item.joined_at)}
            </Text>
          )} */}
        </View>
        {/* <View className="absolute bottom-0 left-0 right-0 h-1 bg-white opacity-20" /> */}
      </TouchableOpacity>
    </LinearGradient>
  );
}
