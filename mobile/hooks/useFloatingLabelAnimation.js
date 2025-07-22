import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const useFloatingLabelAnimation = (isFocused, value) => {
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  return labelAnim;
};
