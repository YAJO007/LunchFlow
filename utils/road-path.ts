import { SHOP } from "../config/shop";
import { RiderJob } from "../model/route";

// ขอเส้นทางตามถนนจริงจากบริการ OSRM (ฟรี ไม่ต้องสมัคร)
// ส่งพิกัด ร้าน → จุดที่ 1 → จุดที่ 2 → ... ไป แล้วได้จุดบนถนนกลับมาหลายสิบจุด เอาไปวาดเส้นบนแผนที่
// ได้กลับเป็น [[ละติจูด, ลองจิจูด], ...] ถ้าขอไม่สำเร็จจะได้ [] (หน้าเว็บจะวาดเส้นตรงแทน)
export async function getRoadPath(job: RiderJob): Promise<number[][]> {
  try {
    // OSRM ใช้ลำดับ ลองจิจูด,ละติจูด และคั่นแต่ละจุดด้วย ;
    let points = SHOP.longitude + "," + SHOP.latitude;
    for (const stop of job.stops) {
      points += ";" + stop.longitude + "," + stop.latitude;
    }
    const url =
      "https://router.project-osrm.org/route/v1/driving/" + points + "?overview=full&geometries=geojson";

    const response = await fetch(url);
    const data = (await response.json()) as any;
    if (data.code !== "Ok") {
      return [];
    }

    // OSRM ส่งมาเป็น [ลองจิจูด, ละติจูด] สลับเป็น [ละติจูด, ลองจิจูด] ให้เหมือนที่อื่นในโปรเจกต์
    const coordinates = data.routes[0].geometry.coordinates as number[][];
    return coordinates.map((c) => [c[1], c[0]]);
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ใส่เส้นทางถนน (path) ให้ใบงานทุกใบ
// เริ่มขอทุกใบพร้อมกันก่อน แล้วค่อยรอผลทีละใบ จะได้ไม่ต้องรอนานเท่าจำนวนไรเดอร์
export async function addRoadPaths(jobs: RiderJob[]) {
  const requests = jobs.map((job) => getRoadPath(job));
  for (let i = 0; i < jobs.length; i++) {
    jobs[i].path = await requests[i];
  }
}
