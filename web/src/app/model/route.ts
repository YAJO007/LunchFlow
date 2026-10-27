
export interface RouteStop {
  stop_no: number;
  order_id: number | null;
  customer_name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  quantity: number;
  distance_from_prev_km: number;
  arrival_time: string;
}

export interface RiderJob {
  id?: number;
  plan_id?: number;
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
  rider_name?: string; // ชื่อไรเดอร์ (กรอกตอนยืนยันแผน)
  path?: number[][]; // เส้นทางตามถนน [[ละติจูด, ลองจิจูด], ...]
  created_at?: string;
  departure_time?: string;
  deadline_time?: string;
}

export interface RoutePlan {
  id?: number;
  created_at?: string;
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
  warnings?: string[];
  jobs: RiderJob[];
}

export interface PlanOption {
  option: number;
  total_options: number;
  min_riders: number; // ไรเดอร์น้อยสุดที่เลือกได้ (คนละไม่เกิน 3 ออเดอร์)
  max_riders: number; // ไรเดอร์มากสุดที่เลือกได้ (1 คน 1 ออเดอร์)
  plan: RoutePlan;
}
