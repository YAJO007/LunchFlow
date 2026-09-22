import type { Customer, Order, Store, Trip } from '../types.ts';
import { escapeHtml, formatMoney, formatTime, orderStatusLabel } from '../lib/format.ts';
import { customerForOrder, findOrder, findRider } from '../lib/store.ts';
import { icon } from '../ui/icons.ts';

export function emptyState(iconName: string, title: string, detail: string): string {
  return `<div class="empty-state">${icon(iconName, 26)}<strong>${title}</strong><span>${detail}</span></div>`;
}

export function orderTable(store: Store, orders: Order[]): string {
  if (!orders.length) return emptyState('utensils', 'ยังไม่มีออเดอร์', 'เพิ่มออเดอร์แรกเพื่อเริ่มจัดส่ง');

  const rows = orders.map((order) => {
    const customer = customerForOrder(store, order);
    const note = order.note ? ` · ${escapeHtml(order.note)}` : '';
    const deleteButton = order.status === 'pending'
      ? `<button class="icon-button danger" data-delete-order="${order.id}" title="ลบออเดอร์">${icon('trash-2', 17)}</button>`
      : '';

    return `
      <div class="table-row">
        <span><strong>${escapeHtml(order.id)}</strong><small>${formatTime(order.createdAt)}</small></span>
        <span><strong>${escapeHtml(customer?.name)}</strong><small>${escapeHtml(customer?.zone)}</small></span>
        <span><strong>${escapeHtml(order.menu)}</strong><small>${order.boxes} กล่อง${note}</small></span>
        <span><strong>${order.payment === 'paid' ? 'โอนแล้ว' : 'เงินสด'}</strong><small>${formatMoney(order.boxes * 65)}</small></span>
        <span><b class="status ${order.status}">${orderStatusLabel[order.status]}</b></span>
        <span>${deleteButton}</span>
      </div>`;
  }).join('');

  return `
    <div class="data-table">
      <div class="table-head"><span>ออเดอร์</span><span>ลูกค้า / จุดส่ง</span><span>รายการ</span><span>ชำระเงิน</span><span>สถานะ</span><span></span></div>
      ${rows}
    </div>`;
}

const SHOP = { lat: 16.4732, lng: 102.8217 };

export function routeMap(store: Store, trips: Trip[]): string {
  const customers = collectTripCustomers(store, trips);
  if (!customers.length) {
    return `<div class="map-empty">${icon('map', 28)}<span>เส้นทางจะแสดงหลังจัดรอบส่ง</span></div>`;
  }

  const bounds = mapBounds(customers);
  const project = (lat: number, lng: number) => ({
    x: 8 + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 84,
    y: 92 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 84
  });
  const shopPoint = project(SHOP.lat, SHOP.lng);

  const routeLines = trips.map((trip) => {
    const rider = findRider(store, trip.riderId);
    const points = [
      shopPoint,
      ...trip.orderIds
        .map((id) => findOrder(store, id))
        .filter((order): order is Order => Boolean(order))
        .map((order) => customerForOrder(store, order))
        .filter((customer): customer is Customer => Boolean(customer))
        .map((customer) => project(customer.lat, customer.lng))
    ];
    const coordinates = points.map((point) => `${point.x},${point.y}`).join(' ');
    const last = points.at(-1)!;
    return `<polyline points="${coordinates}" style="--route:${rider?.color}"/><circle cx="${last.x}" cy="${last.y}" r="2.2" fill="${rider?.color}"/>`;
  }).join('');

  const pins = customers.map((customer) => {
    const point = project(customer.lat, customer.lng);
    return `<circle class="customer-pin" cx="${point.x}" cy="${point.y}" r="1.8"><title>${escapeHtml(customer.name)}</title></circle>`;
  }).join('');

  const legend = trips.map((trip) => {
    const rider = findRider(store, trip.riderId);
    return `<span><i style="background:${rider?.color}"></i>${escapeHtml(rider?.name)}</span>`;
  }).join('');

  return `
    <div class="map-wrap">
      <svg class="route-map" viewBox="0 0 100 100" role="img" aria-label="แผนที่เส้นทางจัดส่ง">
        <path class="street" d="M-5 28 Q22 20 46 31 T105 23 M-5 72 Q25 61 48 73 T105 66 M24 -5 Q19 35 31 55 T26 105 M72 -5 Q63 28 75 53 T69 105"/>
        <path class="street thin" d="M0 48 L100 43 M46 0 L52 100"/>
        ${routeLines}${pins}
        <circle class="shop-pin" cx="${shopPoint.x}" cy="${shopPoint.y}" r="3.4"/>
        <text x="${shopPoint.x + 4}" y="${shopPoint.y + 1}">ร้าน</text>
      </svg>
      <div class="map-legend">${legend}</div>
    </div>`;
}

function collectTripCustomers(store: Store, trips: Trip[]): Customer[] {
  return trips.flatMap((trip) => trip.orderIds
    .map((id) => findOrder(store, id))
    .filter((order): order is Order => Boolean(order))
    .map((order) => customerForOrder(store, order))
    .filter((customer): customer is Customer => Boolean(customer))
  );
}

function mapBounds(customers: Customer[]) {
  return {
    minLat: Math.min(...customers.map((customer) => customer.lat), SHOP.lat) - 0.004,
    maxLat: Math.max(...customers.map((customer) => customer.lat), SHOP.lat) + 0.004,
    minLng: Math.min(...customers.map((customer) => customer.lng), SHOP.lng) - 0.004,
    maxLng: Math.max(...customers.map((customer) => customer.lng), SHOP.lng) + 0.004
  };
}
