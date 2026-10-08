import express from "express";
import cors from "cors";
import { router as index } from "./controller/index";
import { router as customer } from "./controller/customer";
import { router as order } from "./controller/order";

export const app = express();

// อนุญาตให้เว็บจากโดเมนอื่น (เช่น Angular ที่ localhost:4200) เรียก API ได้
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// แปลง Body ที่ส่งมาเป็น JSON ให้อ่านได้ผ่าน req.body
app.use(express.json());

app.use("/", index);
app.use("/customer", customer);
app.use("/order", order);
