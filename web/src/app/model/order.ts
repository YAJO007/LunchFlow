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
