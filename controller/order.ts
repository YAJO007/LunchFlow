import express from "express";
import { conn } from "../dbconnect";
import { Customer } from "../model/customer";
import { OrderDetail, OrderPostRequest } from "../model/order";
import { getDistanceKm } from "../utils/distance";
import { SHOP } from "../config/shop";

export const router = express.Router();

const MIN_BOX = 1;
const MAX_BOX = 3;

const MIN_SIMULATE = 20;
const MAX_SIMULATE = 30;
const CUSTOMER_RADIUS_KM = 3;

export const SELECT_ORDER_DETAIL =
  "SELECT orders.id, orders.customer_id, orders.quantity, orders.order_date, " +
  "customer.firstname, customer.lastname, customer.phone, customer.address, " +
  "customer.latitude, customer.longitude " +
  "FROM orders JOIN customer ON orders.customer_id = customer.id";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= MIN_BOX && quantity <= MAX_BOX;
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await conn.query(SELECT_ORDER_DETAIL + " ORDER BY orders.id");
    const orders = rows as OrderDetail[];
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "เลขออเดอร์ไม่ถูกต้อง" });
    }
    const [rows] = await conn.query(SELECT_ORDER_DETAIL + " WHERE orders.id = ?", [
      id,
    ]);
    const orders = rows as OrderDetail[];

    if (orders.length === 0) {
      return res.status(404).json({ error: "ไม่พบออเดอร์" });
    }
    res.status(200).json(orders[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.post("/simulate", async (req, res) => {
  let connection: Awaited<ReturnType<typeof conn.getConnection>> | undefined;
  try {
    let amount = randomInt(MIN_SIMULATE, MAX_SIMULATE);
    if (req.body && req.body.amount != null) {
      amount = Number(req.body.amount);
    }

    if (!Number.isInteger(amount) || amount < MIN_SIMULATE || amount > MAX_SIMULATE) {
      return res.status(400).json({ error: "จำนวนต้องอยู่ระหว่าง 20 - 30" });
    }

    const [rows] = await conn.query("SELECT * FROM customer");
    const customers = rows as Customer[];

    if (customers.length === 0) {
      return res.status(400).json({ error: "ยังไม่มีลูกค้า กรุณาเพิ่มลูกค้าก่อน" });
    }

    const eligible = customers.filter((customer) =>
      getDistanceKm(SHOP.latitude, SHOP.longitude, customer.latitude, customer.longitude) <= CUSTOMER_RADIUS_KM
    );
    if (eligible.length < amount) {
      return res.status(400).json({
        error: `ต้องมีลูกค้าที่อยู่ในรัศมี ${CUSTOMER_RADIUS_KM} กม. อย่างน้อย ${amount} คน (มี ${eligible.length} คน)`,
      });
    }

    // Shuffle once and take distinct customers so one simulation never creates
    // multiple orders for the same customer.
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }

    let totalBox = 0;
    connection = await conn.getConnection();
    await connection.beginTransaction();
    for (const customer of eligible.slice(0, amount)) {
      const quantity = randomInt(MIN_BOX, MAX_BOX);
      totalBox += quantity;
      await connection.query("INSERT INTO orders (customer_id, quantity) VALUES (?, ?)", [customer.id, quantity]);
    }
    await connection.commit();

    res.status(201).json({ created_order: amount, total_box: totalBox });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  } finally {
    connection?.release();
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const order: OrderPostRequest = {
      customer_id: Number(body.customer_id),
      quantity: Number(body.quantity),
    };

    if (!Number.isInteger(order.customer_id) || order.customer_id <= 0 || !isValidQuantity(order.quantity)) {
      return res.status(400).json({ error: "กรุณาเลือกลูกค้าและจำนวนกล่อง (1-3)" });
    }

    const [rows] = await conn.query("SELECT * FROM customer WHERE id = ?", [
      order.customer_id,
    ]);
    const customers = rows as Customer[];
    if (customers.length === 0) {
      return res.status(404).json({ error: "ไม่พบลูกค้า" });
    }

    const [result] = await conn.query(
      "INSERT INTO orders (customer_id, quantity) VALUES (?, ?)",
      [order.customer_id, order.quantity]
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

router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const quantity = Number(body.quantity);

    if (!isValidQuantity(quantity)) {
      return res.status(400).json({ error: "จำนวนกล่องต้องเป็น 1-3" });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "เลขออเดอร์ไม่ถูกต้อง" });
    }

    const [existingRows] = await conn.query("SELECT id FROM orders WHERE id = ?", [id]);
    if ((existingRows as any[]).length === 0) {
      return res.status(404).json({ error: "ไม่พบออเดอร์" });
    }

    const [result] = await conn.query("UPDATE orders SET quantity = ? WHERE id = ?", [
      quantity,
      id,
    ]);
    const updateResult = result as any;

    res.status(200).json({ affected_row: updateResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const [result] = await conn.query("DELETE FROM orders");
    const deleteResult = result as any;
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "เลขออเดอร์ไม่ถูกต้อง" });
    }
    const [result] = await conn.query("DELETE FROM orders WHERE id = ?", [
      id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบออเดอร์" });
    }
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง" });
  }
});
