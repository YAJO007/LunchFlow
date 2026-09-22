import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Customer, Order, Rider, Store, Trip } from '../src/types.ts';

const storePath = resolve(process.cwd(), 'data', 'store.json');

const seed: Store = {
  customers: [
    { id: 'c1', name: 'อรทัย แก้วกาญจน์', phone: '081-248-6190', address: 'หอพักเดอะกรีน ชั้น 2 ห้อง 204', zone: 'กังสดาล', lat: 16.4712, lng: 102.8231 },
    { id: 'c2', name: 'ธนกร พันธ์ดี', phone: '089-364-0271', address: 'คณะวิทยาศาสตร์ อาคาร SC.08', zone: 'มหาวิทยาลัย', lat: 16.4754, lng: 102.8258 },
    { id: 'c3', name: 'กมลชนก วงศ์คำ', phone: '095-674-3108', address: 'ร้านกาแฟ Common Ground', zone: 'หลังมอ', lat: 16.4681, lng: 102.8194 },
    { id: 'c4', name: 'ณัฐวุฒิ ศรีสุข', phone: '086-572-4410', address: 'ตลาด 62 บล็อก B', zone: 'โนนม่วง', lat: 16.4871, lng: 102.8302 },
    { id: 'c5', name: 'พิมพ์ชนก แสงจันทร์', phone: '092-815-9034', address: 'คณะบริหารธุรกิจ ห้องประชุม 3', zone: 'มหาวิทยาลัย', lat: 16.4741, lng: 102.8212 },
    { id: 'c6', name: 'ศุภชัย มั่นคง', phone: '098-407-2236', address: 'หมู่บ้านศรีฐาน บ้านเลขที่ 88/12', zone: 'ศรีฐาน', lat: 16.4558, lng: 102.8108 }
  ],
  orders: [
    { id: 'ORD-2401', customerId: 'c1', boxes: 2, menu: 'ข้าวกะเพราไก่', note: 'ไม่ใส่พริก', payment: 'paid', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD-2402', customerId: 'c2', boxes: 3, menu: 'ข้าวหมูกระเทียม', note: 'รับหน้าอาคาร', payment: 'cash', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD-2403', customerId: 'c3', boxes: 1, menu: 'ข้าวไก่ทอด', note: '', payment: 'paid', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD-2404', customerId: 'c4', boxes: 2, menu: 'ข้าวกะเพราหมู', note: 'โทรก่อนถึง', payment: 'cash', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD-2405', customerId: 'c5', boxes: 3, menu: 'ข้าวผัด', note: 'เพิ่มช้อน 3 ชุด', payment: 'paid', status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD-2406', customerId: 'c6', boxes: 2, menu: 'ข้าวไก่กระเทียม', note: '', payment: 'paid', status: 'pending', createdAt: new Date().toISOString() }
  ],
  riders: [
    { id: 'r1', name: 'นนท์', phone: '089-110-2233', color: '#d94f37' },
    { id: 'r2', name: 'เบส', phone: '086-221-3344', color: '#147d70' },
    { id: 'r3', name: 'มายด์', phone: '095-332-4455', color: '#315ca8' }
  ],
  trips: []
};

let cache: Store | undefined;

export async function readStore(): Promise<Store> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(storePath, 'utf8')) as Store;
  } catch {
    cache = structuredClone(seed);
    await saveStore(cache);
  }
  return cache;
}

export async function saveStore(store: Store): Promise<void> {
  cache = store;
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function customerDistance(a: Customer, b: Customer): number {
  const latKm = (a.lat - b.lat) * 111;
  const lngKm = (a.lng - b.lng) * 106;
  return Math.hypot(latKm, lngKm);
}

export function createTrips(store: Store): Trip[] {
  const pending = store.orders.filter((order) => order.status === 'pending');
  const shop: Customer = { id: 'shop', name: 'ร้าน', phone: '', address: '', zone: '', lat: 16.4732, lng: 102.8217 };
  const remaining = [...pending];
  const groups: Order[][] = [];

  while (remaining.length) {
    const group: Order[] = [];
    let current = shop;
    while (group.length < 3 && remaining.length) {
      remaining.sort((left, right) => {
        const a = store.customers.find((item) => item.id === left.customerId)!;
        const b = store.customers.find((item) => item.id === right.customerId)!;
        return customerDistance(current, a) - customerDistance(current, b);
      });
      const next = remaining.shift()!;
      group.push(next);
      current = store.customers.find((item) => item.id === next.customerId)!;
    }
    groups.push(group);
  }

  return groups.map((orders, index) => {
    let distanceKm = 0;
    let current = shop;
    for (const order of orders) {
      const customer = store.customers.find((item) => item.id === order.customerId)!;
      distanceKm += customerDistance(current, customer);
      current = customer;
    }
    return {
      id: makeId('TRIP'),
      code: `LR-${String(store.trips.length + index + 1).padStart(3, '0')}`,
      riderId: store.riders[index % store.riders.length].id,
      orderIds: orders.map((order) => order.id),
      distanceKm: Number(distanceKm.toFixed(1)),
      etaMinutes: Math.max(12, Math.ceil((distanceKm / 24) * 60 + orders.length * 5)),
      status: 'ready',
      createdAt: new Date().toISOString()
    };
  });
}
