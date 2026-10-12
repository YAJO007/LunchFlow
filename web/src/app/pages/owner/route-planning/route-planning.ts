import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { SERVICE_RADIUS_KM } from '../../../config/shop';
import { Order } from '../../../model/order';
import { RiderJob, RoutePlan } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { dateTime, int, km, money, toMinutes } from '../../../utils/format';
import { distanceKm } from '../../../utils/geo';

@Component({
  selector: 'app-route-planning',
  imports: [RouterModule, RouteMap],
  templateUrl: './route-planning.html',
  styleUrl: './route-planning.css',
})
export class RoutePlanning {
  plan = signal<any>(undefined);
  previous = signal<any>(undefined);
  confirmed = signal<any>(undefined);
  option = signal(0);
  totalOptions = signal(0);
  orders = signal<Order[]>([]);
  calculating = signal(false);
  confirming = signal(false);
  confirmOpen = signal(false);
  highlight = signal(0);

  money = money;
  km = km;
  int = int;
  dateTime = dateTime;

  constructor(
    private api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {
    this.init();
  }

  async init() {
    await this.loadOrders();
    try {
      this.confirmed.set(await this.api.getLatestPlan());
    } catch (error: any) {
      this.confirmed.set(undefined);
      if (error.message !== 'ยังไม่มีแผนที่ยืนยัน') this.notify.error(error.message);
    }
    const draft = this.appData.draftOption();
    if (draft !== null && this.orders().length > 0) {
      this.calculate(draft, false);
    }
  }

  async loadOrders() {
    try {
      this.orders.set(await this.api.getOrders());
      return true;
    } catch (error: any) {
      this.notify.error(error.message);
      return false;
    }
  }

  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }

  problemOrders(): Order[] {
    const shop = this.appData.shop();
    return this.orders().filter(
      (o) =>
        this.isInvalid(o) || distanceKm(shop.latitude, shop.longitude, o.latitude, o.longitude) > SERVICE_RADIUS_KM,
    );
  }

  isInvalid(o: Order): boolean {
    return (
      !Number.isInteger(o.quantity) || o.quantity < 1 || o.quantity > 3 ||
      !Number.isFinite(o.latitude) || !Number.isFinite(o.longitude) ||
      Math.abs(o.latitude) > 90 || Math.abs(o.longitude) > 180
    );
  }

  invalidOrders(): Order[] {
    return this.orders().filter((o) => this.isInvalid(o));
  }

  async calculate(option: number, keepPrevious: boolean = true) {
    if (this.calculating() || this.confirming()) return;
    this.confirmOpen.set(false);
    this.calculating.set(true);
    try {
      if (!await this.loadOrders()) throw new Error('โหลดออเดอร์ล่าสุดไม่สำเร็จ');
      if (this.invalidOrders().length > 0) throw new Error('มีออเดอร์ข้อมูลผิด ' + this.invalidOrders().length + ' รายการ แก้ก่อนคำนวณ');
      const result = await this.api.calculateRoute(option);
      if (keepPrevious && this.plan()) {
        this.previous.set(this.plan());
      }
      this.plan.set(result.plan);
      this.option.set(result.option);
      this.totalOptions.set(result.total_options);
      this.highlight.set(0);
      this.appData.saveDraftOption(result.option);
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.calculating.set(false);
  }

  next() {
    this.calculate(this.option() + 1);
  }

  optionList(): number[] {
    const list = [];
    for (let i = 0; i < this.totalOptions(); i++) {
      list.push(i);
    }
    return list;
  }

  availableCount(): number {
    return this.appData.availableRiders().length;
  }

  unassignedJobs(): RiderJob[] {
    const plan = this.plan() as RoutePlan | undefined;
    if (!plan) {
      return [];
    }
    return plan.jobs.filter((j) => j.rider_no > this.availableCount());
  }

  unassignedOrderCount(): number {
    let sum = 0;
    for (const j of this.unassignedJobs()) {
      sum += j.stops.length;
    }
    return sum;
  }

  unassignedList(): string {
    return this.unassignedJobs()
      .map((j) => j.rider_no)
      .join(', ');
  }

  riderName(riderNo: number): string {
    const rider = this.appData.riderOf(riderNo);
    return rider ? rider.name : 'ไม่มีไรเดอร์';
  }

  lateJobs(): RiderJob[] {
    const plan = this.plan() as RoutePlan | undefined;
    return plan ? plan.jobs.filter((j) => !j.on_time) : [];
  }

  distanceCost(plan: RoutePlan): number {
    return plan.delivery_cost - plan.rider_count * this.appData.shop().riderBaseFee;
  }

  slackMinutes(plan: RoutePlan): number {
    return toMinutes(plan.deadline_time) - toMinutes(plan.last_arrival_time);
  }

  compareRows() {
    const a = this.previous() as RoutePlan;
    const b = this.plan() as RoutePlan;
    return [
      { label: 'ไรเดอร์', before: a.rider_count + ' คน', after: b.rider_count + ' คน', diff: b.rider_count - a.rider_count, unit: ' คน', goodWhenLess: true },
      { label: 'ระยะทาง', before: km(a.total_distance_km) + ' กม.', after: km(b.total_distance_km) + ' กม.', diff: b.total_distance_km - a.total_distance_km, unit: ' กม.', goodWhenLess: true },
      { label: 'ค่าไรเดอร์', before: '฿' + money(a.delivery_cost), after: '฿' + money(b.delivery_cost), diff: b.delivery_cost - a.delivery_cost, unit: ' บาท', goodWhenLess: true },
      { label: 'กำไร', before: '฿' + money(a.profit), after: '฿' + money(b.profit), diff: b.profit - a.profit, unit: ' บาท', goodWhenLess: false },
      { label: 'เสร็จ', before: a.last_arrival_time, after: b.last_arrival_time, diff: toMinutes(b.last_arrival_time) - toMinutes(a.last_arrival_time), unit: ' นาที', goodWhenLess: true },
    ];
  }

  diffText(diff: number, unit: string): string {
    if (Math.abs(diff) < 0.005) {
      return '=';
    }
    const value = Number.isInteger(diff) ? String(Math.abs(diff)) : Math.abs(diff).toFixed(2);
    return (diff > 0 ? '+' : '−') + value + unit;
  }

  diffClass(diff: number, goodWhenLess: boolean): string {
    if (Math.abs(diff) < 0.005) {
      return 'text-base-content/50';
    }
    const good = goodWhenLess ? diff < 0 : diff > 0;
    return good ? 'text-success' : 'text-error';
  }

  async confirm() {
    if (this.confirming() || this.calculating() || !this.plan() ||
      this.isConfirmedView() || this.unassignedJobs().length > 0 || this.invalidOrders().length > 0) return;
    this.confirming.set(true);
    try {
      const saved = await this.api.confirmRoute(this.option());
      this.confirmed.set(saved);
      this.plan.set(saved);
      this.confirmOpen.set(false);
      this.appData.saveDraftOption(null);
      this.notify.success('แผน #' + saved.id + ' · ' + saved.jobs.length + ' ใบงาน');
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.confirming.set(false);
  }

  isConfirmedView(): boolean {
    return this.plan() !== undefined && this.plan().id !== undefined;
  }
}
