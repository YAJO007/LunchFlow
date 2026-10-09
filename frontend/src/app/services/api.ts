import { Injectable } from '@angular/core';
import { Customer, Order, PlanOption, RiderJob, RoutePlan, Shop } from '../models';

@Injectable({
  providedIn: 'root',
})
export class Api {

  baseUrl =
    location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://lunchflow-u723.onrender.com';

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
