import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { RoutePlan } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { km, money } from '../../../utils/format';

// หน้าจัดเส้นทาง: คำนวณแผน ดูแผนอื่น เทียบกับแผนก่อน และยืนยันเป็นใบงาน
@Component({
  selector: 'app-route-planning',
  imports: [RouterModule, RouteMap],
  templateUrl: './route-planning.html',
  styleUrl: './route-planning.css',
})
export class RoutePlanning {
  plan = signal<RoutePlan | undefined>(undefined); // แผนที่กำลังดู
  previous = signal<RoutePlan | undefined>(undefined); // แผนก่อนหน้า ไว้เทียบ
  option = signal(0); // ลำดับแผนที่กำลังดู
  totalOptions = signal(0);
  confirmed = signal(false); // ยืนยันแผนนี้แล้วหรือยัง

  money = money;
  km = km;

  constructor(
    private api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {}

  // คำนวณเส้นทาง (option = ลำดับแผน 0, 1, 2, ...)
  async calculate(option: number) {
    try {
      const result = await this.api.calculateRoute(option);
      this.previous.set(this.plan()); // เก็บแผนเดิมไว้เทียบ
      this.plan.set(result.plan);
      this.option.set(result.option);
      this.totalOptions.set(result.total_options);
      this.confirmed.set(false);
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  // คำนวณใหม่ => ขอแผนถัดไป
  next() {
    this.calculate(this.option() + 1);
  }

  // ไรเดอร์ที่พร้อมมีพอไหม
  enoughRiders(): boolean {
    return this.plan()!.rider_count <= this.appData.availableRiders().length;
  }

  riderName(riderNo: number): string {
    const rider = this.appData.riderOf(riderNo);
    if (rider) {
      return rider.name;
    }
    return 'ไม่มีไรเดอร์';
  }

  // ยืนยันแผน => บันทึกลงฐานข้อมูลและได้เลขใบงาน
  async confirm() {
    if (!confirm('ยืนยันแผนนี้ ?')) {
      return;
    }
    try {
      const saved = await this.api.confirmRoute(this.option());
      this.plan.set(saved);
      this.confirmed.set(true);
      this.notify.success('ยืนยันแผน #' + saved.id + ' แล้ว');
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }
}
