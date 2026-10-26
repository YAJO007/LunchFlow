import express from "express";
import { conn } from "../dbconnect";
import { Rider, RiderPostRequest, RiderPutRequest } from "../model/rider";

export const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM rider ORDER BY no");
    const riders = (rows as Rider[]).map((rider) => ({
      ...rider,
      available: Boolean(rider.available),
    }));
    res.status(200).json(riders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.post("/", async (req, res) => {
  try {
    const rider: RiderPostRequest = req.body || {};

    if (typeof rider.name !== "string" || !rider.name.trim()) {
      return res.status(400).json({ error: "กรุณากรอกชื่อไรเดอร์" });
    }

    const phone = typeof rider.phone === "string" ? rider.phone.trim() : "";
    const [result] = await conn.query(
      "INSERT INTO rider (name, phone, available) VALUES (?, ?, ?)",
      [rider.name.trim(), phone, true]
    );
    const insertResult = result as any;

    res.status(201).json({
      affected_row: insertResult.affectedRows,
      last_id: insertResult.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});
router.put("/:no", async (req, res) => {
  try {
    const no = Number(req.params.no);
    if (!Number.isInteger(no) || no <= 0) {
      return res.status(400).json({ error: "หมายเลขไรเดอร์ไม่ถูกต้อง" });
    }

    const update: RiderPutRequest = req.body || {};
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "กรุณาส่งข้อมูลที่ต้องการแก้ไข" });
    }
    if (update.name !== undefined && (typeof update.name !== "string" || !update.name.trim())) {
      return res.status(400).json({ error: "ชื่อไรเดอร์ห้ามว่าง" });
    }
    if (update.phone !== undefined && typeof update.phone !== "string") {
      return res.status(400).json({ error: "เบอร์โทรไม่ถูกต้อง" });
    }
    if (update.available !== undefined && typeof update.available !== "boolean") {
      return res.status(400).json({ error: "สถานะไรเดอร์ไม่ถูกต้อง" });
    }

    const [rows] = await conn.query("SELECT * FROM rider WHERE no = ?", [no]);
    const riders = rows as Rider[];
    if (riders.length === 0) {
      return res.status(404).json({ error: "ไม่พบไรเดอร์" });
    }

    const current = riders[0];
    const name = update.name === undefined ? current.name : update.name.trim();
    const phone = update.phone === undefined ? current.phone : update.phone.trim();
    const available = update.available === undefined ? Boolean(current.available) : update.available;
    const [result] = await conn.query(
      "UPDATE rider SET name = ?, phone = ?, available = ? WHERE no = ?",
      [name, phone, available, no]
    );
    const updateResult = result as any;

    res.status(200).json({ affected_row: updateResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});
router.delete("/:no", async (req, res) => {
  try {
    const no = Number(req.params.no);
    if (!Number.isInteger(no) || no <= 0) {
      return res.status(400).json({ error: "หมายเลขไรเดอร์ไม่ถูกต้อง" });
    }

    const [result] = await conn.query("DELETE FROM rider WHERE no = ?", [no]);
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบไรเดอร์" });
    }

    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});