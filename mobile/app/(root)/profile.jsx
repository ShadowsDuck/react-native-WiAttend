import { View, Text, Image, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useSignOut } from "../../hooks/useSignOut.js";

const Profile = () => {
  const { user } = useUser();
  const router = useRouter();

  const { users, loading, error, fetchUserProfile } = useUserProfile();
  const handleSignOut = useSignOut();

  useEffect(() => {
    if (user.id) {
      fetchUserProfile(user.id);
    }
  }, [user.id, fetchUserProfile]);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      {/* <View className="flex-row justify-between items-center p-5 border border-b-1 border-b-gray-500">
        <View className="flex-row items-end">
          <TouchableOpacity
            className="mr-2 mb-1"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={"white"} />
          </TouchableOpacity>
          <Text className="text-2xl font-semibold text-white">Profile</Text>
          <Text className="text-xl font-semibold text-gray-300 ml-2">
            Setting
          </Text>
        </View>
      </View> */}

      {/* HEADER */}
      <View className="flex-row items-center justify-center mt-5 gap-10 mx-8">
        <TouchableOpacity
          className="bg-[#3f3f3f] py-2 px-2 rounded-2xl absolute left-0"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-semibold text-4xl">Profile</Text>

        <TouchableOpacity
          className="bg-[#ff00007a] py-2 px-2 rounded-2xl absolute right-0"
          onPress={handleSignOut}
        >
          <Ionicons name="power" size={24} color="red" />
        </TouchableOpacity>
      </View>

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
            onPress={() => {}}
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

        {/* OTHER */}
        <View className="w-full px-5 mt-8 gap-4">
          {[
            {
              icon: "person-circle-outline",
              label: "รหัสนิสิต",
              value: users?.student_id || "NULL",
            },
            {
              icon: "school-outline",
              label: "สาขา",
              value: users?.major || "NULL",
            },
            {
              icon: "podium-outline",
              label: "ชั้นปี",
              value: users?.year || "NULL",
            },
            {
              icon: "mail-outline",
              label: "อีเมล",
              value: user?.primaryEmailAddress?.emailAddress || "NULL",
            },
          ].map((item, index) => (
            <View
              key={index}
              className="bg-white/10 rounded-xl px-5 py-4 flex-row items-center gap-4"
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
