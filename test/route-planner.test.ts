import assert from "node:assert";
import { SHOP } from "../config/shop";
import { OrderDetail } from "../model/order";
import { RoutePlan } from "../model/route";
import { calculatePlans } from "../utils/route-planner";

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
});

console.log("\nผ่าน " + passed + " ข้อ, ไม่ผ่าน " + failed + " ข้อ");
if (failed > 0) {
  process.exit(1);
}
