// ข้อมูลไรเดอร์ (เก็บไว้ในเครื่องด้วย localStorage เพราะ API ยังไม่มีตารางไรเดอร์)
export interface Rider {
  no: number; // ลำดับไรเดอร์ ใช้จับคู่กับ rider_no ของใบงาน
  name: string;
  phone: string;
  available: boolean; // พร้อมรับงานรอบนี้หรือไม่
}
