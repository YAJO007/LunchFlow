import { Injectable, signal } from '@angular/core';
import { DEFAULT_SHOP } from '../config/shop';
import { Rider } from '../model/rider';
import { Shop } from '../model/shop';

// รายชื่อไรเดอร์เริ่มต้น (แก้ไข/เพิ่มได้ในหน้า "ไรเดอร์")
const DEFAULT_RIDERS: Rider[] = [
  { no: 1, name: 'สมศักดิ์ ใจดี', phone: '0811111111', available: true },
  { no: 2, name: 'วิชัย มีสุข', phone: '0822222222', available: true },
  { no: 3, name: 'อนุชา แสนดี', phone: '0833333333', available: true },
  { no: 4, name: 'ประยุทธ ขยัน', phone: '0844444444', available: true },
  { no: 5, name: 'ธนพล รักงาน', phone: '0855555555', available: true },
  { no: 6, name: 'กิตติ ว่องไว', phone: '0866666666', available: true },
  { no: 7, name: 'สุริยา ทองดี', phone: '0877777777', available: true },
  { no: 8, name: 'ณัฐพล บุญมา', phone: '0888888888', available: true },
  { no: 9, name: 'พงศกร ศรีสุข', phone: '0899999999', available: true },
  { no: 10, name: 'อภิชาติ คำดี', phone: '0810101010', available: true },
];

// Service เก็บข้อมูลที่ใช้ร่วมกันหลายหน้า (ตามบทเรียน 05-Data Sharing)
// - ข้อมูลร้าน          => เก็บใน service (รีเฟรชแล้วโหลดใหม่จาก API)
// - รายชื่อไรเดอร์      => localStorage (ปิดเบราว์เซอร์แล้วยังอยู่)
// - สถานะส่งสำเร็จ      => localStorage
// - การเข้าสู่ระบบร้าน  => sessionStorage (ปิดเบราว์เซอร์แล้วต้องเข้าใหม่)
@Injectable({
  providedIn: 'root',
})
export class AppData {
  shop = signal<Shop>(DEFAULT_SHOP);
  riders = signal<Rider[]>([]);

  constructor() {
    let riders = DEFAULT_RIDERS;
    // เช็คก่อนว่ามีข้อมูลใน localStorage หรือไม่ ถ้ามีให้ดึงมาใช้
    if (localStorage.getItem('riders')) {
      try {
        const saved = JSON.parse(localStorage.getItem('riders')!);
        if (Array.isArray(saved) && saved.every((r: any) => r &&
          Number.isSafeInteger(r.no) && r.no > 0 && typeof r.name === 'string' &&
          typeof r.phone === 'string' && typeof r.available === 'boolean') &&
          new Set(saved.map((r: Rider) => r.no)).size === saved.length) {
          riders = saved;
        }
      } catch (error) {
        // ข้อมูลเสียหาย: ใช้รายชื่อเริ่มต้น
      }
    }
    this.riders.set(riders);
  }

  // ---------- ไรเดอร์ ----------
  saveRiders(riders: Rider[]) {
    this.riders.set(riders);
    localStorage.setItem('riders', JSON.stringify(riders));
  }

  resetRiders() {
    this.saveRiders(DEFAULT_RIDERS);
  }

  // ไรเดอร์ที่พร้อมรับงาน
  availableRiders(): Rider[] {
    return this.riders().filter((r) => r.available);
  }

  // หาไรเดอร์ที่ได้รับใบงานลำดับที่ riderNo (ใบงานที่ 1 => ไรเดอร์ที่พร้อมคนแรก)
  riderOf(riderNo: number): Rider | undefined {
    return this.availableRiders()[riderNo - 1];
  }

  // ---------- เข้าสู่ระบบเจ้าของร้าน ----------
  isLoggedIn(): boolean {
    return sessionStorage.getItem('owner') === 'owner';
  }

  login(username: string, password: string): boolean {
    // บัญชีตัวอย่างสำหรับเดโม: owner / 1234
    if (username === 'owner' && password === '1234') {
      sessionStorage.setItem('owner', username);
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem('owner');
  }

  // ---------- สถานะส่งสำเร็จของไรเดอร์ ----------
  // เก็บเป็น array ของ stop_no ที่ส่งแล้ว แยกตามเลขใบงาน (order_id เป็น null ได้)
  deliveredOf(jobId: number): number[] {
    const key = 'delivered-' + jobId;
    if (localStorage.getItem(key)) {
      try {
        const saved = JSON.parse(localStorage.getItem(key)!);
        return Array.isArray(saved)
          ? [...new Set<number>(saved.filter((no: any) => Number.isSafeInteger(no) && no > 0))]
          : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  saveDelivered(jobId: number, orderIds: number[]) {
    localStorage.setItem('delivered-' + jobId, JSON.stringify(orderIds));
  }

  recentJobs(): string[] {
    try {
      const saved = JSON.parse(localStorage.getItem('recentJobs') || '[]');
      return Array.isArray(saved)
        ? [...new Set<string>(saved.filter((no: any) => typeof no === 'string' && /^[1-9][0-9]*$/.test(no)))].slice(0, 5)
        : [];
    } catch (error) {
      return [];
    }
  }

  // ---------- แผนร่าง ----------
  // จำว่ากำลังดูแผนที่เท่าไหร่ไว้ใน sessionStorage (รีเฟรชแล้วกลับมาแผนเดิม)
  draftOption(): number | null {
    if (sessionStorage.getItem('draftOption')) {
      const option = Number(sessionStorage.getItem('draftOption'));
      return Number.isSafeInteger(option) && option >= 0 ? option : null;
    }
    return null;
  }

  saveDraftOption(option: number | null) {
    if (option === null) {
      sessionStorage.removeItem('draftOption');
    } else {
      sessionStorage.setItem('draftOption', String(option));
    }
  }
}
