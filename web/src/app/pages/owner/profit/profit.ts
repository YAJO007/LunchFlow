import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RiderJob, RoutePlan } from '../../../model/route';
import { RouteApi } from '../../../services/api/route-api';
import { AppData } from '../../../service/app-data';
import { dateTime, km, money, riderName } from '../../../utils/format';

// หน้า "กำไร" = สรุปรายรับ ต้นทุน และกำไรของแผนส่งล่าสุดที่ยืนยันแล้ว
@Component({
  selector: 'app-profit',
  imports: [RouterModule],
  templateUrl: './profit.html',
  styleUrl: './profit.css',
})
export class Profit {
  routeApi = inject(RouteApi);

  plan = signal<RoutePlan | undefined>(undefined); // แผนล่าสุด (ยังไม่มี = undefined)
  loading = signal(true);

  money = money;
  km = km;
  dateTime = dateTime;
  riderName = riderName;

  constructor(
    public appData: AppData,
  ) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      this.plan.set(await this.routeApi.getLatestPlan());
    } catch (error) {
      // ยังไม่เคยยืนยันแผน API จะตอบ 404 ถือว่า "ยังไม่มีแผน"
      this.plan.set(undefined);
    }
    this.loading.set(false);
  }

  // กำไรของไรเดอร์ 1 คน = กล่องที่ส่ง × (ราคาขาย - ต้นทุนอาหาร) - ค่าไรเดอร์
  // เช่น 6 กล่อง × (65 - 40) - 39 = 111 บาท
  jobProfit(job: RiderJob): number {
    const shop = this.appData.shop();
    return job.total_box * (shop.pricePerBox - shop.foodCostPerBox) - job.cost;
  }
}
