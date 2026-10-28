import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Api {
  public readonly API_ENDPOINT: string = 'https://lunchflow-u723.onrender.com';
}
