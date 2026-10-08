export interface Order {
  id: number;
  customer_id: number;
  quantity: number;
  order_date: string;
}

export interface OrderDetail {
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
}

export interface OrderPostRequest {
  customer_id: number;
  quantity: number;
}
