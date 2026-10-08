// สคริปต์สร้างตารางและข้อมูลตัวอย่างใน MySQL (รันครั้งเดียว)
// วิธีรัน:  npm run setup-db
import fs from "fs";
import { conn } from "../dbconnect";

async function setup() {
  try {
    // อ่านไฟล์ SQL แล้วแยกเป็นทีละคำสั่ง (คั่นด้วย ; ท้ายบรรทัด)
    const sqlText = fs.readFileSync("database/lunchbox.sql", "utf8").replace(/\r/g, "");
    const commands = sqlText
      .split(";\n")
      .map((command) =>
        command
          .split("\n")
          .filter((line) => !line.startsWith("--"))
          .join("\n")
          .trim()
      )
      .filter((command) => command.length > 0);

    for (const command of commands) {
      await conn.query(command);
    }

    const [rows] = await conn.query("SELECT COUNT(*) AS total FROM customer");
    console.log("สร้างตารางสำเร็จ มีลูกค้าทั้งหมด", (rows as any)[0].total, "คน");
  } catch (error) {
    console.error("สร้างตารางไม่สำเร็จ:", error);
  }
  await conn.end();
}

setup();
