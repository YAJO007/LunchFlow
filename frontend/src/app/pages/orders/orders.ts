import { Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Api } from '../../services/api';
import { Customer, Order } from '../../models';
import { SHOP_LAT, SHOP_LNG } from '../../utils/map';

@Component({
  selector: 'app-orders',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './orders.html',
})
export class Orders {
  orders = signal<Order[]>([]);
  customers = signal<Customer[]>([]);
  message = signal('');
  errorMessage = signal('');
  loading = signal(false);

  // จำลองออเดอร์
  simulateAmount = model(25);

  // ฟอร์มเพิ่มออเดอร์
  newCustomerId = model<number | null>(null);
  newQuantity = model(1);

  // ตัวกรอง: แสดงเฉพาะออเดอร์ในระยะ 2 กม. จากร้าน
  onlyNearby = signal(false);

  // ถามยืนยันก่อนลบ
  deletingId = signal<number | null>(null);
  confirmClear = signal(false);

  // ตัวเลือกจำนวนกล่อง (ลูกค้าสั่งได้ 1-3 กล่อง)
  boxChoices = [1, 2, 3];

  constructor(private api: Api) {
    this.loadData();
  }

  async loadData() {
    try {
      this.customers.set(await this.api.getCustomers());
      await this.loadOrders();
    } catch (error) {
      this.showError(error);
    }
  }

  async loadOrders() {
    if (this.onlyNearby()) {
      this.orders.set(await this.api.getNearbyOrders(SHOP_LAT, SHOP_LNG));
    } else {
      this.orders.set(await this.api.getOrders());
    }
  }

  async toggleNearby() {
    this.onlyNearby.set(!this.onlyNearby());
    await this.loadOrders();
  }

  // จำนวนกล่องรวมทุกออเดอร์
  totalBox(): number {
    let total = 0;
    for (const order of this.orders()) {
      total += order.quantity;
    }
    return total;
  }

  async simulate() {
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const result = await this.api.simulateOrders(this.simulateAmount());
      this.message.set(
        'จำลองออเดอร์ใหม่ ' + result.created_order + ' รายการ (' + result.total_box + ' กล่อง)',
      );
      await this.loadOrders();
    } catch (error) {
      this.showError(error);
    }
    this.loading.set(false);
  }

  async addOrder() {
    this.errorMessage.set('');
    const customerId = this.newCustomerId();
    if (customerId === null) {
      this.errorMessage.set('กรุณาเลือกลูกค้า');
      return;
    }
    try {
      await this.api.addOrder(Number(customerId), Number(this.newQuantity()));
      this.message.set('เพิ่มออเดอร์เรียบร้อย');
      this.newCustomerId.set(null);
      this.newQuantity.set(1);
      await this.loadOrders();
    } catch (error) {
      this.showError(error);
    }
  }

  // เปลี่ยนจำนวนกล่องจาก dropdown ในตาราง
  async changeQuantity(order: Order, quantity: string) {
    try {
      await this.api.updateOrderQuantity(order.id, Number(quantity));
      this.message.set('แก้ไขออเดอร์ #' + order.id + ' เป็น ' + quantity + ' กล่อง');
      await this.loadOrders();
    } catch (error) {
      this.showError(error);
    }
  }

  async deleteOrder(id: number) {
    try {
      await this.api.deleteOrder(id);
      this.deletingId.set(null);
      this.message.set('ลบออเดอร์ #' + id + ' เรียบร้อย');
      await this.loadOrders();
    } catch (error) {
      this.showError(error);
    }
  }

  async clearAll() {
    try {
      const result = await this.api.clearOrders();
      this.confirmClear.set(false);
      this.message.set('ล้างออเดอร์ทั้งหมดแล้ว (' + result.affected_row + ' รายการ)');
      await this.loadOrders();
    } catch (error) {
      this.showError(error);
    }
  }

  private showError(error: unknown) {
    this.errorMessage.set(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
  }
}
