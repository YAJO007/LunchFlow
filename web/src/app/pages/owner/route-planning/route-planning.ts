import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { RoutePlan } from '../../../model/route';
import { RouteApi } from '../../../services/api/route-api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { km, money, riderName } from '../../../utils/format';

@Component({
  selector: 'app-route-planning',
  imports: [RouterModule, RouteMap],
  templateUrl: './route-planning.html',
  styleUrl: './route-planning.css',
})
export class RoutePlanning {
  routeApi = inject(RouteApi);

  plan = signal<RoutePlan | undefined>(undefined);
  previous = signal<RoutePlan | undefined>(undefined);
  option = signal(0);
  totalOptions = signal(0);
  confirmed = signal(false);

  // รอ API อยู่ (ล็อกปุ่มกันกดซ้ำ)
  calculating = signal(false);
  saving = signal(false);

  // undefined = ระบบเลือกให้
  riderCount = signal<number | undefined>(undefined);
  minRiders = signal(0);
  maxRiders = signal(0);

  money = money;
  km = km;
  riderName = riderName;

  // ชื่อไรเดอร์ ช่อง 0 = คนที่ 1
  riderNames: string[] = [];

  constructor(
    public appData: AppData,
    private notify: Notify,
    private router: Router,
  ) {}

  // ล็อกปุ่มไหม
  busy(): boolean {
    return this.calculating() || this.saving();
  }

  async calculate(option: number) {
    if (this.busy()) {
      return;
    }
    this.calculating.set(true);
    try {
      const result = await this.routeApi.calculateRoute(option, this.riderCount());
      this.previous.set(this.plan());
      this.plan.set(result.plan);
      this.option.set(result.option);
      this.totalOptions.set(result.total_options);
      this.minRiders.set(result.min_riders);
      this.maxRiders.set(result.max_riders);
      this.confirmed.set(false);
    } catch (error: any) {
      this.notify.apiError(error);
    }
    this.calculating.set(false);
  }

  next() {
    this.calculate(this.option() + 1);
  }

  // คำนวณ (ระบบเลือกจำนวนไรเดอร์)
  calculateAuto() {
    this.riderCount.set(undefined);
    this.calculate(0);
  }

  // ± ไรเดอร์ 1 คน แล้วคำนวณใหม่
  changeRiders(change: number) {
    const count = this.plan()!.rider_count + change;
    if (count < this.minRiders() || count > this.maxRiders()) {
      return;
    }
    this.riderCount.set(count);
    this.calculate(0);
  }

  // ตั้งชื่อไรเดอร์
  setRiderName(riderNo: number, name: string) {
    this.riderNames[riderNo - 1] = name;
  }

  // ชื่อที่กรอกไว้
  typedName(riderNo: number): string {
    return this.riderNames[riderNo - 1] || '';
  }

  async confirm() {
    if (this.busy() || !confirm('ยืนยันแผนนี้ ?')) {
      return;
    }
    this.saving.set(true);
    try {
      // ช่องว่างส่งเป็น ''
      const names = this.plan()!.jobs.map((job) => this.typedName(job.rider_no));
      const saved = await this.routeApi.confirmRoute(this.option(), names, this.riderCount());
      this.plan.set(saved);
      this.confirmed.set(true);
      this.notify.success('ยืนยันแผน #' + saved.id + ' แล้ว');
      // เสร็จแล้วไปหน้ากำไร
      this.router.navigate(['/owner/profit']);
    } catch (error: any) {
      this.notify.apiError(error);
    }
    this.saving.set(false);
  }
}
