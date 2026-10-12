import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SERVICE_RADIUS_KM } from '../../../config/shop';
import { Customer } from '../../../model/customer';
import { Order } from '../../../model/order';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { dateTime, int, km } from '../../../utils/format';
import { distanceKm } from '../../../utils/geo';

@Component({
  selector: 'app-orders',
  imports: [FormsModule, RouterModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  orders = signal<Order[]>([]);
  customers = signal<Customer[]>([]);
  loading = signal(false);
  nearbyOnly = signal(false);
  keyword = signal('');

  simulateAmount = signal<number | null>(25);
  simulating = signal(false);

  addOpen = signal(false);
  addCustomerId = signal(0);
  addQuantity = signal(1);
  saving = signal(false);

  deleting = signal<any>(undefined);
  clearOpen = signal(false);

  radius = SERVICE_RADIUS_KM;
  int = int;
  km = km;
  dateTime = dateTime;

  constructor(
    private api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      if (this.nearbyOnly()) {
        const shop = this.appData.shop();
        this.orders.set(await this.api.getNearbyOrders(shop.latitude, shop.longitude));
      } else {
        this.orders.set(await this.api.getOrders());
      }
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.loading.set(false);
  }

  toggleNearby() {
    this.nearbyOnly.set(!this.nearbyOnly());
    this.load();
  }

  shown(): Order[] {
    const k = this.keyword().trim();
    if (k === '') {
      return this.orders();
    }
    return this.orders().filter(
      (o) => (o.firstname + ' ' + o.lastname).includes(k) || o.phone.includes(k) || String(o.id) === k,
    );
  }

  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }

  distanceOf(o: Order): number {
    const shop = this.appData.shop();
    return distanceKm(shop.latitude, shop.longitude, o.latitude, o.longitude);
  }

  problemOf(o: Order): string {
    if (!Number.isInteger(o.quantity) || o.quantity < 1 || o.quantity > 3) {
      return 'กล่องต้อง 1-3';
    }
    if (!Number.isFinite(o.latitude) || !Number.isFinite(o.longitude) || Math.abs(o.latitude) > 90 || Math.abs(o.longitude) > 180) {
      return 'ไม่มีพิกัด';
    }
    if (this.distanceOf(o) > this.radius) {
      return 'นอกรัศมี';
    }
    return '';
  }

  problemCount(): number {
    return this.orders().filter((o) => this.problemOf(o) !== '').length;
  }

  async simulate() {
    if (this.simulating() || this.saving()) return;
    const amount = Number(this.simulateAmount());
    if (!Number.isInteger(amount) || amount < 20 || amount > 30) {
      this.notify.error('ใส่จำนวน 20-30');
      return;
    }
    this.simulating.set(true);
    try {
      const result = await this.api.simulateOrders(amount);
      this.notify.success('+' + result.created_order + ' ออเดอร์ · ' + result.total_box + ' กล่อง');
      await this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.simulating.set(false);
  }

  async openAdd() {
    this.addCustomerId.set(0);
    this.addQuantity.set(1);
    this.addOpen.set(true);
    try {
      this.customers.set(await this.api.getCustomers());
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  async add() {
    if (this.saving() || this.simulating()) return;
    if (!this.customers().some((c) => c.id === Number(this.addCustomerId()))) {
      this.notify.error('เลือกลูกค้าก่อน');
      return;
    }
    const quantity = Number(this.addQuantity());
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) {
      this.notify.error('จำนวนกล่องต้องอยู่ระหว่าง 1-3');
      return;
    }
    this.saving.set(true);
    try {
      const result = await this.api.addOrder(Number(this.addCustomerId()), Number(this.addQuantity()));
      this.notify.success('เพิ่มออเดอร์ #' + result.last_id);
      this.addOpen.set(false);
      await this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.saving.set(false);
  }

  async changeQuantity(o: Order, select: HTMLSelectElement) {
    if (this.saving() || this.simulating()) {
      select.value = String(o.quantity);
      return;
    }
    const quantity = Number(select.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) return;
    this.saving.set(true);
    try {
      await this.api.updateOrder(o.id, quantity);
      this.notify.success('#' + o.id + ' → ' + quantity + ' กล่อง');
      await this.load();
    } catch (error: any) {
      this.notify.error(error.message);
      select.value = String(o.quantity);
    }
    this.saving.set(false);
  }

  async confirmDelete() {
    if (this.saving() || this.simulating() || !this.deleting()) return;
    const o = this.deleting() as Order;
    this.saving.set(true);
    try {
      await this.api.deleteOrder(o.id);
      this.notify.success('ลบ #' + o.id);
      this.deleting.set(undefined);
      await this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.saving.set(false);
  }

  async confirmClear() {
    if (this.saving() || this.simulating()) return;
    this.saving.set(true);
    try {
      const result = await this.api.clearOrders();
      this.notify.success('ล้าง ' + result.affected_row + ' ออเดอร์');
      this.clearOpen.set(false);
      await this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.saving.set(false);
  }
}
