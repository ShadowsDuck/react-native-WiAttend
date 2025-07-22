import { TextInput, View, Text } from "react-native";
import { useState } from "react";
import FloatingLabel from "../components/FloatingLabel";

const Input = ({
  label,
  onChangeText,
  value,
  inputRef,
  secureTextEntry,
  keyboardType,
  editable = true,
  error,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return "border-red-500";
    if (isFocused) return "border-[#a8c6fc]";
    return "border-white/20";
  };

  return (
    <View className="w-full mb-[10px]">
      <View
        className={`border rounded-xl px-4 pt-5 pb-2 ${getBorderColor()} bg-[#121212]`}
        style={{ minHeight: 64 }}
      >
        <FloatingLabel
          label={label}
          value={value}
          isFocused={isFocused}
          error={error}
          activeColor="#a8c6fc"
        />
        <View className="flex-row items-center gap-3">
          <TextInput
            className="flex-1 text-white text-base pt-1 ml-1"
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
