import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { API_LOCAL, API_RENDER } from '../../../config/api';
import { SERVICE_RADIUS_KM } from '../../../config/shop';
import { Customer } from '../../../model/customer';
import { Order } from '../../../model/order';
import { RoutePlan } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { dateTime, int, money } from '../../../utils/format';
import { distanceKm } from '../../../utils/geo';

// หน้าภาพรวมของร้าน
@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  customers = signal<Customer[]>([]);
  orders = signal<Order[]>([]);
  latestPlan = signal<any>(undefined); // แผนล่าสุดที่ยืนยันแล้ว (ยังไม่มี = undefined)
  loading = signal(true);
  connected = signal(true);

  apiUrl = signal('');
  apiLocal = API_LOCAL;
  apiRender = API_RENDER;

  // ฟังก์ชันจัดรูปแบบตัวเลข เอาไปใช้ใน HTML
  money = money;
  int = int;
  dateTime = dateTime;

  constructor(
    public api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {
    this.apiUrl.set(this.api.baseUrl());
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      this.customers.set(await this.api.getCustomers());
      this.orders.set(await this.api.getOrders());
      this.connected.set(true);
    } catch (error: any) {
      this.connected.set(false);
      this.notify.error(error.message);
    }
    // แผนล่าสุด (ถ้ายังไม่มี API จะตอบ 404 ให้ถือว่าไม่มี)
    try {
      this.latestPlan.set(await this.api.getLatestPlan());
    } catch (error: any) {
      this.latestPlan.set(undefined);
      if (this.connected() && error.message !== 'ยังไม่มีแผนที่ยืนยัน') this.notify.error(error.message);
    }
    this.loading.set(false);
  }

  // จำนวนกล่องทั้งหมดของออเดอร์ที่รอส่ง
  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }

  // ยอดขายประมาณการ = กล่อง x ราคาต่อกล่อง
  revenue(): number {
    return this.totalBox() * this.appData.shop().pricePerBox;
  }

  // จำนวนไรเดอร์ขั้นต่ำที่ต้องใช้ (ไรเดอร์ 1 คนรับได้ไม่เกิน 3 ออเดอร์)
  ridersNeeded(): number {
    return Math.ceil(this.orders().length / this.appData.shop().maxOrdersPerRider);
  }

  // ออเดอร์ที่มีปัญหา: บ้านลูกค้าอยู่นอกรัศมี หรือจำนวนกล่องผิด
  problemOrders(): Order[] {
    const shop = this.appData.shop();
    return this.orders().filter(
      (o) =>
        !Number.isInteger(o.quantity) ||
        !Number.isFinite(o.latitude) || !Number.isFinite(o.longitude) ||
        Math.abs(o.latitude) > 90 || Math.abs(o.longitude) > 180 ||
        o.quantity < 1 ||
        o.quantity > 3 ||
        distanceKm(shop.latitude, shop.longitude, o.latitude, o.longitude) > SERVICE_RADIUS_KM,
    );
  }

  // ขั้นตอนการทำงานในแต่ละรอบ
  steps() {
    const plan = this.latestPlan() as RoutePlan | undefined;
    return [
      { done: this.customers().length > 0, title: 'ลูกค้า', sub: this.customers().length + ' คน', link: '/owner/customers' },
      { done: this.orders().length > 0, title: 'ออเดอร์', sub: this.orders().length + ' ออเดอร์', link: '/owner/orders' },
      { done: this.appData.availableRiders().length >= this.ridersNeeded() && this.orders().length > 0, title: 'ไรเดอร์', sub: this.appData.availableRiders().length + ' / ' + this.ridersNeeded() + ' คน', link: '/owner/riders' },
      { done: plan !== undefined, title: 'ยืนยันแผน', sub: plan ? '#' + plan.id : '—', link: '/owner/routes' },
    ];
  }

  // ---------- ตั้งค่าการเชื่อมต่อ API ----------
  useApi(url: string) {
    this.apiUrl.set(url);
    this.saveApi();
  }

  saveApi() {
    if (!this.apiUrl().startsWith('http')) {
      this.notify.error('URL ต้องขึ้นต้นด้วย http:// หรือ https://');
      return;
    }
    this.api.setBaseUrl(this.apiUrl());
    this.appData.saveDraftOption(null);
    this.notify.show('API: ' + this.api.baseUrl(), 'info');
    this.load();
    this.loadShop();
  }

  // โหลดข้อมูลร้านเงียบ ๆ (ถ้า API ล่ม load() แจ้ง error ไปแล้ว ไม่ต้องแจ้งซ้ำ)
  async loadShop() {
    try {
      this.appData.shop.set(await this.api.getShop());
    } catch (error) {}
  }
}
