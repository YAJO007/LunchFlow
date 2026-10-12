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

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  customers = signal<Customer[]>([]);
  orders = signal<Order[]>([]);
  latestPlan = signal<any>(undefined);
  loading = signal(true);
  connected = signal(true);

  apiUrl = signal('');
  apiLocal = API_LOCAL;
  apiRender = API_RENDER;

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
    try {
      this.latestPlan.set(await this.api.getLatestPlan());
    } catch (error: any) {
      this.latestPlan.set(undefined);
      if (this.connected() && error.message !== 'ยังไม่มีแผนที่ยืนยัน') this.notify.error(error.message);
    }
    this.loading.set(false);
  }

  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }

  revenue(): number {
    return this.totalBox() * this.appData.shop().pricePerBox;
  }

  ridersNeeded(): number {
    return Math.ceil(this.orders().length / this.appData.shop().maxOrdersPerRider);
  }

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

  steps() {
    const plan = this.latestPlan() as RoutePlan | undefined;
    return [
      { done: this.customers().length > 0, title: 'ลูกค้า', sub: this.customers().length + ' คน', link: '/owner/customers' },
      { done: this.orders().length > 0, title: 'ออเดอร์', sub: this.orders().length + ' ออเดอร์', link: '/owner/orders' },
      { done: this.appData.availableRiders().length >= this.ridersNeeded() && this.orders().length > 0, title: 'ไรเดอร์', sub: this.appData.availableRiders().length + ' / ' + this.ridersNeeded() + ' คน', link: '/owner/riders' },
      { done: plan !== undefined, title: 'ยืนยันแผน', sub: plan ? '#' + plan.id : '—', link: '/owner/routes' },
    ];
  }

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

  async loadShop() {
    try {
      this.appData.shop.set(await this.api.getShop());
    } catch (error) {}
  }
}
