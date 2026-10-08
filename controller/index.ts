import express from "express";

export const router = express.Router();

// หน้าแรก ใช้เช็กว่าเซิร์ฟเวอร์ทำงานอยู่
router.get("/", (req, res) => {
  res.send("Lunchbox Web API is running");
});
