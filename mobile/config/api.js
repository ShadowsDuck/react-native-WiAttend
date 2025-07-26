// src/config/api.js
const API_URL_FROM_ENV = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL_FROM_ENV) {
  throw new Error(
    "FATAL ERROR: Missing EXPO_PUBLIC_API_URL in .env file. Run `npx expo start -c` after setting it."
  );
}

const API_URL = API_URL_FROM_ENV.replace(/\/$/, ""); // ตัด '/' ท้ายออก กันพลาด
export default API_URL;
