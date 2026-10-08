// โครงสร้างข้อมูลที่ได้จาก Web API (ชื่อ field ตรงกับฝั่ง Backend)

export interface Customer {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km?: number; // มีเฉพาะตอนค้นหาในระยะ
}

export interface Order {
  id: number;
  customer_id: number;
  quantity: number;
  order_date: string;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

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

export interface RiderJob {
  id?: number; // เลขใบงาน
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
  departure_time?: string;
  deadline_time?: string;
}

export interface RoutePlan {
  id?: number;
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

// ผลจาก POST /route/calculate
export interface PlanOption {
  option: number;
  total_options: number;
  plan: RoutePlan;
}

export interface Shop {
  name: string;
  latitude: number;
  longitude: number;
  pricePerBox: number;
  foodCostPerBox: number;
  riderBaseFee: number;
  riderFeePerKmPerBox: number;
  maxOrdersPerRider: number;
  speedKmPerHour: number;
  minutesPerStop: number;
  departureTime: string;
  deadlineTime: string;
}
