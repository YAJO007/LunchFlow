import { Injectable } from '@angular/core';
import { API_URL } from '../config/api';
import { Customer } from '../model/customer';
import { Order } from '../model/order';
import { PlanOption, RiderJob, RoutePlan } from '../model/route';
import { Shop } from '../model/shop';
import { Rider, RiderPostRequest, RiderPutRequest } from '../model/rider';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private async request(method: string, path: string, body?: object) {
    const response = await fetch(API_URL + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    return data;
  }

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

  getRiders(): Promise<Rider[]> {
    return this.request('GET', '/rider');
  }

  addRider(rider: RiderPostRequest) {
    return this.request('POST', '/rider', rider);
  }

  updateRider(no: number, rider: RiderPutRequest) {
    return this.request('PUT', '/rider/' + no, rider);
  }

  deleteRider(no: number) {
    return this.request('DELETE', '/rider/' + no);
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

  calculateRoute(option: number, availableRiders?: number): Promise<PlanOption> {
    return this.request('POST', '/route/calculate', {
      option: option,
      available_riders: availableRiders,
    });
  }

  confirmRoute(option: number, availableRiders?: number): Promise<RoutePlan> {
    return this.request('POST', '/route/confirm', {
      option: option,
      available_riders: availableRiders,
    });
  }

  getLatestPlan(): Promise<RoutePlan> {
    return this.request('GET', '/route/latest');
  }

  getJob(id: number): Promise<RiderJob> {
    return this.request('GET', '/job/' + id);
  }
}
