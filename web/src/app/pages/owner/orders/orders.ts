import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../model/customer';
import { Order } from '../../../model/order';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { dateTime } from '../../../utils/format';

// หน้าจัดการรายการสั่งซื้อ: จำลอง เพิ่ม แก้จำนวนกล่อง ลบ ล้างทั้งหมด
@Component({
  selector: 'app-orders',
  imports: [FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  orders = signal<Order[]>([]);
  customers = signal<Customer[]>([]);
  simulateAmount = signal(25);

  // ฟอร์มเพิ่มออเดอร์
  addOpen = signal(false);
  addCustomerId = signal(0);
  addQuantity = signal(1);

  dateTime = dateTime;

  constructor(
    private api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {
    this.load();
  }

  async load() {
    try {
      this.orders.set(await this.api.getOrders());
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  // ออเดอร์ในระยะ 2 กม. จากร้าน (GET /order/nearby)
  async nearby() {
    try {
      const shop = this.appData.shop();
      this.orders.set(await this.api.getNearbyOrders(shop.latitude, shop.longitude));
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  totalBox(): number {
    let sum = 0;
    for (const o of this.orders()) {
      sum += o.quantity;
    }
    return sum;
  }

  // จำลองออเดอร์ 20-30 รายการ
  async simulate() {
    try {
      const result = await this.api.simulateOrders(Number(this.simulateAmount()));
      this.notify.success('เพิ่ม ' + result.created_order + ' ออเดอร์');
      this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
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
    if (Number(this.addCustomerId()) === 0) {
      this.notify.error('เลือกลูกค้าก่อน');
      return;
    }
    try {
      await this.api.addOrder(Number(this.addCustomerId()), Number(this.addQuantity()));
      this.notify.success('เพิ่มออเดอร์แล้ว');
      this.addOpen.set(false);
      this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  // แก้จำนวนกล่อง (ส่ง select เข้ามาเป็นพารามิเตอร์ ตามบทเรียน Data binding)
  async changeQuantity(o: Order, select: HTMLSelectElement) {
    try {
      await this.api.updateOrder(o.id, Number(select.value));
      this.notify.success('แก้ออเดอร์ #' + o.id + ' แล้ว');
      this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  async remove(o: Order) {
    if (!confirm('ลบออเดอร์ #' + o.id + ' ?')) {
      return;
    }
    try {
      await this.api.deleteOrder(o.id);
      this.notify.success('ลบแล้ว');
      this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  async clearAll() {
    if (!confirm('ล้างออเดอร์ทั้งหมด ?')) {
      return;
    }
    try {
      await this.api.clearOrders();
      this.notify.success('ล้างออเดอร์แล้ว');
      this.load();
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }
}
