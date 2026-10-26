import express from "express";
import { conn } from "../dbconnect";
import { Rider, RiderPostRequest } from "../model/rider";

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