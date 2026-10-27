import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
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

  money = money;
  km = km;
  riderName = riderName;

  // ชื่อไรเดอร์ที่กรอกไว้ ช่องที่ 0 = ไรเดอร์คนที่ 1
  // กดคำนวณใหม่แล้วชื่อยังอยู่ ไม่ต้องกรอกซ้ำ
  riderNames: string[] = [];

  constructor(
    public appData: AppData,
    private notify: Notify,
  ) {}

  async calculate(option: number) {
    try {
      const result = await this.routeApi.calculateRoute(option);
      this.previous.set(this.plan());
      this.plan.set(result.plan);
      this.option.set(result.option);
      this.totalOptions.set(result.total_options);
      this.confirmed.set(false);
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  next() {
    this.calculate(this.option() + 1);
  }

  // พิมพ์ชื่อในช่องของไรเดอร์คนที่ riderNo
  setRiderName(riderNo: number, name: string) {
    this.riderNames[riderNo - 1] = name;
  }

  // ชื่อที่กรอกไว้ของไรเดอร์คนที่ riderNo (ยังไม่กรอก = '')
  typedName(riderNo: number): string {
    return this.riderNames[riderNo - 1] || '';
  }

  async confirm() {
    if (!confirm('ยืนยันแผนนี้ ?')) {
      return;
    }
    try {
      // ส่งชื่อให้ครบทุกคน ช่องไหนยังไม่กรอกส่งเป็น ''
      const names = this.plan()!.jobs.map((job) => this.typedName(job.rider_no));
      const saved = await this.routeApi.confirmRoute(this.option(), names);
      this.plan.set(saved);
      this.confirmed.set(true);
      this.notify.success('ยืนยันแผน #' + saved.id + ' แล้ว');
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }
}
