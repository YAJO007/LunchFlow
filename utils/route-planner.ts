import { SHOP, RIDER_COLORS } from "../config/shop";
import { OrderDetail } from "../model/order";
import { RiderJob, RoutePlan, RouteStop } from "../model/route";
import { getDistanceKm } from "./distance";

// ปัดทศนิยม 2 ตำแหน่ง
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ระยะร้าน → บ้าน (กม.)
function distanceFromShop(order: OrderDetail): number {
  return getDistanceKm(SHOP.latitude, SHOP.longitude, order.latitude, order.longitude);
}

// ระยะบ้าน → บ้าน (กม.)
function distanceBetween(a: OrderDetail, b: OrderDetail): number {
  return getDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
}

// "11:30" → 690 นาที
function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

// 690 นาที → "11:30"
function minutesToTime(totalMinutes: number): string {
  const rounded = Math.ceil(totalMinutes);
  const hour = Math.floor(rounded / 60);
  const minute = rounded % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

// วิธีที่ 1 กวาดรอบร้าน: เรียงตามทิศ แล้วตัดกลุ่มละ 3
// startIndex = จุดเริ่มตัด (เปลี่ยนแล้วได้แผนใหม่)
function groupBySweep(orders: OrderDetail[], startIndex: number): OrderDetail[][] {

  const angleOf = (order: OrderDetail) =>
    Math.atan2(order.longitude - SHOP.longitude, order.latitude - SHOP.latitude);

  const sorted = [...orders].sort((a, b) => angleOf(a) - angleOf(b));

  const rotated = [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];

  const groups: OrderDetail[][] = [];
  for (let i = 0; i < rotated.length; i += SHOP.maxOrdersPerRider) {
    groups.push(rotated.slice(i, i + SHOP.maxOrdersPerRider));
  }
  return groups;
}

// วิธีที่ 3 กวาดรอบร้าน แบ่งให้ riderCount คนเท่าๆ กัน
// เช่น 25 ออเดอร์ 12 คน → 3, 2, 2, ...
function groupBySweepEven(orders: OrderDetail[], riderCount: number, startIndex: number): OrderDetail[][] {
  const angleOf = (order: OrderDetail) =>
    Math.atan2(order.longitude - SHOP.longitude, order.latitude - SHOP.latitude);

  const sorted = [...orders].sort((a, b) => angleOf(a) - angleOf(b));
  const rotated = [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];

  const groups: OrderDetail[][] = [];
  let index = 0;
  for (let i = 0; i < riderCount; i++) {
    // แบ่งเท่ากัน เศษให้คนแรกๆ
    let size = Math.floor(orders.length / riderCount);
    if (i < orders.length % riderCount) {
      size++;
    }
    groups.push(rotated.slice(index, index + size));
    index += size;
  }
  return groups;
}

// ไรเดอร์น้อยสุด = ออเดอร์ ÷ 3 ปัดขึ้น, มากสุด = จำนวนออเดอร์
export function minRiders(orderCount: number): number {
  return Math.ceil(orderCount / SHOP.maxOrdersPerRider);
}

export function maxRiders(orderCount: number): number {
  return orderCount;
}

// วิธีที่ 2 จับกลุ่มเพื่อนบ้าน: เริ่มจากบ้านไกลสุด/ใกล้สุด
// แล้วหยิบบ้านที่ใกล้ที่สุดจนครบ 3
function groupByNearest(orders: OrderDetail[], startFromFarthest: boolean): OrderDetail[][] {
  const remaining = [...orders];
  const groups: OrderDetail[][] = [];

  while (remaining.length > 0) {

    let seedIndex = 0;
    for (let i = 1; i < remaining.length; i++) {
      const isFarther = distanceFromShop(remaining[i]) > distanceFromShop(remaining[seedIndex]);
      if (isFarther === startFromFarthest) {
        seedIndex = i;
      }
    }
    const seed = remaining[seedIndex];
    remaining.splice(seedIndex, 1);
    const group = [seed];

    while (group.length < SHOP.maxOrdersPerRider && remaining.length > 0) {
      let nearestIndex = 0;
      for (let i = 1; i < remaining.length; i++) {
        if (distanceBetween(seed, remaining[i]) < distanceBetween(seed, remaining[nearestIndex])) {
          nearestIndex = i;
        }
      }
      group.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }
    groups.push(group);
  }
  return groups;
}

// ทุกลำดับที่เป็นไปได้ (3 จุด = 6 แบบ)
function allOrderings(items: OrderDetail[]): OrderDetail[][] {
  if (items.length <= 1) {
    return [items];
  }
  const result: OrderDetail[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = items.filter((_, index) => index !== i);
    for (const ordering of allOrderings(rest)) {
      result.push([items[i], ...ordering]);
    }
  }
  return result;
}

// ระยะรวม ร้าน → จุด 1 → จุด 2 → ...
function routeDistance(stops: OrderDetail[]): number {
  let total = distanceFromShop(stops[0]);
  for (let i = 1; i < stops.length; i++) {
    total += distanceBetween(stops[i - 1], stops[i]);
  }
  return total;
}

// ลำดับที่สั้นที่สุด
function bestOrdering(group: OrderDetail[]): OrderDetail[] {
  let best = group;
  for (const ordering of allOrderings(group)) {
    if (routeDistance(ordering) < routeDistance(best)) {
      best = ordering;
    }
  }
  return best;
}

// ระยะของกลุ่มเมื่อวิ่งลำดับที่ดีที่สุด
function groupDistance(group: OrderDetail[]): number {
  return routeDistance(bestOrdering(group));
}

// สลับ/ย้ายออเดอร์ระหว่าง 2 กลุ่ม
// สั้นลง = เก็บไว้ แล้วตอบ true
function tryImprovePair(a: OrderDetail[], b: OrderDetail[]): boolean {
  const before = groupDistance(a) + groupDistance(b);

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const newA = [...a];
      const newB = [...b];
      newA[i] = b[j];
      newB[j] = a[i];
      if (groupDistance(newA) + groupDistance(newB) < before - 0.001) {
        a.splice(0, a.length, ...newA);
        b.splice(0, b.length, ...newB);
        return true;
      }
    }
  }

  if (a.length > 1 && b.length < SHOP.maxOrdersPerRider) {
    for (let i = 0; i < a.length; i++) {
      const newA = a.filter((_, index) => index !== i);
      const newB = [...b, a[i]];
      if (groupDistance(newA) + groupDistance(newB) < before - 0.001) {
        a.splice(0, a.length, ...newA);
        b.splice(0, b.length, ...newB);
        return true;
      }
    }
  }
  return false;
}

