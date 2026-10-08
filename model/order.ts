// ข้อมูลออเดอร์ 1 รายการ (ตรงกับตาราง orders)
export interface Order {
  id: number;
  customer_id: number;
  quantity: number;
  order_date: string;
}

// ออเดอร์ + ข้อมูลลูกค้าที่สั่ง (ได้จากการ JOIN ตาราง orders กับ customer)
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

// ข้อมูลที่ต้องส่งมาตอนเพิ่มออเดอร์ใหม่
export interface OrderPostRequest {
  customer_id: number;
  quantity: number;
}
