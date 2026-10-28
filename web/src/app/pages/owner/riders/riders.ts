import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RoutePlan } from '../../../model/route';
import { RouteApi } from '../../../services/api/route-api';
import { dateTime, km, money, riderName } from '../../../utils/format';

// หน้าไรเดอร์ของแผนล่าสุด
@Component({
  selector: 'app-riders',
  imports: [RouterModule],
  templateUrl: './riders.html',
  styleUrl: './riders.css',
})
export class Riders {
  routeApi = inject(RouteApi);

  plan = signal<RoutePlan | undefined>(undefined); // แผนล่าสุด
  loading = signal(true);
  error = signal('');

  km = km;
  money = money;
  dateTime = dateTime;
  riderName = riderName;

  constructor(private router: Router) {}

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

  // เปิดใบงานตามเลข
  open(jobNo: HTMLInputElement) {
    const id = Number(jobNo.value);
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('กรุณากรอกเลขใบงานเป็นตัวเลข เช่น 1001');
      return;
    }
    this.error.set('');
    this.router.navigate(['/rider/job', id]);
  }
}
