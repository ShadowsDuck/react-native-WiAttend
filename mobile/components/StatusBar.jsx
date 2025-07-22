import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const StatusBarBackground = ({
  backgroundColor = "#121212",
  barStyle = "light",
}) => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={{ height: insets.top, backgroundColor }} />
      <StatusBar style={barStyle} />
    </>
  );
};
