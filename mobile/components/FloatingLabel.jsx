import { Animated } from "react-native";
import { useEffect, useRef } from "react";

const FloatingLabel = ({
  label,
  value,
  isFocused,
  error,
  offset = 20,
  activeColor = "#a8c6fc",
}) => {
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const style = {
    position: "absolute",
    left: 18,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [offset, -10],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error ? "#f87171" : isFocused ? activeColor : "#aaa",
    backgroundColor: "#121212",
    paddingHorizontal: 4,
    zIndex: 10,
  };

  return <Animated.Text style={style}>{label}</Animated.Text>;
};

export default FloatingLabel;
