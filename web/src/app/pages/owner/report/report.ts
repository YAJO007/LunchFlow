import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RiderJob, RoutePlan } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { dateTime, km, money } from '../../../utils/format';

// หน้ารายงานต้นทุนและกำไร (จากแผนที่ยืนยันล่าสุด GET /route/latest)
@Component({
  selector: 'app-report',
  imports: [RouterModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report {
  plan = signal<RoutePlan | undefined>(undefined);

  money = money;
  km = km;
  dateTime = dateTime;

  constructor(
    private api: Api,
    public appData: AppData,
  ) {
    this.load();
  }

  async load() {
    try {
      this.plan.set(await this.api.getLatestPlan());
    } catch (error) {
      this.plan.set(undefined);
    }
  }

  // กำไรของใบงาน = กล่อง x (ราคา - ต้นทุน) - ค่าไรเดอร์
  jobProfit(job: RiderJob): number {
    const shop = this.appData.shop();
    return job.total_box * (shop.pricePerBox - shop.foodCostPerBox) - job.cost;
  }
}
