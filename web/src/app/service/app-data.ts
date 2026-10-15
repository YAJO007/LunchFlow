import { Injectable, signal } from '@angular/core';
import { DEFAULT_SHOP } from '../config/shop';
import { Rider } from '../model/rider';
import { Shop } from '../model/shop';

const DEFAULT_RIDERS: Rider[] = [
  { no: 1, name: 'สมศักดิ์ ใจดี', phone: '0811111111', available: true },
  { no: 2, name: 'วิชัย มีสุข', phone: '0822222222', available: true },
  { no: 3, name: 'อนุชา แสนดี', phone: '0833333333', available: true },
  { no: 4, name: 'ประยุทธ ขยัน', phone: '0844444444', available: true },
  { no: 5, name: 'ธนพล รักงาน', phone: '0855555555', available: true },
  { no: 6, name: 'กิตติ ว่องไว', phone: '0866666666', available: true },
  { no: 7, name: 'สุริยา ทองดี', phone: '0877777777', available: true },
  { no: 8, name: 'ณัฐพล บุญมา', phone: '0888888888', available: true },
  { no: 9, name: 'พงศกร ศรีสุข', phone: '0899999999', available: true },
  { no: 10, name: 'อภิชาติ คำดี', phone: '0810101010', available: true },
];

@Injectable({
  providedIn: 'root',
})
export class AppData {
  shop = signal<Shop>(DEFAULT_SHOP);
  riders = signal<Rider[]>(DEFAULT_RIDERS);

  constructor() {
    if (localStorage.getItem('riders')) {
      this.riders.set(JSON.parse(localStorage.getItem('riders')!));
    }
  }

  saveRiders(riders: Rider[]) {
    this.riders.set(riders);
    localStorage.setItem('riders', JSON.stringify(riders));
  }

  resetRiders() {
    this.saveRiders(DEFAULT_RIDERS);
  }

  availableRiders(): Rider[] {
    return this.riders().filter((r) => r.available);
  }

  riderOf(riderNo: number): Rider | undefined {
    return this.availableRiders()[riderNo - 1];
  }

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

  deliveredOf(jobId: number): number[] {
    const saved = localStorage.getItem('delivered-' + jobId);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  }

  saveDelivered(jobId: number, stopNos: number[]) {
    localStorage.setItem('delivered-' + jobId, JSON.stringify(stopNos));
  }
}
