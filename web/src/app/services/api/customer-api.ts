import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Api } from '../../config/api';
import { Customer } from '../../model/customer';

// เรียก API ลูกค้า (/customer)
@Injectable({
  providedIn: 'root',
})
export class CustomerApi {
  http = inject(HttpClient);
  api = inject(Api);
  apiEndpoint = this.api.API_ENDPOINT;

  public async getCustomers() {
    const url = `${this.apiEndpoint}/customer`;
    const response = await lastValueFrom(this.http.get(url));
    return response as Customer[];
  }

  public async searchCustomers(name: string) {
    const url = `${this.apiEndpoint}/customer/search`;
    const response = await lastValueFrom(
      this.http.get(url, {
        params: {
          name: name,
        },
      }),
    );
    return response as Customer[];
  }

  public async addCustomer(customer: any) {
    const url = `${this.apiEndpoint}/customer`;
    const response = await lastValueFrom(this.http.post(url, customer));
    return response;
  }

  public async updateCustomer(id: number, customer: any) {
    const url = `${this.apiEndpoint}/customer/${id}`;
    const response = await lastValueFrom(this.http.put(url, customer));
    return response;
  }

  public async deleteCustomer(id: number) {
    const url = `${this.apiEndpoint}/customer/${id}`;
    const response = await lastValueFrom(this.http.delete(url));
    return response;
  }
}
