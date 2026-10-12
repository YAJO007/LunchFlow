import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RiderJob, RoutePlan } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { dateTime, int, km, money } from '../../../utils/format';

// หน้ารายงานต้นทุนและกำไร (จากแผนที่ยืนยันล่าสุด GET /route/latest)
@Component({
  selector: 'app-report',
  imports: [RouterModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report {
  plan = signal<any>(undefined); // RoutePlan
  loading = signal(true);
  error = signal('');

  money = money;
  int = int;
  km = km;
  dateTime = dateTime;

  constructor(
    private api: Api,
    public appData: AppData,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.plan.set(await this.api.getLatestPlan());
      this.error.set('');
    } catch (error: any) {
      this.plan.set(undefined);
      this.error.set(error.message);
    }
    this.loading.set(false);
  }

  p(): RoutePlan {
    return this.plan() as RoutePlan;
  }

  baseFeeTotal(): number {
    return this.p().rider_count * this.appData.shop().riderBaseFee;
  }

  distanceFeeTotal(): number {
    return this.p().delivery_cost - this.baseFeeTotal();
  }

  // สัดส่วนของยอดขาย (%) ติดลบได้ (เช่น ขาดทุน)
  percent(value: number): number {
    if (this.p().revenue === 0) {
      return 0;
    }
    return (value / this.p().revenue) * 100;
  }

  // ความกว้างแถบกราฟ (%) ต้องไม่ติดลบ
  bar(value: number): number {
    return Math.max(0, this.percent(value));
  }

  profitPerBox(): number {
    return this.p().total_box === 0 ? 0 : this.p().profit / this.p().total_box;
  }

  deliveryPerBox(): number {
    return this.p().total_box === 0 ? 0 : this.p().delivery_cost / this.p().total_box;
  }

  // ค่าส่งตามระยะทางของไรเดอร์ 1 คน
  jobDistanceFee(job: RiderJob): number {
    return job.cost - this.appData.shop().riderBaseFee;
  }

  // กำไรที่ได้จากออเดอร์ในใบงานนี้ = กล่อง x (ราคา - ต้นทุน) - ค่าไรเดอร์
  jobProfit(job: RiderJob): number {
    const shop = this.appData.shop();
    return job.total_box * (shop.pricePerBox - shop.foodCostPerBox) - job.cost;
  }

  print() {
    window.print();
  }
}
