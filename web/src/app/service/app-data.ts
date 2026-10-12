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
  riders = signal<Rider[]>([]);

  constructor() {
    let riders = DEFAULT_RIDERS;
    if (localStorage.getItem('riders')) {
      try {
        const saved = JSON.parse(localStorage.getItem('riders')!);
        if (Array.isArray(saved) && saved.every((r: any) => r &&
          Number.isSafeInteger(r.no) && r.no > 0 && typeof r.name === 'string' &&
          typeof r.phone === 'string' && typeof r.available === 'boolean') &&
          new Set(saved.map((r: Rider) => r.no)).size === saved.length) {
          riders = saved;
        }
      } catch (error) {
      }
    }
    this.riders.set(riders);
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
    const key = 'delivered-' + jobId;
    if (localStorage.getItem(key)) {
      try {
        const saved = JSON.parse(localStorage.getItem(key)!);
        return Array.isArray(saved)
          ? [...new Set<number>(saved.filter((no: any) => Number.isSafeInteger(no) && no > 0))]
          : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  saveDelivered(jobId: number, orderIds: number[]) {
    localStorage.setItem('delivered-' + jobId, JSON.stringify(orderIds));
  }

  recentJobs(): string[] {
    try {
      const saved = JSON.parse(localStorage.getItem('recentJobs') || '[]');
      return Array.isArray(saved)
        ? [...new Set<string>(saved.filter((no: any) => typeof no === 'string' && /^[1-9][0-9]*$/.test(no)))].slice(0, 5)
        : [];
    } catch (error) {
      return [];
    }
  }

  draftOption(): number | null {
    if (sessionStorage.getItem('draftOption')) {
      const option = Number(sessionStorage.getItem('draftOption'));
      return Number.isSafeInteger(option) && option >= 0 ? option : null;
    }
    return null;
  }

  saveDraftOption(option: number | null) {
    if (option === null) {
      sessionStorage.removeItem('draftOption');
    } else {
      sessionStorage.setItem('draftOption', String(option));
    }
  }
}
