import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Customer } from '../../../model/customer';
import { Order } from '../../../model/order';
import { RoutePlan } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { money } from '../../../utils/format';

// หน้าภาพรวมของร้าน
@Component({
  selector: 'app-dashboard',
  imports: [RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  customers = signal<Customer[]>([]);
  orders = signal<Order[]>([]);
  latestPlan = signal<RoutePlan | undefined>(undefined);
  error = signal('');

  money = money;

  constructor(
    private api: Api,
    public appData: AppData,
  ) {
    this.load();
  }

  async load() {
    try {
      this.customers.set(await this.api.getCustomers());
      this.orders.set(await this.api.getOrders());
    } catch (error: any) {
      this.error.set('เชื่อมต่อ API ไม่ได้ ถ้าใช้ Render ให้รอประมาณ 1 นาทีแล้วรีเฟรช');
    }
    // แผนล่าสุด (ถ้ายังไม่มีแผน API จะตอบ 404)
    try {
      this.latestPlan.set(await this.api.getLatestPlan());
    } catch (error) {
      this.latestPlan.set(undefined);
    }
  }

  // จำนวนกล่องทั้งหมด
  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }
}