// สลับทุกคู่จนไม่สั้นลง (ไม่เกิน 50 รอบ)
function improveBySwap(groups: OrderDetail[][]): OrderDetail[][] {
  const result = groups.map((group) => [...group]);
  let improved = true;
  let round = 0;

  while (improved && round < 50) {
    improved = false;
    round++;
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result.length; j++) {
        if (i !== j && tryImprovePair(result[i], result[j])) {
          improved = true;
        }
      }
    }
  }
  return result;
}

// ค่าไรเดอร์ = 15 + 2 × กล่อง × กม.
// เช่น 6 กล่อง 2 กม. = 39 บาท
export function riderCost(totalBox: number, distanceKm: number): number {
  return SHOP.riderBaseFee + SHOP.riderFeePerKmPerBox * totalBox * distanceKm;
}

// ลิงก์ Google Maps ผ่านทุกจุด
function makeMapUrl(stops: RouteStop[]): string {
  const origin = SHOP.latitude + "," + SHOP.longitude;
  const last = stops[stops.length - 1];
  const destination = last.latitude + "," + last.longitude;
  const waypoints = stops
    .slice(0, stops.length - 1)
    .map((stop) => stop.latitude + "," + stop.longitude)
    .join("|");

  let url =
    "https://www.google.com/maps/dir/?api=1&travelmode=driving" +
    "&origin=" + origin +
    "&destination=" + destination;
  if (waypoints !== "") {
    url += "&waypoints=" + waypoints;
  }
  return url;
}

