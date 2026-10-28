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

// หน้าภาพรวม: ตัวเลขสรุป + แผนล่าสุด
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

  // signal เปลี่ยน → หน้าจออัปเดตเอง
  customers = signal<Customer[]>([]); // ลูกค้า
  orders = signal<Order[]>([]); // ออเดอร์
  latestPlan = signal<RoutePlan | undefined>(undefined); // แผนล่าสุด
  error = signal(''); // ข้อความ error

  // จัดรูปเงิน
  money = money;

  constructor(
    public appData: AppData, // ข้อมูลร้าน
  ) {}

  // เปิดหน้า → โหลดข้อมูล
  ngOnInit() {
    this.load();
  }

  // โหลดข้อมูล 2 ขั้น
  async load() {
    // 1) ลูกค้า + ออเดอร์ (พังให้ขึ้นแถบแดง)
    try {
      this.customers.set(await this.customerApi.getCustomers());
      this.orders.set(await this.orderApi.getOrders());
    } catch (error: any) {
      this.error.set('เชื่อมต่อ API ไม่ได้ ถ้าใช้ Render ให้รอประมาณ 1 นาทีแล้วรีเฟรช');
    }

    // 2) แผนล่าสุด
    // ยังไม่มีแผน API ตอบ error ไม่ต้องเตือน
    try {
      this.latestPlan.set(await this.routeApi.getLatestPlan());
    } catch (error) {
      this.latestPlan.set(undefined);
    }
  }

  // รวมกล่องทุกออเดอร์
  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }
}
