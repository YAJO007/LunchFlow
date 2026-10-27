import { SHOP, RIDER_COLORS } from "../config/shop";
import { OrderDetail } from "../model/order";
import { RiderJob, RoutePlan, RouteStop } from "../model/route";
import { getDistanceKm } from "./distance";

// ปัดเศษทศนิยม 2 ตำแหน่ง เช่น 1.23456 → 1.23
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ระยะทาง (กม.) จากร้านถึงบ้านลูกค้า
function distanceFromShop(order: OrderDetail): number {
  return getDistanceKm(SHOP.latitude, SHOP.longitude, order.latitude, order.longitude);
}

// ระยะทาง (กม.) ระหว่างบ้านลูกค้า 2 หลัง
function distanceBetween(a: OrderDetail, b: OrderDetail): number {
  return getDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
}

// แปลงเวลา "11:30" เป็นนาที (11 × 60 + 30 = 690) จะได้บวกลบกันง่าย
function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

// แปลงนาทีกลับเป็นเวลา เช่น 690 → "11:30"
function minutesToTime(totalMinutes: number): string {
  const rounded = Math.ceil(totalMinutes);
  const hour = Math.floor(rounded / 60);
  const minute = rounded % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

// วิธีที่ 1 "กวาดรอบร้าน": เรียงบ้านตามทิศรอบร้านเหมือนเข็มนาฬิกา
// แล้วตัดเป็นกลุ่ม กลุ่มละไม่เกิน 3 ออเดอร์ บ้านที่อยู่ทิศเดียวกันจะได้ไรเดอร์คนเดียวกัน
// startIndex = เริ่มตัดกลุ่มจากบ้านหลังที่เท่าไร (เปลี่ยนค่าแล้วได้แผนต่างกัน)
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

// วิธีที่ 3 "กวาดรอบร้านแบ่งเท่าๆ กัน": ใช้ตอนเจ้าของร้านเลือกจำนวนไรเดอร์เอง (riderCount คน)
// เรียงบ้านตามทิศรอบร้านเหมือนวิธีที่ 1 แล้วแบ่งให้ไรเดอร์ riderCount คน คนละจำนวนใกล้ๆ กัน
// เช่น 25 ออเดอร์ 12 คน → 1 คนได้ 3 ออเดอร์ อีก 11 คนได้ 2 ออเดอร์
function groupBySweepEven(orders: OrderDetail[], riderCount: number, startIndex: number): OrderDetail[][] {
  const angleOf = (order: OrderDetail) =>
    Math.atan2(order.longitude - SHOP.longitude, order.latitude - SHOP.latitude);

  const sorted = [...orders].sort((a, b) => angleOf(a) - angleOf(b));
  const rotated = [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];

  const groups: OrderDetail[][] = [];
  let index = 0;
  for (let i = 0; i < riderCount; i++) {
    // ทุกคนได้เท่ากันก่อน แล้วเศษที่เหลือแจกให้คนแรกๆ คนละ 1
    let size = Math.floor(orders.length / riderCount);
    if (i < orders.length % riderCount) {
      size++;
    }
    groups.push(rotated.slice(index, index + size));
    index += size;
  }
  return groups;
}

// จำนวนไรเดอร์ที่เลือกได้: น้อยสุด = ออเดอร์ ÷ 3 ปัดขึ้น (คนละไม่เกิน 3), มากสุด = 1 คน 1 ออเดอร์
export function minRiders(orderCount: number): number {
  return Math.ceil(orderCount / SHOP.maxOrdersPerRider);
}

export function maxRiders(orderCount: number): number {
  return orderCount;
}

// วิธีที่ 2 "จับกลุ่มเพื่อนบ้าน": เลือกบ้านตั้งต้น 1 หลัง (ไกลสุดหรือใกล้สุดจากร้าน)
// แล้วหยิบบ้านที่ใกล้บ้านตั้งต้นที่สุดมาเข้ากลุ่มจนครบ 3 ออเดอร์ ทำซ้ำจนครบทุกออเดอร์
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

// หาลำดับการส่งทุกแบบ เช่น [A, B, C] → ABC, ACB, BAC, BCA, CAB, CBA
// (ไรเดอร์มีไม่เกิน 3 จุด จึงมีอย่างมาก 6 แบบ ลองครบทุกแบบได้)
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

// ระยะทางรวมถ้าวิ่งตามลำดับนี้: ร้าน → จุดที่ 1 → จุดที่ 2 → ...
function routeDistance(stops: OrderDetail[]): number {
  let total = distanceFromShop(stops[0]);
  for (let i = 1; i < stops.length; i++) {
    total += distanceBetween(stops[i - 1], stops[i]);
  }
  return total;
}

// เลือกลำดับการส่งที่ระยะทางสั้นที่สุด
function bestOrdering(group: OrderDetail[]): OrderDetail[] {
  let best = group;
  for (const ordering of allOrderings(group)) {
    if (routeDistance(ordering) < routeDistance(best)) {
      best = ordering;
    }
  }
  return best;
}

// ระยะทางของกลุ่มนี้ เมื่อวิ่งตามลำดับที่ดีที่สุด
function groupDistance(group: OrderDetail[]): number {
  return routeDistance(bestOrdering(group));
}

// ลองสลับออเดอร์ระหว่าง 2 กลุ่ม (หรือย้ายออเดอร์ไปกลุ่มที่ยังไม่เต็ม)
// ถ้าระยะทางรวมสั้นลง ก็เปลี่ยนตามนั้นแล้วตอบ true
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

// ลองสลับออเดอร์ระหว่างทุกคู่กลุ่มไปเรื่อย ๆ จนสลับแล้วไม่สั้นลงอีก (ทำไม่เกิน 50 รอบ)
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

// ค่าไรเดอร์ 1 คน = 15 + 2 × จำนวนกล่อง × กม.
// เช่น ถือ 6 กล่อง วิ่ง 2 กม. = 15 + 2 × 6 × 2 = 39 บาท
export function riderCost(totalBox: number, distanceKm: number): number {
  return SHOP.riderBaseFee + SHOP.riderFeePerKmPerBox * totalBox * distanceKm;
}

// สร้างลิงก์ Google Maps นำทางจากร้าน ผ่านทุกจุดตามลำดับ
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

// สร้างใบงานของไรเดอร์ 1 คน: เรียงจุดส่ง คิดระยะทาง เวลาถึงแต่ละจุด และค่าไรเดอร์
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

  // ลูกค้าได้ของตอนไรเดอร์ถึงบ้าน จึงไม่นับเวลาแวะของจุดสุดท้าย
  // และตัดสินส่งทันจากเวลาถึงของทุกจุด ซึ่งเป็นเวลาเดียวกับที่แสดงบนใบงาน
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

// รวมคำเตือนของแผน เช่น ขาดทุน หรือมีจุดที่ส่งไม่ทันเวลา
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

// สร้างแผนทั้งหมดจากกลุ่มออเดอร์: รวมยอดขาย ต้นทุน ค่าไรเดอร์ และกำไร
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

// ทำรหัสของการแบ่งกลุ่ม เอาไว้เช็กว่าแผนไหนแบ่งกลุ่มซ้ำกัน จะได้ตัดทิ้ง
function groupsKey(groups: OrderDetail[][]): string {
  return groups
    .map((group) => group.map((order) => order.id).sort((a, b) => a - b).join("-"))
    .sort()
    .join("|");
}

// ฟังก์ชันหลัก: ลองแบ่งงานหลายวิธี แล้วเรียงแผนจากดีที่สุดไปแย่สุด
// (ส่งทันทุกบ้านมาก่อน แล้วค่าไรเดอร์ถูกสุดมาก่อน)
// riderCount = จำนวนไรเดอร์ที่เจ้าของร้านเลือกเอง (ไม่ส่งมา = ให้ระบบเลือกให้)
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

  // เลือกจำนวนไรเดอร์เอง: ใช้วิธีที่ 3 แทน โดยลองเริ่มแบ่งจากบ้านต่างกัน 5 แบบ
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
