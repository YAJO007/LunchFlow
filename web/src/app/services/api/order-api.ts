import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Api } from '../../config/api';
import { Order } from '../../model/order';

// เรียก API ออเดอร์ (/order)
@Injectable({
  providedIn: 'root',
})
export class OrderApi {
  http = inject(HttpClient);
  api = inject(Api);
  apiEndpoint = this.api.API_ENDPOINT;

  public async getOrders() {
    const url = `${this.apiEndpoint}/order`;
    const response = await lastValueFrom(this.http.get(url));
    return response as Order[];
  }

  // สุ่ม 20-30 ออเดอร์
  public async simulateOrders(amount: number) {
    const url = `${this.apiEndpoint}/order/simulate`;
    const response = await lastValueFrom(this.http.post(url, { amount: amount }));
    return response as any;
  }

  public async addOrder(customerId: number, quantity: number) {
    const url = `${this.apiEndpoint}/order`;
    const response = await lastValueFrom(
      this.http.post(url, { customer_id: customerId, quantity: quantity }),
    );
    return response;
  }

  public async updateOrder(id: number, quantity: number) {
    const url = `${this.apiEndpoint}/order/${id}`;
    const response = await lastValueFrom(this.http.put(url, { quantity: quantity }));
    return response;
  }

  public async deleteOrder(id: number) {
    const url = `${this.apiEndpoint}/order/${id}`;
    const response = await lastValueFrom(this.http.delete(url));
    return response;
  }

  // ลบออเดอร์ทั้งหมด
  public async clearOrders() {
    const url = `${this.apiEndpoint}/order`;
    const response = await lastValueFrom(this.http.delete(url));
    return response;
  }
}
