import { Injectable, signal } from '@angular/core';
import { DEFAULT_API_URL } from '../config/api';
import { Customer } from '../model/customer';
import { Order } from '../model/order';
import { PlanOption, RiderJob, RoutePlan } from '../model/route';
import { Shop } from '../model/shop';

const ERROR_TEXT: { [key: string]: string } = {
  'Customer not found': 'ไม่พบข้อมูลลูกค้า',
  'Order not found': 'ไม่พบรายการสั่งซื้อ',
  'Job not found': 'ไม่พบใบงานเลขนี้',
  'No confirmed plan yet': 'ยังไม่มีแผนที่ยืนยัน',
  'Please send lat and lng': 'กรุณาระบุพิกัด lat และ lng',
  'Please send all customer fields': 'กรุณากรอกข้อมูลลูกค้าให้ครบทุกช่อง',
  'Please send customer_id and quantity (1-3)': 'กรุณาเลือกลูกค้าและจำนวนกล่อง (1-3)',
  'quantity must be 1-3': 'จำนวนกล่องต้องอยู่ระหว่าง 1-3',
  'amount must be 20 - 30': 'จำนวนรายการจำลองต้องอยู่ระหว่าง 20-30',
  'Please add customers first': 'ยังไม่มีลูกค้าในระบบ กรุณาเพิ่มลูกค้าก่อน',
  'option must be 0, 1, 2, ...': 'เลขแผนไม่ถูกต้อง',
  'No orders. Please add or simulate orders first': 'ยังไม่มีออเดอร์ กรุณาเพิ่มหรือจำลองออเดอร์ก่อน',
  'Internal server error': 'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง',
};

@Injectable({
  providedIn: 'root',
})
export class Api {
  baseUrl = signal(DEFAULT_API_URL);

  constructor() {
    if (localStorage.getItem('apiUrl')) {
      this.baseUrl.set(localStorage.getItem('apiUrl')!);
    }
  }

  setBaseUrl(url: string) {
    const clean = url.trim().replace(/\/+$/, '');
    this.baseUrl.set(clean);
    localStorage.setItem('apiUrl', clean);
  }

  private async request(method: string, path: string, body?: object) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(this.baseUrl() + path, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        if (controller.signal.aborted) throw error;
        throw new Error('API ส่งข้อมูลที่ไม่ใช่ JSON (HTTP ' + response.status + ') ลองใหม่อีกครั้ง');
      }
      if (data === null || typeof data !== 'object') {
        throw new Error('รูปแบบข้อมูลจาก API ไม่ถูกต้อง');
      }
      if (!response.ok) {
        const text = data.error || 'เกิดข้อผิดพลาด';
        throw new Error(ERROR_TEXT[text] || text);
      }
      return data;
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('API ตอบช้าเกิน 90 วินาที ลองใหม่อีกครั้ง (Render อาจกำลังเริ่มทำงาน)');
      }
      if (error instanceof TypeError) {
        throw new Error('เชื่อมต่อ API ไม่ได้ (' + this.baseUrl() + ') ตรวจสอบว่าเปิดเซิร์ฟเวอร์แล้ว');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  getCustomers(): Promise<Customer[]> {
    return this.request('GET', '/customer');
  }

  getCustomer(id: number): Promise<Customer> {
    return this.request('GET', '/customer/' + id);
  }

  searchCustomers(firstname: string, lastname: string): Promise<Customer[]> {
    const query =
      '?firstname=' + encodeURIComponent(firstname) + '&lastname=' + encodeURIComponent(lastname);
    return this.request('GET', '/customer/search' + query);
  }

  getNearbyCustomers(lat: number, lng: number): Promise<Customer[]> {
    return this.request('GET', '/customer/nearby?lat=' + lat + '&lng=' + lng);
  }

  addCustomer(customer: object) {
    return this.request('POST', '/customer', customer);
  }

  updateCustomer(id: number, customer: object) {
    return this.request('PUT', '/customer/' + id, customer);
  }

  deleteCustomer(id: number) {
    return this.request('DELETE', '/customer/' + id);
  }

  getOrders(): Promise<Order[]> {
    return this.request('GET', '/order');
  }

  getNearbyOrders(lat: number, lng: number): Promise<Order[]> {
    return this.request('GET', '/order/nearby?lat=' + lat + '&lng=' + lng);
  }

  simulateOrders(amount: number) {
    return this.request('POST', '/order/simulate', { amount: amount });
  }

  addOrder(customerId: number, quantity: number) {
    return this.request('POST', '/order', { customer_id: customerId, quantity: quantity });
  }

  updateOrder(id: number, quantity: number) {
    return this.request('PUT', '/order/' + id, { quantity: quantity });
  }

  deleteOrder(id: number) {
    return this.request('DELETE', '/order/' + id);
  }

  clearOrders() {
    return this.request('DELETE', '/order');
  }

  getShop(): Promise<Shop> {
    return this.request('GET', '/route/shop');
  }

  calculateRoute(option: number): Promise<PlanOption> {
    return this.request('POST', '/route/calculate', { option: option });
  }

  confirmRoute(option: number): Promise<RoutePlan> {
    return this.request('POST', '/route/confirm', { option: option });
  }

  getLatestPlan(): Promise<RoutePlan> {
    return this.request('GET', '/route/latest');
  }

  getJob(id: number): Promise<RiderJob> {
    return this.request('GET', '/job/' + id);
  }
}
