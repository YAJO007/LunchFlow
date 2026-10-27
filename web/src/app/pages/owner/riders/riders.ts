import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RoutePlan } from '../../../model/route';
import { RouteApi } from '../../../services/api/route-api';
import { dateTime, km, money, riderName } from '../../../utils/format';

// หน้า "ไรเดอร์" = ไรเดอร์ทุกคนในแผนล่าสุดที่ยืนยันแล้ว พร้อมใบงานของแต่ละคน
@Component({
  selector: 'app-riders',
  imports: [RouterModule],
  templateUrl: './riders.html',
  styleUrl: './riders.css',
})
export class Riders {
  routeApi = inject(RouteApi);

  plan = signal<RoutePlan | undefined>(undefined); // แผนล่าสุด (ยังไม่มี = undefined)
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
      // ยังไม่เคยยืนยันแผน API จะตอบ 404 ถือว่า "ยังไม่มีไรเดอร์ออกงาน"
      this.plan.set(undefined);
    }
    this.loading.set(false);
  }

  // กรอกเลขใบงานแล้วเปิดดูใบงานนั้น (ใบงานของแผนเก่าก็เปิดได้)
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
