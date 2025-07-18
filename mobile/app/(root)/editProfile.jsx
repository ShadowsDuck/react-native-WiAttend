import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useUserProfile } from "../../hooks/useUserProfile";
import Loading from "../../components/Loading.jsx";
import BackButton from "../../components/BackButton.jsx";
import Input from "../../components/Input.jsx";
import Dropdown from "../../components/Dropdown.jsx";

const EditProfile = () => {
  const { user } = useUser();
  const router = useRouter();

  const { users, loading, fetchUserProfile, updateUserProfile } =
    useUserProfile();

  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    major: "",
    year: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  useEffect(() => {
    if (users) {
      setFormData({
        studentId: users.student_id || "",
        firstName: users.first_name || "",
        lastName: users.last_name || "",
        major: users.major || "",
        year: users.year || "",
      });
    }
  }, [users]);

  const handleSave = async () => {
    try {
      const { studentId, firstName, lastName, major, year } = formData;

      if (
        !studentId?.trim() ||
        !firstName?.trim() ||
        !lastName?.trim() ||
        !major?.trim() ||
        !year
      ) {
        Alert.alert("โปรไฟล์", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
      }

      await updateUserProfile({
        student_id: studentId.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        major: major.trim(),
        year: year,
      });

      Alert.alert("บันทึกสำเร็จ", "ข้อมูลของคุณได้รับการอัปเดตเรียบร้อยแล้ว");
      router.back();
    } catch (error) {
      console.error("Update error:", error);
      if (error.response?.status === 409) {
        Alert.alert("เกิดข้อผิดพลาด", "รหัสนิสิตนี้มีอยู่ในระบบแล้ว");
      } else {
        Alert.alert("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-center mt-5 gap-10 mx-8">
        <BackButton router={router} />
        <Text className="text-white font-semibold text-4xl">Edit Profile</Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="flex-1 px-5 mt-10">
        <View className="items-center mb-6 relative">
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
        </View>

        {/* form */}
        <View className="gap-5 mt-3">
          <Text className="text-base text-white">
            กรุณากรอกข้อมูลโปรไฟล์ของคุณ
          </Text>
          {[
            {
              key: "studentId",
              // icon: "person-circle-outline",
              label: "กรอกรหัสนิสิต",
            },
            {
              key: "firstName",
              // icon: "person-outline",
              label: "กรอกชื่อจริง",
            },
            {
              key: "lastName",
              // icon: "person-outline",
              label: "กรอกนามสกุล",
            },
          ].map((item, index) => (
            <Input
              key={index}
              label={item.label}
              // icon={<Ionicons name={item.icon} size={24} color="white" />}
              // placeholder={item.placeholder}
              value={formData[item.key]}
              onChangeText={(value) =>
                setFormData({ ...formData, [item.key]: value })
              }
            />
          ))}

          <Dropdown
            label="เลือกสาขา"
            value={formData.major}
            onChange={(val) => setFormData({ ...formData, major: val })}
            items={[
              { label: "Computer Science", value: "Computer Science" },
              {
                label: "Information Technology",
                value: "Information Technology",
              },
            ]}
          />

          <Dropdown
            label="เลือกชั้นปี"
            value={formData.year}
            onChange={(val) => setFormData({ ...formData, year: val })}
            items={[
              { label: "ปี 1", value: 1 },
              { label: "ปี 2", value: 2 },
              { label: "ปี 3", value: 3 },
              { label: "ปี 4", value: 4 },
            ]}
          />

          <TouchableOpacity
            className="bg-[#0F56B3] py-4 mt-5 rounded-xl"
            onPress={handleSave}
          >
            <Text className="text-white text-center font-semibold">
              บันทึกข้อมูล
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditProfile;
