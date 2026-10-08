import express from "express";
import { conn } from "../dbconnect";
import { Customer, CustomerPostRequest } from "../model/customer";
import { getDistanceKm } from "../utils/distance";

export const router = express.Router();

// ระยะค้นหาลูกค้ารอบพิกัด (กิโลเมตร)
const NEARBY_KM = 1;

// ---------------------------------------------------------
// GET /customer  แสดงลูกค้าทุกคน
// ---------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM customer");
    const customers = rows as Customer[];
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// GET /customer/search?firstname=สม&lastname=ใจ
// ค้นหาจากส่วนหนึ่งของชื่อ และ/หรือ นามสกุล (ส่งอย่างใดอย่างหนึ่งก็ได้)
// ---------------------------------------------------------
router.get("/search", async (req, res) => {
  try {
    const firstname = req.query.firstname || "";
    const lastname = req.query.lastname || "";

    const [rows] = await conn.query(
      "SELECT * FROM customer WHERE firstname LIKE ? AND lastname LIKE ?",
      ["%" + firstname + "%", "%" + lastname + "%"]
    );
    const customers = rows as Customer[];
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// GET /customer/nearby?lat=16.2459&lng=103.2525
// ค้นหาลูกค้าทั้งหมดที่อยู่ในระยะ 1 กิโลเมตรจากพิกัดที่กำหนด
// ---------------------------------------------------------
router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!req.query.lat || !req.query.lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Please send lat and lng" });
    }

    const [rows] = await conn.query("SELECT * FROM customer");
    const customers = rows as Customer[];

    // คำนวณระยะทางของลูกค้าแต่ละคน แล้วเก็บเฉพาะคนที่อยู่ในระยะ
    const result = customers
      .map((customer) => {
        const distance = getDistanceKm(lat, lng, customer.latitude, customer.longitude);
        return { ...customer, distance_km: +distance.toFixed(3) };
      })
      .filter((customer) => customer.distance_km <= NEARBY_KM);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// GET /customer/:id  แสดงลูกค้า 1 คนตาม id
// ---------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM customer WHERE id = ?", [
      req.params.id,
    ]);
    const customers = rows as Customer[];

    if (customers.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(200).json(customers[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// POST /customer  เพิ่มลูกค้าใหม่
// ---------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const customer: CustomerPostRequest = req.body || {};

    if (
      !customer.firstname ||
      !customer.lastname ||
      !customer.phone ||
      !customer.address ||
      customer.latitude == null ||
      customer.longitude == null
    ) {
      return res.status(400).json({ error: "Please send all customer fields" });
    }

    const sql =
      "INSERT INTO customer (firstname, lastname, phone, address, latitude, longitude) VALUES (?,?,?,?,?,?)";
    const [result] = await conn.query(sql, [
      customer.firstname,
      customer.lastname,
      customer.phone,
      customer.address,
      customer.latitude,
      customer.longitude,
    ]);
    const insertResult = result as any;

    res.status(201).json({
      affected_row: insertResult.affectedRows,
      last_id: insertResult.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// PUT /customer/:id  แก้ไขข้อมูลลูกค้า (ส่งมาเฉพาะช่องที่จะแก้ก็ได้)
// ---------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const id = +req.params.id;
    const customer: Customer = req.body || {};

    // 1. หาข้อมูลเดิมก่อน
    const [rows] = await conn.query("SELECT * FROM customer WHERE id = ?", [id]);
    const result = rows as Customer[];

    if (result.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // 2. รวมข้อมูลเดิมกับข้อมูลใหม่ (ช่องไหนไม่ส่งมา ใช้ค่าเดิม)
    const updateCustomer = { ...result[0], ...customer };

    // 3. บันทึกกลับลงฐานข้อมูล
    const sql =
      "UPDATE customer SET firstname=?, lastname=?, phone=?, address=?, latitude=?, longitude=? WHERE id=?";
    const [records] = await conn.query(sql, [
      updateCustomer.firstname,
      updateCustomer.lastname,
      updateCustomer.phone,
      updateCustomer.address,
      updateCustomer.latitude,
      updateCustomer.longitude,
      id,
    ]);
    const updateResult = records as any;

    res.status(200).json({ affected_row: updateResult.affectedRows });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------
// DELETE /customer/:id  ลบลูกค้า (ออเดอร์ของลูกค้าคนนี้จะถูกลบตามไปด้วย)
// ---------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await conn.query("DELETE FROM customer WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
