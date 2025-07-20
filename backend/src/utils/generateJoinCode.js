import crypto from "crypto";
import { db } from "../config/db.js";

// ฟังก์ชันสุ่มรหัส 8 ตัวแบบปลอดภัย
function generateJoinCode(length = 8) {
  const characters = "abcdefghjkmnpqrstuvwxyz1234567890";
  const bytes = crypto.randomBytes(length);
  let code = "";

  for (let i = 0; i < length; i++) {
    code += characters[bytes[i] % characters.length];
  }

  return code;
}

// ตรวจสอบไม่ให้ซ้ำใน DB
export async function generateUniqueJoinCode() {
  let code = "";
  let exists = true;

  while (exists) {
    code = generateJoinCode(8);
    const result = await db.query.classes.findFirst({
      where: (cls, { eq }) => eq(cls.join_code, code),
    });
    exists = !!result;
  }

  return code;
}
