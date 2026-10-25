import express from "express";
import { conn } from "../dbconnect";
import { Customer, CustomerPostRequest } from "../model/customer";
import { getDistanceKm } from "../utils/distance";
import { SHOP } from "../config/shop";

export const router = express.Router();

const NEARBY_KM = 1;
const CUSTOMER_RADIUS_KM = 3;

function validateCustomer(customer: CustomerPostRequest): string | null {
  if (
    typeof customer.firstname !== "string" ||
    !customer.firstname.trim() ||
    typeof customer.lastname !== "string" ||
    !customer.lastname.trim() ||
    typeof customer.phone !== "string" ||
    !customer.phone.trim() ||
    typeof customer.address !== "string" ||
    !customer.address.trim() ||
    customer.latitude == null ||
    customer.longitude == null
  ) {
    return "กรุณากรอกข้อมูลลูกค้าให้ครบ";
  }

  if (!/^\d{10}$/.test(customer.phone.trim())) {
    return "เบอร์โทรต้องเป็นตัวเลข 10 หลัก";
  }

  if (
    !Number.isFinite(customer.latitude) ||
    !Number.isFinite(customer.longitude) ||
    customer.latitude < -90 ||
    customer.latitude > 90 ||
    customer.longitude < -180 ||
    customer.longitude > 180
  ) {
    return "พิกัดละติจูดหรือลองจิจูดไม่ถูกต้อง";
  }

  const distance = getDistanceKm(
    SHOP.latitude,
    SHOP.longitude,
    customer.latitude,
    customer.longitude,
  );

  if (distance > CUSTOMER_RADIUS_KM) {
    return "พิกัดบ้านลูกค้าต้องอยู่ในรัศมี 3 กม. จากร้าน";
  }

  return null;
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM customer");
    const customers = rows as Customer[];
    res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

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
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!req.query.lat || !req.query.lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "กรุณาส่งพิกัด lat และ lng" });
    }

    const [rows] = await conn.query("SELECT * FROM customer");
    const customers = rows as Customer[];

    const result = customers
      .map((customer) => {
        const distance = getDistanceKm(lat, lng, customer.latitude, customer.longitude);
        return { ...customer, distance_km: +distance.toFixed(3) };
      })
      .filter((customer) => customer.distance_km <= NEARBY_KM);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT * FROM customer WHERE id = ?", [
      req.params.id,
    ]);
    const customers = rows as Customer[];

    if (customers.length === 0) {
      return res.status(404).json({ error: "ไม่พบลูกค้า" });
    }
    res.status(200).json(customers[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.post("/", async (req, res) => {
  try {
    const customer: CustomerPostRequest = req.body || {};

    const validationError = validateCustomer(customer);
    if (validationError) {
      return res.status(400).json({ error: validationError });
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
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = +req.params.id;
    const customer: Partial<CustomerPostRequest> = req.body || {};

    const [rows] = await conn.query("SELECT * FROM customer WHERE id = ?", [id]);
    const result = rows as Customer[];

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบลูกค้า" });
    }

    const updateCustomer = { ...result[0], ...customer };
    const validationError = validateCustomer(updateCustomer);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

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
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await conn.query("DELETE FROM customer WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบลูกค้า" });
    }
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});
