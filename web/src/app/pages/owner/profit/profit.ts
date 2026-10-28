import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RiderJob, RoutePlan } from '../../../model/route';
import { RouteApi } from '../../../services/api/route-api';
import { AppData } from '../../../service/app-data';
import { dateTime, km, money, riderName } from '../../../utils/format';

// หน้ากำไรของแผนล่าสุด
@Component({
  selector: 'app-profit',
  imports: [RouterModule],
  templateUrl: './profit.html',
  styleUrl: './profit.css',
})
export class Profit {
  routeApi = inject(RouteApi);

  plan = signal<RoutePlan | undefined>(undefined); // แผนล่าสุด
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
      // ยังไม่มีแผน (404)
      this.plan.set(undefined);
    }
    this.loading.set(false);
  }

  // กำไรต่อไรเดอร์ = กล่อง × (65 - 40) - ค่าไรเดอร์
  jobProfit(job: RiderJob): number {
    const shop = this.appData.shop();
    return job.total_box * (shop.pricePerBox - shop.foodCostPerBox) - job.cost;
  }
}
