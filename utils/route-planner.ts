// =========================================================
// ตัวจัดเส้นทางไรเดอร์ (Route Planner)
//
// แนวคิด (อ่านจากบนลงล่าง):
// 1. แบ่งออเดอร์เป็นกลุ่ม กลุ่มละไม่เกิน 3 ออเดอร์ (1 กลุ่ม = ไรเดอร์ 1 คน)
//    ลองแบ่งหลายวิธี เพื่อให้มีแผนสำรองให้กด "คำนวณใหม่" ได้
// 2. ในแต่ละกลุ่ม ลองสลับลำดับจุดส่งทุกแบบ แล้วเลือกแบบที่ระยะทางสั้นที่สุด
// 3. คิดเวลาถึงแต่ละจุด ค่าไรเดอร์ รายได้ ต้นทุน และกำไร
// 4. เรียงแผนจากค่าส่งถูกสุดไปแพงสุด แผนที่ 1 คือแผนที่ดีที่สุด
//
// หมายเหตุ: ระยะทางคิดแบบเส้นตรงระหว่างพิกัด (ยังไม่ใช่ระยะตามถนนจริง)
// และนับระยะจากร้านไปจนถึงจุดส่งสุดท้าย (ไม่นับขากลับ)
// =========================================================
import { SHOP, RIDER_COLORS } from "../config/shop";
import { OrderDetail } from "../model/order";
import { RiderJob, RoutePlan, RouteStop } from "../model/route";
import { getDistanceKm } from "./distance";

// ---------- ฟังก์ชันช่วยเล็ก ๆ ----------

// ปัดเลขเหลือทศนิยม 2 ตำแหน่ง
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ระยะจากร้านถึงบ้านลูกค้าของออเดอร์
function distanceFromShop(order: OrderDetail): number {
  return getDistanceKm(SHOP.latitude, SHOP.longitude, order.latitude, order.longitude);
}

// ระยะระหว่างบ้านลูกค้า 2 ออเดอร์
function distanceBetween(a: OrderDetail, b: OrderDetail): number {
  return getDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
}

// แปลง "11:30" เป็นจำนวนนาทีนับจากเที่ยงคืน (690)
function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

