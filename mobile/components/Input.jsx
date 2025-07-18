import { Animated, TextInput, View, Text } from "react-native";
import { useEffect, useRef, useState } from "react";

const Input = ({
  label,
  // placeholder,
  onChangeText,
  value,
  inputRef,
  secureTextEntry,
  keyboardType,
  editable = true,
  // icon,
  error,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [labelAnim, isFocused, value]);

  const labelStyle = {
    position: "absolute",
    // left: icon ? 40 : 18,
    left: 18,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -10],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error ? "#f87171" : isFocused ? "#6D28D9" : "#aaa",
    backgroundColor: "#121212",
    paddingHorizontal: 4,
  };

  const getBorderColor = () => {
    if (error) return "border-red-500";
    if (isFocused) return "border-[#6D28D9]";
    return "border-white/20";
  };

  return (
    <View className="w-full mb-[10px]">
      <View
        className={`border rounded-xl px-4 pt-5 pb-2 ${getBorderColor()} bg-[#121212]`}
        style={{ minHeight: 64 }}
      >
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <View className="flex-row items-center gap-3">
          {/* {icon && icon} */}
          <TextInput
            className="flex-1 text-white text-base pt-1 ml-1"
            // placeholder={isFocused ? "" : placeholder}
            // placeholderTextColor="#aaa"
            onChangeText={onChangeText}
            value={value}
            ref={inputRef}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            editable={editable}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
          />
        </View>
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};

export default Input;
