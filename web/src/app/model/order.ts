// โครงสร้างข้อมูลรายการสั่งซื้อ (ตรงกับ API: GET /order)
// API จะส่งข้อมูลลูกค้าที่สั่งรวมมาด้วย (firstname - longitude)
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
}
