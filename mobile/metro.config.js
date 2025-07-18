const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

// สร้าง config เริ่มต้น
let config = getDefaultConfig(__dirname);

// เพิ่ม NativeWind config
config = withNativeWind(config, { input: "./global.css" });

// เพิ่ม Reanimated config
config = wrapWithReanimatedMetroConfig(config);

module.exports = config;