// ใบงาน 1 คน: ลำดับ ระยะ เวลาถึง ค่าไรเดอร์
function buildJob(group: OrderDetail[], riderNo: number): RiderJob {
  const ordered = bestOrdering(group);
  const startMinutes = timeToMinutes(SHOP.departureTime);
  const deadlineMinutes = timeToMinutes(SHOP.deadlineTime);

  const stops: RouteStop[] = [];
  let distanceSoFar = 0;
  let totalBox = 0;
  let previous: OrderDetail | null = null;

  for (let i = 0; i < ordered.length; i++) {
    const order = ordered[i];
    const legKm = previous ? distanceBetween(previous, order) : distanceFromShop(order);
    distanceSoFar += legKm;
    totalBox += order.quantity;

    const driveMinutes = (distanceSoFar / SHOP.speedKmPerHour) * 60;
    const arrival = startMinutes + driveMinutes + i * SHOP.minutesPerStop;

    stops.push({
      stop_no: i + 1,
      order_id: order.id,
      customer_name: order.firstname + " " + order.lastname,
      phone: order.phone,
      address: order.address,
      latitude: order.latitude,
      longitude: order.longitude,
      quantity: order.quantity,
      distance_from_prev_km: round2(legKm),
      arrival_time: minutesToTime(arrival),
    });
    previous = order;
  }

  // ไม่นับเวลาแวะจุดสุดท้าย
  // ส่งทัน = ทุกจุดถึงก่อนเส้นตาย
  const lastStop = stops[stops.length - 1];
  const durationMinutes = timeToMinutes(lastStop.arrival_time) - startMinutes;
  const onTime = stops.every((stop) => timeToMinutes(stop.arrival_time) <= deadlineMinutes);

  const cost = riderCost(totalBox, distanceSoFar);

  return {
    rider_no: riderNo,
    color: RIDER_COLORS[(riderNo - 1) % RIDER_COLORS.length],
    total_box: totalBox,
    distance_km: round2(distanceSoFar),
    duration_min: durationMinutes,
    cost: round2(cost),
    finish_time: lastStop.arrival_time,
    on_time: onTime,
    map_url: makeMapUrl(stops),
    stops: stops,
  };
}

// คำเตือน: ขาดทุน / ส่งไม่ทัน
export function planWarnings(plan: RoutePlan): string[] {
  const warnings: string[] = [];

  if (plan.profit < 0) {
    warnings.push(
      "แผนนี้ขาดทุน " + Math.abs(plan.profit).toFixed(2) + " บาท (ยอดขาย " + plan.revenue +
        " บาท ต้นทุนอาหาร " + plan.food_cost + " บาท ค่าส่ง " + plan.delivery_cost + " บาท)"
    );
  }

  for (const job of plan.jobs) {
    for (const stop of job.stops) {
      if (stop.arrival_time > plan.deadline_time) {
        warnings.push(
          "ไรเดอร์คนที่ " + job.rider_no + " ส่งไม่ทัน: จุดที่ " + stop.stop_no + " " +
            stop.customer_name + " (ออเดอร์ #" + stop.order_id + ") ถึง " + stop.arrival_time +
            " เกินเวลา " + plan.deadline_time
        );
      }
    }
  }
  return warnings;
}

