import { View, Image, StyleSheet, Pressable } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

const FloatingButton = (props) => {
  const firstValue = useSharedValue(30);
  const secondValue = useSharedValue(30);
  const isOpen = useSharedValue(false);
  const progress = useDerivedValue(() =>
    isOpen.value ? withTiming(1) : withTiming(0)
  );

  const handlePress = () => {
    const config = {
      easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
      duration: 500,
    };
    if (isOpen.value) {
      firstValue.value = withTiming(30, config);
      secondValue.value = withDelay(50, withTiming(30, config));
    } else {
      firstValue.value = withDelay(200, withSpring(150));
      secondValue.value = withDelay(100, withSpring(230));
    }
    isOpen.value = !isOpen.value;
  };

  const firstIcon = useAnimatedStyle(() => {
    const scale = interpolate(
      firstValue.value,
      [30, 150],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      bottom: firstValue.value,
      transform: [{ scale: scale }],
    };
  });

  const secondIcon = useAnimatedStyle(() => {
    const scale = interpolate(
      secondValue.value,
      [30, 230],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      bottom: secondValue.value,
      transform: [{ scale: scale }],
    };
  });

  const plusIcon = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${progress.value * 45}deg` }],
    };
  });

  return (
    <View className="flex-1">
      {/* Join Icon */}
      <Animated.View style={[styles.contentContainer, secondIcon]}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/images/icon-join.png")}
            style={styles.icon}
          />
        </View>
      </Animated.View>

      {/* Create Icon */}
      <Animated.View style={[styles.contentContainer, firstIcon]}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/images/icon-create.png")}
            style={styles.icon}
          />
        </View>
      </Animated.View>

      <Pressable style={styles.contentContainer} onPress={() => handlePress()}>
        <Animated.View style={[styles.iconContainer, plusIcon]}>
          <Image
            source={require("../assets/images/icon-plus.png")}
            style={styles.icon}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default FloatingButton;

const styles = StyleSheet.create({
  contentContainer: {
    backgroundColor: "#0F56B3",
    position: "absolute",
    bottom: 50,
    right: 30,
    borderRadius: 100,
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 32,
    height: 32,
  },
});
