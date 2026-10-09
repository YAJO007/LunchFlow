import express from "express";
import { conn } from "../dbconnect";
import { Customer } from "../model/customer";
import { OrderDetail, OrderPostRequest } from "../model/order";
import { getDistanceKm } from "../utils/distance";

export const router = express.Router();

const NEARBY_KM = 2;

const MIN_BOX = 1;
const MAX_BOX = 3;

const MIN_SIMULATE = 20;
const MAX_SIMULATE = 30;

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
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!req.query.lat || !req.query.lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Please send lat and lng" });
    }

    const [rows] = await conn.query(SELECT_ORDER_DETAIL + " ORDER BY orders.id");
    const orders = rows as OrderDetail[];

    const result = orders
      .map((order) => {
        const distance = getDistanceKm(lat, lng, order.latitude, order.longitude);
        return { ...order, distance_km: +distance.toFixed(3) };
      })
      .filter((order) => order.distance_km <= NEARBY_KM);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await conn.query(SELECT_ORDER_DETAIL + " WHERE orders.id = ?", [
      req.params.id,
    ]);
    const orders = rows as OrderDetail[];

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json(orders[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/simulate", async (req, res) => {
  try {
    let amount = randomInt(MIN_SIMULATE, MAX_SIMULATE);
    if (req.body && req.body.amount != null) {
      amount = Number(req.body.amount);
    }

    if (!Number.isInteger(amount) || amount < MIN_SIMULATE || amount > MAX_SIMULATE) {
      return res.status(400).json({ error: "amount must be 20 - 30" });
    }

    const [rows] = await conn.query("SELECT * FROM customer");
    const customers = rows as Customer[];

    if (customers.length === 0) {
      return res.status(400).json({ error: "Please add customers first" });
    }

    let totalBox = 0;
    for (let i = 0; i < amount; i++) {
      const customer = customers[randomInt(0, customers.length - 1)];
      const quantity = randomInt(MIN_BOX, MAX_BOX);
      totalBox += quantity;

      await conn.query("INSERT INTO orders (customer_id, quantity) VALUES (?, ?)", [
        customer.id,
        quantity,
      ]);
    }

    res.status(201).json({ created_order: amount, total_box: totalBox });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const order: OrderPostRequest = {
      customer_id: Number(body.customer_id),
      quantity: Number(body.quantity),
    };

    if (!order.customer_id || !isValidQuantity(order.quantity)) {
      return res.status(400).json({ error: "Please send customer_id and quantity (1-3)" });
    }

    const [rows] = await conn.query("SELECT * FROM customer WHERE id = ?", [
      order.customer_id,
    ]);
    const customers = rows as Customer[];
    if (customers.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
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
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const quantity = Number(body.quantity);

    if (!isValidQuantity(quantity)) {
      return res.status(400).json({ error: "quantity must be 1-3" });
    }

    const [result] = await conn.query("UPDATE orders SET quantity = ? WHERE id = ?", [
      quantity,
      req.params.id,
    ]);
    const updateResult = result as any;

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json({ affected_row: updateResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const [result] = await conn.query("DELETE FROM orders");
    const deleteResult = result as any;
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await conn.query("DELETE FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json({ affected_row: deleteResult.affectedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
