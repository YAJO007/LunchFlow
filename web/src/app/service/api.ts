import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { API_URL } from '../config/api';
import { Customer } from '../model/customer';
import { Order } from '../model/order';
import { PlanOption, RiderJob, RoutePlan } from '../model/route';
import { Shop } from '../model/shop';

// รวมทุกเส้น API ไว้ที่เดียว (ตามบท API Endpoint)
// หน้าไหนอยากคุยกับหลังบ้าน ก็ inject(Api) แล้วเรียกฟังก์ชันในนี้
@Injectable({
  providedIn: 'root',
})
export class Api {
  http = inject(HttpClient);

  // ---------- ลูกค้า ----------
  async getCustomers() {
    const url = `${API_URL}/customer`;
    const response = await lastValueFrom(this.http.get(url));
    return response as Customer[];
  }

  async searchCustomers(name: string) {
    const url = `${API_URL}/customer/search`;
    const response = await lastValueFrom(this.http.get(url, { params: { name: name } }));
    return response as Customer[];
  }

(customer: object) {
    const url = `${API_URL}/customer`;
    const response = await lastValueFrom(this.http.post(url, customer));
    return response;
  }

  async updateCustomer(id: number, customer: object) {
    const url = `${API_URL}/customer/${id}`;
    const response = await lastValueFrom(this.http.put(url, customer));
    return response;
  }

  async deleteCustomer(id: number) {
    const url = `${API_URL}/customer/${id}`;
    const response = await lastValueFrom(this.http.delete(url));
    return response;
  }

  // ---------- ออเดอร์ ----------
  async getOrders() {
    const url = `${API_URL}/order`;
    const response = await lastValueFrom(this.http.get(url));
    return response as Order[];
  }

  async simulateOrders(amount: number) {
    const url = `${API_URL}/order/simulate`;
    const response = await lastValueFrom(this.http.post(url, { amount: amount }));
    return response as any;
  }

  async addOrder(customerId: number, quantity: number) {
    const url = `${API_URL}/order`;
    const response = await lastValueFrom(this.http.post(url, { customer_id: customerId, quantity: quantity }));
    return response;
  }

  async updateOrder(id: number, quantity: number) {
    const url = `${API_URL}/order/${id}`;
    const response = await lastValueFrom(this.http.put(url, { quantity: quantity }));
    return response;
  }

  async deleteOrder(id: number) {
    const url = `${API_URL}/order/${id}`;
    const response = await lastValueFrom(this.http.delete(url));
    return response;
  }

  async clearOrders() {
    const url = `${API_URL}/order`;
    const response = await lastValueFrom(this.http.delete(url));
    return response;
  }

  // ---------- จัดเส้นทาง ----------
  async getShop() {
    const url = `${API_URL}/route/shop`;
    const response = await lastValueFrom(this.http.get(url));
    return response as Shop;
  }

  async calculateRoute(option: number) {
    const url = `${API_URL}/route/calculate`;
    const response = await lastValueFrom(
      this.http.post(url, { option: option }),
    );
    return response as PlanOption;
  }

  async confirmRoute(option: number) {
    const url = `${API_URL}/route/confirm`;
    const response = await lastValueFrom(
      this.http.post(url, { option: option }),
    );
    return response as RoutePlan;
  }

  async getLatestPlan() {
    const url = `${API_URL}/route/latest`;
    const response = await lastValueFrom(this.http.get(url));
    return response as RoutePlan;
  }

  // ---------- ใบงานไรเดอร์ ----------
  async getJob(id: number) {
    const url = `${API_URL}/job/${id}`;
    const response = await lastValueFrom(this.http.get(url));
    return response as RiderJob;
  }
}
