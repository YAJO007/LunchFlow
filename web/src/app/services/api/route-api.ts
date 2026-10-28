import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Api } from '../../config/api';
import { PlanOption, RiderJob, RoutePlan } from '../../model/route';
import { Shop } from '../../model/shop';

// เรียก /route และ /job
@Injectable({
  providedIn: 'root',
})
export class RouteApi {
  http = inject(HttpClient);
  api = inject(Api);
  apiEndpoint = this.api.API_ENDPOINT;

  // ข้อมูลร้าน
  public async getShop() {
    const url = `${this.apiEndpoint}/route/shop`;
    const response = await lastValueFrom(this.http.get(url));
    return response as Shop;
  }

  // คำนวณแผนที่ option (ยังไม่บันทึก)
  // riderCount ไม่ส่ง = ระบบเลือก
  public async calculateRoute(option: number, riderCount?: number) {
    const url = `${this.apiEndpoint}/route/calculate`;
    const response = await lastValueFrom(
      this.http.post(url, { option: option, rider_count: riderCount }),
    );
    return response as PlanOption;
  }

  // ยืนยัน = บันทึก + ออกเลขใบงาน
  public async confirmRoute(option: number, riderNames: string[], riderCount?: number) {
    const url = `${this.apiEndpoint}/route/confirm`;
    const response = await lastValueFrom(
      this.http.post(url, { option: option, rider_names: riderNames, rider_count: riderCount }),
    );
    return response as RoutePlan;
  }

  public async getLatestPlan() {
    const url = `${this.apiEndpoint}/route/latest`;
    const response = await lastValueFrom(this.http.get(url));
    return response as RoutePlan;
  }

  public async getJob(id: number) {
    const url = `${this.apiEndpoint}/job/${id}`;
    const response = await lastValueFrom(this.http.get(url));
    return response as RiderJob;
  }
}
