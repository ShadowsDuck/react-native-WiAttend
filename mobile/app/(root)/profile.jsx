import { View, Text, Image, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useSignOut } from "../../hooks/useSignOut.js";
import Loading from "../../components/Loading.jsx";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../../components/Header.jsx";

const Profile = () => {
  const { user } = useUser();
  const router = useRouter();

  const { users, loading, fetchUserProfile } = useUserProfile();
  const handleSignOut = useSignOut();

  // โหลดข้อมูลผู้ใช้ทุกครั้งที่หน้าจอถูกโฟกัส
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchUserProfile(user.id);
      }
    }, [user?.id, fetchUserProfile])
  );

  if (loading) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      <Header
        title="โปรไฟล์"
        backgroundColor="#252525"
        statusBarStyle="light"
        textButton="ออกจากระบบ"
        textColor="#fff"
        backgroundColorButton="#ff00007a"
        onPress={handleSignOut}
      />

      {/* CONTENT */}
      <View className="flex-1 items-center mt-10">
        <View className="relative">
          {/* Profile Image */}
          <Image
            source={{
              uri: user?.imageUrl
                ? user.imageUrl
                : "https://static.vecteezy.com/system/resources/thumbnails/022/059/000/small_2x/no-image-available-icon-vector.jpg",
            }}
            className="w-28 h-28 rounded-3xl"
            resizeMode="cover"
          />

          {/* Pencil Button */}
          <TouchableOpacity
            className="absolute -bottom-2 -right-2 p-[6px] rounded-full bg-white"
            onPress={() => router.push("/editProfile")}
          >
            <Ionicons name="pencil-outline" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* NAME & MAJOR */}
        <View className="items-center mt-4">
          <Text className="text-white font-semibold text-2xl">
            {users?.first_name || users?.last_name
              ? `${users?.first_name ?? ""} ${users?.last_name ?? ""}`.trim()
              : "NULL"}
          </Text>
          <Text className="text-white opacity-85 font-normal text-base mt-1">
            {users?.major || "NULL"}
          </Text>
        </View>

        <View className="w-full px-5 mt-8 gap-4">
          {[
            {
              icon: "person-circle-outline",
              label: "รหัสนิสิต/อาจารย์",
              value: users?.student_id || "NULL",
            },
            {
              icon: "person-outline",
              label: "ชื่อ-นามสกุล",
              value:
                users?.first_name || users?.last_name
                  ? `${users?.first_name ?? ""} ${
                      users?.last_name ?? ""
                    }`.trim()
                  : "NULL",
            },
            {
              icon: "school-outline",
              label: "สาขา",
              value:
                users?.major === "ไม่ระบุ" ? "ไม่ระบุ" : users?.major || "NULL",
            },
            {
              icon: "podium-outline",
              label: "ชั้นปี",
              value: users?.year === 999 ? "ไม่ระบุ" : users?.year || "NULL",
            },
            {
              icon: "mail-outline",
              label: "อีเมล",
              value: user?.primaryEmailAddress?.emailAddress || null,
            },
          ]
            .filter((item) => item.value !== null)
            .map((item, index) => (
              <View
                key={index}
                className="bg-[#252525] rounded-xl px-5 py-4 flex-row items-center gap-4"
              >
                <Ionicons name={item.icon} size={30} color="#fff" />
                <View>
                  <Text className="text-white/70 text-sm">{item.label}</Text>
                  <Text className="text-white text-lg font-semibold">
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </View>
    </View>
  );
};

export default Profile;
