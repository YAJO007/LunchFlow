import { Injectable } from '@angular/core';
import { API_URL } from '../config/api';
import { Customer } from '../model/customer';
import { Order } from '../model/order';
import { PlanOption, RiderJob, RoutePlan } from '../model/route';
import { Shop } from '../model/shop';

// Service สำหรับเรียก Web API ด้วย fetch (ตามบทเรียน 12-CORS)
// สร้างด้วยคำสั่ง: ng g s service/api --skip-tests
@Injectable({
  providedIn: 'root',
})
export class Api {
  // ฟังก์ชันกลางสำหรับเรียก API ทุกเส้น
  private async request(method: string, path: string, body?: object) {
    const response = await fetch(API_URL + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
      // API ส่ง error กลับมาในรูปแบบ { "error": "ข้อความ" }
      throw new Error(data.error);
    }
    return data;
  }

  // ---------- ลูกค้า (Customer) ----------
  getCustomers(): Promise<Customer[]> {
    return this.request('GET', '/customer');
  }

  searchCustomers(firstname: string, lastname: string): Promise<Customer[]> {
    return this.request('GET', '/customer/search?firstname=' + firstname + '&lastname=' + lastname);
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

  // ---------- รายการสั่งซื้อ (Order) ----------
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

  // ---------- จัดเส้นทางและใบงาน (Route / Job) ----------
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
