import express from "express";
import { conn } from "../dbconnect";
import { SHOP } from "../config/shop";
import { OrderDetail } from "../model/order";
import { RiderJob, RoutePlan, RouteStop } from "../model/route";
import { calculatePlans } from "../utils/route-planner";
import { SELECT_ORDER_DETAIL } from "./order";

export const router = express.Router();

function readOption(body: any): number | null {
  const option = Number(body.option || 0);
  if (!Number.isInteger(option) || option < 0) {
    return null;
  }
  return option;
}

async function getPlanOption(option: number) {
  const [rows] = await conn.query(SELECT_ORDER_DETAIL + " ORDER BY orders.id");
  const orders = rows as OrderDetail[];
  if (orders.length === 0) {
    return null;
  }

  const plans = calculatePlans(orders);

  const index = option % plans.length;
  return { option: index, total_options: plans.length, plan: plans[index] };
}

export async function loadJobStops(jobId: number): Promise<RouteStop[]> {
  const [rows] = await conn.query(
    "SELECT * FROM delivery_stop WHERE job_id = ? ORDER BY stop_no",
    [jobId]
  );
  return rows as RouteStop[];
}

async function loadSavedPlan(planId: number): Promise<RoutePlan | null> {
  const [planRows] = await conn.query("SELECT * FROM delivery_plan WHERE id = ?", [planId]);
  const plans = planRows as any[];
  if (plans.length === 0) {
    return null;
  }

  const [jobRows] = await conn.query(
    "SELECT * FROM delivery_job WHERE plan_id = ? ORDER BY rider_no",
    [planId]
  );
  const jobs = jobRows as RiderJob[];

  for (const job of jobs) {
    job.stops = await loadJobStops(job.id!);
    job.on_time = Boolean(job.on_time);
  }

  const plan = plans[0];
  plan.all_on_time = Boolean(plan.all_on_time);
  plan.jobs = jobs;
  return plan as RoutePlan;
}

async function savePlan(plan: RoutePlan): Promise<number> {

  const [planResult] = await conn.query(
    "INSERT INTO delivery_plan (strategy, rider_count, total_order, total_box, total_distance_km, " +
      "delivery_cost, revenue, food_cost, profit, departure_time, deadline_time, last_arrival_time, all_on_time) " +
      "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      plan.strategy,
      plan.rider_count,
      plan.total_order,
      plan.total_box,
      plan.total_distance_km,
      plan.delivery_cost,
      plan.revenue,
      plan.food_cost,
      plan.profit,
      plan.departure_time,
      plan.deadline_time,
      plan.last_arrival_time,
      plan.all_on_time,
    ]
  );
  const planId = (planResult as any).insertId;

  for (const job of plan.jobs) {
    const [jobResult] = await conn.query(
      "INSERT INTO delivery_job (plan_id, rider_no, color, total_box, distance_km, duration_min, " +
        "cost, finish_time, on_time, map_url) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        planId,
        job.rider_no,
        job.color,
        job.total_box,
        job.distance_km,
        job.duration_min,
        job.cost,
        job.finish_time,
        job.on_time,
        job.map_url,
      ]
    );
    const jobId = (jobResult as any).insertId;

    for (const stop of job.stops) {
      await conn.query(
        "INSERT INTO delivery_stop (job_id, stop_no, order_id, customer_name, phone, address, " +
          "latitude, longitude, quantity, distance_from_prev_km, arrival_time) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          jobId,
          stop.stop_no,
          stop.order_id,
          stop.customer_name,
          stop.phone,
          stop.address,
          stop.latitude,
          stop.longitude,
          stop.quantity,
          stop.distance_from_prev_km,
          stop.arrival_time,
        ]
      );
    }
  }
  return planId;
}

router.get("/shop", (req, res) => {
  res.status(200).json(SHOP);
});

router.post("/calculate", async (req, res) => {
  try {
    const option = readOption(req.body || {});
    if (option === null) {
      return res.status(400).json({ error: "option must be 0, 1, 2, ..." });
    }

    const result = await getPlanOption(option);
    if (!result) {
      return res.status(400).json({ error: "No orders. Please add or simulate orders first" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const option = readOption(req.body || {});
    if (option === null) {
      return res.status(400).json({ error: "option must be 0, 1, 2, ..." });
    }

    const result = await getPlanOption(option);
    if (!result) {
      return res.status(400).json({ error: "No orders. Please add or simulate orders first" });
    }

    const planId = await savePlan(result.plan);
    const saved = await loadSavedPlan(planId);
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const [rows] = await conn.query("SELECT id FROM delivery_plan ORDER BY id DESC LIMIT 1");
    const plans = rows as any[];
    if (plans.length === 0) {
      return res.status(404).json({ error: "No confirmed plan yet" });
    }
    const plan = await loadSavedPlan(plans[0].id);
    res.status(200).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
