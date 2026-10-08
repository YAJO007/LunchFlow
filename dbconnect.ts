import fs from "fs";
import { createPool } from "mysql2/promise";

// โหลดค่าการเชื่อมต่อจากไฟล์ .env (ไฟล์นี้มีแค่ในเครื่องเรา ไม่อัปขึ้น GitHub เพราะมีรหัสผ่าน)
// ตอน Deploy บน Render จะไม่มีไฟล์ .env แต่ใช้ค่าจาก Environment Variables ที่ตั้งไว้ในเว็บ Render แทน
if (fs.existsSync(".env")) {
  process.loadEnvFile(".env");
}

// เชื่อมต่อฐานข้อมูล MySQL บน aiven.io
export const conn = createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // aiven บังคับให้เชื่อมต่อแบบ SSL
  ssl: { rejectUnauthorized: false },
});
