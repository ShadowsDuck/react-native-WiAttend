import { View, TextInput, Text } from "react-native";

const Input = ({
  label,
  icon,
  placeholder,
  onChangeText,
  value,
  inputRef,
  secureTextEntry,
  keyboardType,
  editable = true,
  error,
  ...rest
}) => {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-white/70 text-base mb-2 ml-1">{label}</Text>
      )}

      <View
        className={`flex-row items-center border ${
          error ? "border-red-500" : "border-white/20"
        } rounded-3xl px-4 py-3 gap-3 bg-[#1f1f1f]`}
      >
        {icon && icon}
        <TextInput
          className="flex-1 text-white text-base"
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          onChangeText={onChangeText}
          value={value}
          ref={inputRef}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          {...rest}
        />
      </View>

      {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};

export default Input;
