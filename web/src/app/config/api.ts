import { Injectable } from '@angular/core';

// ที่อยู่ของ Web API (ตามบท Api Endpoint)
@Injectable({
  providedIn: 'root',
})
export class Api {
  public readonly API_ENDPOINT: string = 'https://lunchflow-u723.onrender.com';
}