// แปลงจำนวนนาทีกลับเป็นข้อความเวลา เช่น 705 -> "11:45"
function minutesToTime(totalMinutes: number): string {
  const rounded = Math.ceil(totalMinutes);
  const hour = Math.floor(rounded / 60);
  const minute = rounded % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

// ---------- ขั้นที่ 1: วิธีแบ่งออเดอร์เป็นกลุ่ม ----------

// วิธี A: กวาดเป็นวงรอบร้าน (Sweep)
// เรียงออเดอร์ตามทิศทางรอบร้าน แล้วตัดเป็นกลุ่มละ 3 โดยเริ่มตัดที่ตำแหน่ง startIndex
function groupBySweep(orders: OrderDetail[], startIndex: number): OrderDetail[][] {
  // มุมของบ้านลูกค้าเทียบกับร้าน (ใช้เรียงตามทิศทาง)
  const angleOf = (order: OrderDetail) =>
    Math.atan2(order.longitude - SHOP.longitude, order.latitude - SHOP.latitude);

  const sorted = [...orders].sort((a, b) => angleOf(a) - angleOf(b));
  // หมุนรายการให้เริ่มที่ startIndex
  const rotated = [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];

  const groups: OrderDetail[][] = [];
  for (let i = 0; i < rotated.length; i += SHOP.maxOrdersPerRider) {
    groups.push(rotated.slice(i, i + SHOP.maxOrdersPerRider));
  }
  return groups;
}

// วิธี B: จับกลุ่มกับเพื่อนบ้านที่ใกล้ที่สุด (Nearest Neighbor)
// เลือกออเดอร์ตั้งต้น (ไกลสุดหรือใกล้สุดจากร้าน) แล้วหยิบออเดอร์ที่อยู่ใกล้มันที่สุดมาเข้ากลุ่ม
function groupByNearest(orders: OrderDetail[], startFromFarthest: boolean): OrderDetail[][] {
  const remaining = [...orders];
  const groups: OrderDetail[][] = [];

  while (remaining.length > 0) {
    // หาออเดอร์ตั้งต้น
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

    // เติมออเดอร์ที่ใกล้ seed ที่สุด จนครบ 3
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

// ---------- ขั้นที่ 2: หาลำดับจุดส่งที่สั้นที่สุดในกลุ่ม ----------

// สร้างทุกลำดับที่เป็นไปได้ เช่น [A,B,C] -> ABC, ACB, BAC, BCA, CAB, CBA
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

// ระยะทางรวม: ร้าน -> จุดที่ 1 -> จุดที่ 2 -> ...
function routeDistance(stops: OrderDetail[]): number {
  let total = distanceFromShop(stops[0]);
  for (let i = 1; i < stops.length; i++) {
    total += distanceBetween(stops[i - 1], stops[i]);
  }
  return total;
}

// เลือกลำดับที่ระยะทางรวมสั้นที่สุด
function bestOrdering(group: OrderDetail[]): OrderDetail[] {
  let best = group;
  for (const ordering of allOrderings(group)) {
    if (routeDistance(ordering) < routeDistance(best)) {
      best = ordering;
    }
  }
  return best;
}

// ---------- ขั้นที่ 3: สร้างใบงานไรเดอร์ 1 คน ----------

// ลิงก์ Google Maps นำทางจากร้านผ่านทุกจุด
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

    // เวลาถึง = เวลาออก + เวลาขับ + เวลาส่งของที่จุดก่อนหน้า
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

  // เวลาที่ใช้ทั้งหมด (ถึงจุดสุดท้าย)
  const durationMinutes =
    (distanceSoFar / SHOP.speedKmPerHour) * 60 + (ordered.length - 1) * SHOP.minutesPerStop;
  // ค่าไรเดอร์ = 15 + 2 x กล่อง x กม.
  const cost = SHOP.riderBaseFee + SHOP.riderFeePerKmPerBox * totalBox * distanceSoFar;

  return {
    rider_no: riderNo,
    color: RIDER_COLORS[(riderNo - 1) % RIDER_COLORS.length],
    total_box: totalBox,
    distance_km: round2(distanceSoFar),
    duration_min: Math.ceil(durationMinutes),
    cost: round2(cost),
    finish_time: minutesToTime(startMinutes + durationMinutes),
    on_time: startMinutes + durationMinutes <= deadlineMinutes,
    map_url: makeMapUrl(stops),
    stops: stops,
  };
}

// ---------- ขั้นที่ 4: รวมเป็นแผน และคิดกำไรขาดทุน ----------

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

  return {
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
    jobs: jobs,
  };
}

// ข้อความระบุว่าแบ่งกลุ่มแบบไหน ใช้เช็กว่าแผน 2 แผนซ้ำกันไหม
function groupsKey(groups: OrderDetail[][]): string {
  return groups
    .map((group) => group.map((order) => order.id).sort((a, b) => a - b).join("-"))
    .sort()
    .join("|");
}

// =========================================================
// ฟังก์ชันหลัก: คืนแผนทั้งหมดที่เป็นไปได้ เรียงจากค่าส่งถูกที่สุด
// =========================================================
export function calculatePlans(orders: OrderDetail[]): RoutePlan[] {
  // ลองแบ่งกลุ่มหลายวิธี
  const candidates = [
    { name: "กวาดรอบร้าน (เริ่มตำแหน่งที่ 1)", groups: groupBySweep(orders, 0) },
    { name: "กวาดรอบร้าน (เริ่มตำแหน่งที่ 2)", groups: groupBySweep(orders, 1) },
    { name: "กวาดรอบร้าน (เริ่มตำแหน่งที่ 3)", groups: groupBySweep(orders, 2) },
    { name: "จับกลุ่มเพื่อนบ้าน (เริ่มจากบ้านไกลสุด)", groups: groupByNearest(orders, true) },
    { name: "จับกลุ่มเพื่อนบ้าน (เริ่มจากบ้านใกล้สุด)", groups: groupByNearest(orders, false) },
  ];

  // ตัดวิธีที่ได้กลุ่มซ้ำกันออก
  const plans: RoutePlan[] = [];
  const usedKeys: string[] = [];
  for (const candidate of candidates) {
    const key = groupsKey(candidate.groups);
    if (usedKeys.indexOf(key) === -1) {
      usedKeys.push(key);
      plans.push(buildPlan(candidate.groups, candidate.name));
    }
  }

  // แผนที่ส่งทันเวลามาก่อน แล้วเรียงตามค่าส่งจากถูกไปแพง
  plans.sort((a, b) => {
    if (a.all_on_time !== b.all_on_time) {
      return a.all_on_time ? -1 : 1;
    }
    return a.delivery_cost - b.delivery_cost;
  });
  return plans;
}
