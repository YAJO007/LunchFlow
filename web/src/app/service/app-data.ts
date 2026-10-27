import { Injectable, signal } from '@angular/core';
import { DEFAULT_SHOP } from '../config/shop';
import { Shop } from '../model/shop';

// ข้อมูลที่ทุกหน้าใช้ร่วมกัน (ตามบท Data Sharing)
@Injectable({
  providedIn: 'root',
})
export class AppData {
  shop = signal<Shop>(DEFAULT_SHOP);

  isLoggedIn(): boolean {
    return sessionStorage.getItem('owner') === 'owner';
  }

  login(username: string, password: string): boolean {
    if (username === 'owner' && password === '1234') {
      sessionStorage.setItem('owner', username);
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem('owner');
  }
}
