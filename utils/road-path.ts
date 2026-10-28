import { SHOP } from "../config/shop";
import { RiderJob } from "../model/route";

// ขอเส้นตามถนนจาก OSRM
// ได้ [[lat, lng], ...] ถ้าพลาดได้ [] (วาดเส้นตรงแทน)
export async function getRoadPath(job: RiderJob): Promise<number[][]> {
  try {
    // OSRM ใช้ lng,lat คั่นด้วย ;
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

    // สลับเป็น [lat, lng]
    const coordinates = data.routes[0].geometry.coordinates as number[][];
    return coordinates.map((c) => [c[1], c[0]]);
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ใส่เส้นถนนให้ทุกใบงาน
// ขอพร้อมกันทุกใบ
export async function addRoadPaths(jobs: RiderJob[]) {
  const requests = jobs.map((job) => getRoadPath(job));
  for (let i = 0; i < jobs.length; i++) {
    jobs[i].path = await requests[i];
  }
}