// รวมยอดขาย ต้นทุน ค่าไรเดอร์ กำไร
function buildPlan(groups: OrderDetail[][], strategy: string): RoutePlan {
  const jobs = groups.map((group, index) => buildJob(group, index + 1));

  let totalOrder = 0;
  let totalBox = 0;
  let totalDistance = 0;
  let deliveryCost = 0;
  let lastArrival = SHOP.departureTime;
  let allOnTime = true;

  for (const job of jobs) {
    totalOrder += job.stops.length;
    totalBox += job.total_box;
    totalDistance += job.distance_km;
    deliveryCost += job.cost;
    if (job.finish_time > lastArrival) {
      lastArrival = job.finish_time;
    }
    if (!job.on_time) {
      allOnTime = false;
    }
  }

  const revenue = totalBox * SHOP.pricePerBox;
  const foodCost = totalBox * SHOP.foodCostPerBox;

  const plan: RoutePlan = {
    strategy: strategy,
    rider_count: jobs.length,
    total_order: totalOrder,
    total_box: totalBox,
    total_distance_km: round2(totalDistance),
    delivery_cost: round2(deliveryCost),
    revenue: revenue,
    food_cost: foodCost,
    profit: round2(revenue - foodCost - deliveryCost),
    departure_time: SHOP.departureTime,
    deadline_time: SHOP.deadlineTime,
    last_arrival_time: lastArrival,
    all_on_time: allOnTime,
    warnings: [],
    jobs: jobs,
  };
  plan.warnings = planWarnings(plan);
  return plan;
}

// รหัสการแบ่งกลุ่ม ไว้ตัดแผนซ้ำ
function groupsKey(groups: OrderDetail[][]): string {
  return groups
    .map((group) => group.map((order) => order.id).sort((a, b) => a - b).join("-"))
    .sort()
    .join("|");
}

// ฟังก์ชันหลัก: ลองหลายวิธี เรียงแผนดีสุดก่อน
// (ส่งทันก่อน แล้วค่าไรเดอร์ถูกสุด)
// riderCount ไม่ส่ง = ระบบเลือกให้
export function calculatePlans(orders: OrderDetail[], riderCount?: number): RoutePlan[] {
  if (orders.length === 0) {
    return [];
  }

  let baseCandidates = [
    { name: "กวาดรอบร้าน (เริ่มตำแหน่งที่ 1)", groups: groupBySweep(orders, 0) },
    { name: "กวาดรอบร้าน (เริ่มตำแหน่งที่ 2)", groups: groupBySweep(orders, 1) },
    { name: "กวาดรอบร้าน (เริ่มตำแหน่งที่ 3)", groups: groupBySweep(orders, 2) },
    { name: "จับกลุ่มเพื่อนบ้าน (เริ่มจากบ้านไกลสุด)", groups: groupByNearest(orders, true) },
    { name: "จับกลุ่มเพื่อนบ้าน (เริ่มจากบ้านใกล้สุด)", groups: groupByNearest(orders, false) },
  ];

  // เลือกจำนวนไรเดอร์เอง = วิธีที่ 3 (ลอง 5 จุดเริ่ม)
  if (riderCount !== undefined) {
    baseCandidates = [];
    for (let start = 0; start < 5 && start < orders.length; start++) {
      baseCandidates.push({
        name: "แบ่งให้ไรเดอร์ " + riderCount + " คน (เริ่มตำแหน่งที่ " + (start + 1) + ")",
        groups: groupBySweepEven(orders, riderCount, start),
      });
    }
  }

  const candidates = [...baseCandidates];
  for (const candidate of baseCandidates) {
    candidates.push({
      name: candidate.name + " + สลับออเดอร์ลดระยะ",
      groups: improveBySwap(candidate.groups),
    });
  }

  const plans: RoutePlan[] = [];
  const usedKeys: string[] = [];
  for (const candidate of candidates) {
    const key = groupsKey(candidate.groups);
    if (usedKeys.indexOf(key) === -1) {
      usedKeys.push(key);
      plans.push(buildPlan(candidate.groups, candidate.name));
    }
  }

  plans.sort((a, b) => {
    if (a.all_on_time !== b.all_on_time) {
      return a.all_on_time ? -1 : 1;
    }
    return a.delivery_cost - b.delivery_cost;
  });
  return plans;
}
