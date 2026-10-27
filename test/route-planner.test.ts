import assert from "node:assert";
import { SHOP } from "../config/shop";
import { OrderDetail } from "../model/order";
import { RoutePlan } from "../model/route";
import { calculatePlans, riderCost } from "../utils/route-planner";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log("  ผ่าน  " + name);
  } catch (error) {
    failed++;
    console.log("  ไม่ผ่าน  " + name);
    console.log("    " + (error as Error).message);
  }
}

// สุ่มตัวเลขแบบกำหนด seed ได้ เพื่อให้รันเทสต์กี่ครั้งก็ได้ผลเหมือนเดิม
function makeRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

function makeOrders(count: number, seed: number): OrderDetail[] {
  const random = makeRandom(seed);
  const orders: OrderDetail[] = [];
  for (let i = 1; i <= count; i++) {
    // สุ่มพิกัดในรัศมี 3 กม. จากร้าน (1 องศาละติจูด ประมาณ 111 กม.)
    const radiusKm = 0.3 + random() * 2.7;
    const angle = random() * 2 * Math.PI;
    orders.push({
      id: i,
      customer_id: i,
      quantity: 1 + Math.floor(random() * 3),
      order_date: "2026-10-25",
      firstname: "ลูกค้า",
      lastname: String(i),
      phone: "0800000000",
      address: "บ้านเลขที่ " + i,
      latitude: SHOP.latitude + (radiusKm * Math.cos(angle)) / 111,
      longitude:
        SHOP.longitude +
        (radiusKm * Math.sin(angle)) / (111 * Math.cos((SHOP.latitude * Math.PI) / 180)),
    });
  }
  return orders;
}

function checkPlanStructure(plan: RoutePlan, orders: OrderDetail[]) {
  for (const job of plan.jobs) {
    assert.ok(
      job.stops.length >= 1 && job.stops.length <= SHOP.maxOrdersPerRider,
      plan.strategy + ": ไรเดอร์คนที่ " + job.rider_no + " ได้ " + job.stops.length + " ออเดอร์"
    );
  }

  const assigned = plan.jobs.flatMap((job) => job.stops.map((stop) => stop.order_id));
  assert.strictEqual(assigned.length, orders.length, plan.strategy + ": จำนวนออเดอร์ที่แบ่งไม่ครบ");
  assert.strictEqual(new Set(assigned).size, assigned.length, plan.strategy + ": มีออเดอร์ซ้ำ");
  for (const order of orders) {
    assert.ok(assigned.includes(order.id), plan.strategy + ": ออเดอร์ " + order.id + " ไม่ถูกแบ่ง");
  }
}

function checkOnTime(plan: RoutePlan) {
  for (const job of plan.jobs) {
    const lastStop = job.stops[job.stops.length - 1];
    assert.strictEqual(job.finish_time, lastStop.arrival_time, plan.strategy + ": เวลาส่งเสร็จไม่ตรงกับจุดสุดท้าย");
    assert.strictEqual(
      job.on_time,
      job.stops.every((stop) => stop.arrival_time <= SHOP.deadlineTime),
      plan.strategy + ": สถานะส่งทันไม่ตรงกับเวลาถึงของแต่ละจุด"
    );
    assert.strictEqual(
      job.on_time,
      job.finish_time <= SHOP.deadlineTime,
      plan.strategy + ": สถานะส่งทันของไรเดอร์คนที่ " + job.rider_no + " ไม่ตรงกับเวลาส่งเสร็จ"
    );
  }
  assert.strictEqual(
    plan.all_on_time,
    plan.jobs.every((job) => job.on_time),
    plan.strategy + ": all_on_time ไม่ตรงกับใบงาน"
  );
}

console.log("route-planner");

test("ไม่มีกลุ่มไหนเกิน 3 ออเดอร์ และทุกออเดอร์ถูกแบ่งครบไม่ซ้ำ", () => {
  for (const count of [1, 2, 3, 4, 7, 10, 20, 25, 30]) {
    const orders = makeOrders(count, count);
    for (const plan of calculatePlans(orders)) {
      checkPlanStructure(plan, orders);
    }
  }
});

test("สถานะส่งทันคำนวณถูกต้อง", () => {
  for (const count of [1, 5, 20, 30]) {
    for (const plan of calculatePlans(makeOrders(count, count + 100))) {
      checkOnTime(plan);
    }
  }
});

test("สถานะส่งไม่ทันเมื่อบ้านอยู่ไกลเกินเวลา", () => {
  const far = makeOrders(1, 1);
  // ห่างจากร้านประมาณ 40 กม. ความเร็ว 30 กม./ชม. ใช้เวลาเกิน 1 ชั่วโมง
  far[0].latitude = SHOP.latitude + 40 / 111;
  far[0].longitude = SHOP.longitude;
  const plan = calculatePlans(far)[0];
  assert.strictEqual(plan.jobs[0].on_time, false);
  assert.strictEqual(plan.all_on_time, false);
  checkOnTime(plan);
  assert.ok(
    plan.warnings.some((warning) => warning.includes("ไรเดอร์คนที่ 1") && warning.includes("#1")),
    "ไม่มีเหตุผลบอกว่าออเดอร์ไหนทำให้เลท"
  );
  assert.ok(plan.warnings.some((warning) => warning.includes("ขาดทุน")), "ไม่มีเหตุผลเรื่องขาดทุน");
});

