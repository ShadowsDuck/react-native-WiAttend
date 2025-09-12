import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedProps,
} from "react-native-reanimated";

export const Card = ({ title, children }) => (
  <View className="bg-[#1E1E1E] rounded-2xl p-5 mb-6">
    {title && (
      <Text className="text-white font-bold text-xl mb-4">{title}</Text>
    )}
    {children}
  </View>
);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularProgress = ({
  percentage,
  color = "#34D399",
  size = 120,
  strokeWidth = 12,
  displayText = null,
}) => {
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  progress.value = withTiming(percentage, {
    duration: 1000,
    easing: Easing.out(Easing.cubic),
  });

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (progress.value / 100) * circumference,
  }));

  const textToShow =
    displayText !== null ? displayText : `${Math.round(percentage)}%`;

  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg height="100%" width="100%" viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2E2E2E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View className="absolute">
        <Text
          className={`text-white font-bold ${
            String(textToShow).length > 2 ? "text-2xl" : "text-3xl"
          }`}
        >
          {textToShow}
        </Text>
      </View>
    </View>
  );
};

export const PercentageBadge = ({ percentage, text }) => {
  const getBadgeStyle = () => {
    if (percentage >= 80) return "bg-[#1C3A2E] text-[#34D399]";
    if (percentage >= 50) return "bg-[#423D2E] text-[#FBBF24]";
    return "bg-[#45292F] text-[#F77171]";
  };

  return (
    <Text
      className={`px-3 py-1.5 rounded-lg font-bold text-sm ${getBadgeStyle()}`}
    >
      {text}
    </Text>
  );
};
