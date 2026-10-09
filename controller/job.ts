import express from "express";
import { conn } from "../dbconnect";
import { RiderJob } from "../model/route";
import { loadJobStops } from "./route";

export const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const [jobRows] = await conn.query(
      "SELECT delivery_job.*, delivery_plan.created_at, delivery_plan.departure_time, delivery_plan.deadline_time " +
        "FROM delivery_job JOIN delivery_plan ON delivery_job.plan_id = delivery_plan.id " +
        "WHERE delivery_job.id = ?",
      [req.params.id]
    );
    const jobs = jobRows as any[];

    if (jobs.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobs[0];
    job.stops = await loadJobStops(job.id);
    job.on_time = Boolean(job.on_time);

    res.status(200).json(job as RiderJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
