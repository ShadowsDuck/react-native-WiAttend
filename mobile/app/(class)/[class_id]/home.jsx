import { View, Text, ScrollView } from "react-native";
import Header from "../../../components/Header";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useClassroom } from "../../../hooks/useClassroom";
import Loading from "../../../components/Loading";
import { useCallback } from "react";

const HomePage = () => {
  const { class_id } = useLocalSearchParams();
  const { classInfo, loading, fetchClassesById } = useClassroom();

  useFocusEffect(
    useCallback(() => {
      if (class_id) {
        fetchClassesById(class_id);
      }
    }, [class_id]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (loading) return <Loading />;

  return (
    <View className="flex-1 bg-[#121212]">
      <Header backgroundColor="#292a2c" />
      <ScrollView className="px-4 py-6">
        {classInfo ? (
          <Text className="text-white text-base">
            {JSON.stringify(classInfo, null, 2)}
          </Text>
        ) : (
          <Text className="text-red-500">ไม่พบข้อมูลคลาส</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default HomePage;
