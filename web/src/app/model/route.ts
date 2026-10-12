// โครงสร้างข้อมูลแผนจัดส่ง (ตรงกับ API: /route/calculate, /route/confirm, /route/latest, /job/:id)

// จุดส่ง 1 จุด
export interface RouteStop {
  stop_no: number;
  order_id: number | null; // เป็น null ได้หลังล้างออเดอร์ ใบงานยังเก็บจุดส่งไว้
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
  id?: number; // เลขใบงาน (มีหลังจากยืนยันแผนแล้ว เริ่มที่ 1001)
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
  created_at?: string;
  departure_time?: string;
  deadline_time?: string;
}

// แผนจัดส่งทั้งหมด
export interface RoutePlan {
  id?: number; // มีหลังจากยืนยันแผนแล้ว
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
  jobs: RiderJob[];
}

// ผลลัพธ์ของ POST /route/calculate
export interface PlanOption {
  option: number;
  total_options: number;
  plan: RoutePlan;
}
