import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import BackButton from "../../components/BackButton";
import { useRouter } from "expo-router";
import Input from "../../components/Input";
import { useState } from "react";

const CreateClass = () => {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  return (
    <View className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-center mt-5 gap-10 mx-8">
        <BackButton router={router} />
        <Text className="text-white font-semibold text-4xl">Create Class</Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="flex-1 px-5 mt-10">
        {/* form */}
        <View className="gap-5 mt-3">
          {/* {[
            {
              key: "studentId",
              icon: "person-circle-outline",
              placeholder: "กรอกรหัสนิสิตของคุณ",
            },
            {
              key: "firstName",
              icon: "person-outline",
              placeholder: "กรอกชื่อจริงของคุณ",
            },
            {
              key: "lastName",
              icon: "person-outline",
              placeholder: "กรอกนามสกุลของคุณ",
            },
          ].map((item, index) => (
            <Input
              key={index}
              label={"test"}
              placeholder={item.placeholder}
              value={null}
              onChangeText={() => {}}
            />
          ))} */}

          <Input
            label="กรอกรหัสนิสิต"
            value={studentId}
            onChangeText={setStudentId}
          />

          <TouchableOpacity
            className="bg-[#0F56B3] py-4 mt-5 rounded-xl"
            onPress={() => {}}
          >
            <Text className="text-white text-center font-semibold">
              สร้างคลาสเรียน
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateClass;
