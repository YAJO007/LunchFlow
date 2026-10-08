// ข้อมูลลูกค้า 1 คน (ตรงกับตาราง customer)
export interface Customer {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

// ข้อมูลที่ต้องส่งมาตอนเพิ่มลูกค้าใหม่ (ไม่ต้องส่ง id เพราะฐานข้อมูลสร้างให้เอง)
export interface CustomerPostRequest {
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}
