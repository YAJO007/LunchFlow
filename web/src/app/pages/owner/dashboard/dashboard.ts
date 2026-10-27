import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Customer } from '../../../model/customer';
import { Order } from '../../../model/order';
import { RoutePlan } from '../../../model/route';
import { CustomerApi } from '../../../services/api/customer-api';
import { OrderApi } from '../../../services/api/order-api';
import { RouteApi } from '../../../services/api/route-api';
import { AppData } from '../../../service/app-data';
import { money } from '../../../utils/format';

// หน้า "ภาพรวม" = หน้าแรกหลังล็อกอินของเจ้าของร้าน
// สรุปตัวเลขสำคัญ (ลูกค้า, ออเดอร์, กล่อง, ยอดขาย) และแผนส่งล่าสุด
@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  customerApi = inject(CustomerApi);
  orderApi = inject(OrderApi);
  routeApi = inject(RouteApi);

  // signal = กล่องเก็บค่า พอค่าในกล่องเปลี่ยน หน้าเว็บจะอัปเดตตัวเลขให้เอง
  customers = signal<Customer[]>([]); // รายชื่อลูกค้าทั้งหมด (เริ่มต้นว่าง)
  orders = signal<Order[]>([]); // ออเดอร์ทั้งหมด (เริ่มต้นว่าง)
  latestPlan = signal<RoutePlan | undefined>(undefined); // แผนส่งล่าสุด (ยังไม่มี = undefined)
  error = signal(''); // ข้อความแจ้งเตือนเมื่อดึงข้อมูลไม่ได้ (ว่าง = ไม่มีปัญหา)

  // ฟังก์ชันจัดรูปตัวเลขเงิน เช่น 854.3912 → 854.39 ให้หน้า HTML เรียกใช้
  money = money;

  constructor(
    public appData: AppData, // ข้อมูลที่ใช้ร่วมกันทุกหน้า (ข้อมูลร้าน)
  ) {}

  // ทำงานตอนเปิดหน้านี้ → เริ่มโหลดข้อมูล
  ngOnInit() {
    this.load();
  }

  // โหลดข้อมูลทั้งหมดที่หน้านี้ต้องใช้ แบ่งเป็น 2 ขั้น
  async load() {
    // ขั้นที่ 1: ลูกค้า + ออเดอร์ (ข้อมูลหลัก)
    // ถ้าพัง ให้ขึ้นแถบสีแดงบอกผู้ใช้
    try {
      this.customers.set(await this.customerApi.getCustomers());
      this.orders.set(await this.orderApi.getOrders());
    } catch (error: any) {
      this.error.set('เชื่อมต่อ API ไม่ได้ ถ้าใช้ Render ให้รอประมาณ 1 นาทีแล้วรีเฟรช');
    }

    // ขั้นที่ 2: แผนส่งล่าสุด
    // ถ้ายังไม่เคยยืนยันแผนเลย API จะตอบ error → ถือว่า "ยังไม่มีแผน" ไม่ต้องเตือน
    try {
      this.latestPlan.set(await this.routeApi.getLatestPlan());
    } catch (error) {
      this.latestPlan.set(undefined);
    }
  }

  // นับจำนวนกล่องทั้งหมด = เอาจำนวนกล่องของทุกออเดอร์มาบวกกัน
  // เช่น ออเดอร์ A สั่ง 2 กล่อง, B สั่ง 3 กล่อง → รวม 5 กล่อง
  // (หน้า HTML เอาค่านี้ไปคูณราคาต่อกล่อง เพื่อได้ยอดขาย)
  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }
}
