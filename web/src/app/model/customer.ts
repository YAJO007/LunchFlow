// โครงสร้างข้อมูลลูกค้า (ตรงกับ API: GET /customer)
export interface Customer {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km?: number; // มีเฉพาะตอนเรียก /customer/nearby
}
