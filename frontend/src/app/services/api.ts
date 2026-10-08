import { Injectable } from '@angular/core';
import { Customer, Order, PlanOption, RiderJob, RoutePlan, Shop } from '../models';

// Service กลางสำหรับเรียก Web API ทุกเส้น (ใช้ fetch แบบเดียวกับบทเรียน CORS)
@Injectable({
  providedIn: 'root',
})
export class Api {
  // เปิดเว็บในเครื่อง (localhost) -> ใช้ API ในเครื่อง
  // เปิดเว็บที่ Deploy แล้ว -> ใช้ API บน Render
  baseUrl =
    location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://lunchflow-u723.onrender.com';

  // ฟังก์ชันกลาง: ส่ง request แล้วแปลงผลลัพธ์เป็น JSON
  // ถ้า API ตอบ error (เช่น 400, 404) จะโยน Error พร้อมข้อความกลับไปให้หน้าเว็บแสดง
  private async request(method: string, path: string, body?: object) {
    const response = await fetch(this.baseUrl + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'เกิดข้อผิดพลาด');
    }
    return data;
  }

  // ---------- ลูกค้า ----------
  getCustomers(): Promise<Customer[]> {
    return this.request('GET', '/customer');
  }

  searchCustomers(firstname: string, lastname: string): Promise<Customer[]> {
    const query =
      '?firstname=' + encodeURIComponent(firstname) + '&lastname=' + encodeURIComponent(lastname);
    return this.request('GET', '/customer/search' + query);
  }

  getNearbyCustomers(lat: number, lng: number): Promise<Customer[]> {
    return this.request('GET', '/customer/nearby?lat=' + lat + '&lng=' + lng);
  }

  addCustomer(customer: Omit<Customer, 'id'>) {
    return this.request('POST', '/customer', customer);
  }

  updateCustomer(id: number, customer: Omit<Customer, 'id'>) {
    return this.request('PUT', '/customer/' + id, customer);
  }

  deleteCustomer(id: number) {
    return this.request('DELETE', '/customer/' + id);
  }

  // ---------- ออเดอร์ ----------
  getOrders(): Promise<Order[]> {
    return this.request('GET', '/order');
  }

  getNearbyOrders(lat: number, lng: number): Promise<Order[]> {
    return this.request('GET', '/order/nearby?lat=' + lat + '&lng=' + lng);
  }

  addOrder(customerId: number, quantity: number) {
    return this.request('POST', '/order', { customer_id: customerId, quantity: quantity });
  }

  updateOrderQuantity(id: number, quantity: number) {
    return this.request('PUT', '/order/' + id, { quantity: quantity });
  }

  deleteOrder(id: number) {
    return this.request('DELETE', '/order/' + id);
  }

  simulateOrders(amount: number) {
    return this.request('POST', '/order/simulate', { amount: amount });
  }

  clearOrders() {
    return this.request('DELETE', '/order');
  }

  // ---------- จัดเส้นทาง / ใบงาน ----------
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

  getJob(jobId: number): Promise<RiderJob> {
    return this.request('GET', '/job/' + jobId);
  }
}