test("แผนที่ส่งทันและมีกำไรไม่มีคำเตือน", () => {
  for (const plan of calculatePlans(makeOrders(20, 5))) {
    if (plan.all_on_time && plan.profit >= 0) {
      assert.strictEqual(plan.warnings.length, 0, plan.strategy + ": มีคำเตือนทั้งที่แผนปกติ");
    }
  }
});

test("สูตรค่าส่ง: 6 กล่อง วิ่ง 2 กม. ค่าระยะทาง 24 บาท รวม 39 บาท", () => {
  const distancePart = SHOP.riderFeePerKmPerBox * 6 * 2;
  assert.strictEqual(distancePart, 24);
  assert.strictEqual(riderCost(6, 2), 39);
  assert.strictEqual(riderCost(5, 2), 35);
});

test("ค่าส่งของแผนเท่ากับผลรวมค่าส่งของไรเดอร์ทุกคนตามสูตร", () => {
  for (const plan of calculatePlans(makeOrders(20, 7))) {
    let sum = 0;
    for (const job of plan.jobs) {
      const expected = riderCost(job.total_box, job.distance_km);
      // distance_km ถูกปัดเป็นทศนิยม 2 ตำแหน่ง จึงยอมให้ต่างกันได้ไม่เกินผลของการปัดเศษ
      const tolerance = SHOP.riderFeePerKmPerBox * job.total_box * 0.005 + 0.01;
      assert.ok(Math.abs(job.cost - expected) <= tolerance, "ไรเดอร์คนที่ " + job.rider_no + " ค่าส่งไม่ตรงสูตร");
      sum += job.cost;
    }
    assert.ok(Math.abs(plan.delivery_cost - sum) <= 0.01, plan.strategy + ": ค่าส่งรวมไม่ตรง");
    assert.ok(
      Math.abs(plan.profit - (plan.revenue - plan.food_cost - plan.delivery_cost)) <= 0.01,
      plan.strategy + ": กำไรไม่ตรง"
    );
  }
});

function planKey(plan: RoutePlan): string {
  return plan.jobs
    .map((job) => job.stops.map((stop) => stop.order_id).sort((a, b) => a - b).join("-"))
    .sort()
    .join("|");
}

test("คำนวณใหม่ได้แผนที่ต่างกันจริงอย่างน้อย 3 แบบ (ออเดอร์ 20-30 รายการ)", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const plans = calculatePlans(makeOrders(20 + (seed % 11), seed));
    const keys = new Set(plans.map(planKey));
    assert.strictEqual(keys.size, plans.length, "seed " + seed + ": มีแผนซ้ำกัน");
    assert.ok(plans.length >= 3, "seed " + seed + ": ได้แผนแค่ " + plans.length + " แบบ");
  }
});

test("สุ่มออเดอร์ 20-30 รายการ ได้แผนที่ส่งทันและไม่ขาดทุนอย่างน้อย 1 แผน", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const plans = calculatePlans(makeOrders(20 + (seed % 11), seed * 31));
    assert.ok(
      plans.some((plan) => plan.all_on_time && plan.profit >= 0),
      "seed " + seed + ": ไม่มีแผนที่ส่งทันและไม่ขาดทุน"
    );
  }
});

test("กรณีพิเศษ: ไม่มีออเดอร์ ได้รายการแผนว่าง", () => {
  assert.deepStrictEqual(calculatePlans([]), []);
});

test("กรณีพิเศษ: ออเดอร์เดียว ได้ไรเดอร์ 1 คน 1 จุดส่ง", () => {
  const plans = calculatePlans(makeOrders(1, 3));
  assert.strictEqual(plans.length, 1);
  assert.strictEqual(plans[0].rider_count, 1);
  assert.strictEqual(plans[0].jobs[0].stops.length, 1);
  assert.strictEqual(plans[0].jobs[0].map_url.includes("waypoints"), false);
});

test("กรณีพิเศษ: ออเดอร์ 30 รายการเต็ม ใช้ไรเดอร์ 10 คน", () => {
  const orders = makeOrders(30, 30);
  const plans = calculatePlans(orders);
  assert.ok(plans.length >= 3);
  for (const plan of plans) {
    checkPlanStructure(plan, orders);
    assert.strictEqual(plan.rider_count, 10);
  }
});

test("เลือกจำนวนไรเดอร์เอง: 30 ออเดอร์ ไรเดอร์ 12 คน ทุกแผนใช้ 12 คนพอดี", () => {
  const orders = makeOrders(30, 31);
  const plans = calculatePlans(orders, 12);
  assert.ok(plans.length >= 1);
  for (const plan of plans) {
    checkPlanStructure(plan, orders);
    assert.strictEqual(plan.rider_count, 12);
  }
});

test("เลือกจำนวนไรเดอร์เอง: 1 คน 1 ออเดอร์ (ไรเดอร์เท่ากับจำนวนออเดอร์)", () => {
  const orders = makeOrders(20, 32);
  for (const plan of calculatePlans(orders, 20)) {
    checkPlanStructure(plan, orders);
    assert.strictEqual(plan.rider_count, 20);
    assert.ok(plan.jobs.every((job) => job.stops.length === 1));
  }
});

console.log("\nผ่าน " + passed + " ข้อ, ไม่ผ่าน " + failed + " ข้อ");
if (failed > 0) {
  process.exit(1);
}
