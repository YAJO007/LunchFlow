// จุดส่งของ 1 จุดในใบงานไรเดอร์
export interface RouteStop {
  stop_no: number;
  order_id: number;
  customer_name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  quantity: number;
  distance_from_prev_km: number;
  arrival_time: string;
}

// ใบงานของไรเดอร์ 1 คน
export interface RiderJob {
  id?: number; // เลขใบงาน (มีหลังกดยืนยันแผน)
  rider_no: number;
  color: string;
  total_box: number;
  distance_km: number;
  duration_min: number;
  cost: number;
  finish_time: string;
  on_time: boolean;
  map_url: string;
  stops: RouteStop[];
}

// แผนการจัดส่งทั้งหมดของรอบนี้
export interface RoutePlan {
  id?: number; // เลขแผน (มีหลังกดยืนยันแผน)
  strategy: string;
  rider_count: number;
  total_order: number;
  total_box: number;
  total_distance_km: number;
  delivery_cost: number;
  revenue: number;
  food_cost: number;
  profit: number;
  departure_time: string;
  deadline_time: string;
  last_arrival_time: string;
  all_on_time: boolean;
  jobs: RiderJob[];
}
