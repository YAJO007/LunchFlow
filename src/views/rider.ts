import type { Order, Store, Trip } from '../types.ts';
import { escapeHtml, tripStatusLabel } from '../lib/format.ts';
import { customerForOrder, findOrder, findRider } from '../lib/store.ts';
import { icon } from '../ui/icons.ts';
import { emptyState } from './shared.ts';

export function riderView(store: Store, selectedTripId: string): string {
  const selectedTrip = store.trips.find((trip) => trip.id === selectedTripId) ?? store.trips[0];
  const selector = store.trips.length
    ? store.trips.map((trip) => selectorItem(trip, selectedTrip?.id)).join('')
    : emptyState('bike', 'ยังไม่มีใบงาน', 'จัดรอบส่งก่อนเปิดหน้าไรเดอร์');

  return `
    <section class="rider-layout">
      <aside class="surface trip-selector">
        <span class="kicker">เลือกรอบส่ง</span><h2>ใบงานวันนี้</h2>${selector}
      </aside>
      ${selectedTrip ? riderTicket(store, selectedTrip) : ''}
    </section>`;
}

function selectorItem(trip: Trip, selectedTripId?: string): string {
  return `
    <button class="selector-item ${trip.id === selectedTripId ? 'active' : ''}" data-select-trip="${trip.id}">
      <span><strong>${trip.code}</strong><small>${tripStatusLabel[trip.status]}</small></span>
      <b>${trip.orderIds.length} จุด</b>
    </button>`;
}

function riderTicket(store: Store, trip: Trip): string {
  const rider = findRider(store, trip.riderId);
  const orders = trip.orderIds.map((id) => findOrder(store, id)).filter((order): order is Order => Boolean(order));
  const completedCount = orders.filter((order) => order.status === 'delivered').length;
  const nextOrder = orders.find((order) => order.status !== 'delivered');
  const nextCustomer = nextOrder ? customerForOrder(store, nextOrder) : undefined;

  const navigation = nextCustomer
    ? `<a class="navigate-button" href="https://www.google.com/maps/dir/?api=1&destination=${nextCustomer.lat},${nextCustomer.lng}" target="_blank" rel="noreferrer">${icon('map-pin')} นำทางไปจุดถัดไป</a>`
    : `<div class="complete-banner">${icon('check')} ส่งครบทุกจุดแล้ว</div>`;

  return `
    <article class="rider-phone">
      <header>
        <div><span>ใบงาน ${trip.code}</span><h2>สวัสดี ${escapeHtml(rider?.name)}</h2></div>
        <span class="rider-avatar" style="--rider:${rider?.color}">${escapeHtml(rider?.name.charAt(0))}</span>
      </header>
      <div class="rider-summary">
        <div><strong>${completedCount}/${orders.length}</strong><span>ส่งสำเร็จ</span></div>
        <div><strong>${trip.distanceKm}</strong><span>กิโลเมตร</span></div>
        <div><strong>${trip.etaMinutes}</strong><span>นาทีโดยประมาณ</span></div>
      </div>
      ${navigation}
      <div class="stop-list">${orders.map((order, index) => riderStop(store, trip, order, index)).join('')}</div>
      ${trip.status === 'ready' ? `<button class="button rider-start" data-start-trip="${trip.id}">${icon('bike')} เริ่มออกส่ง</button>` : ''}
    </article>`;
}

function riderStop(store: Store, trip: Trip, order: Order, index: number): string {
  const customer = customerForOrder(store, order);
  if (!customer) return '';

  const delivered = order.status === 'delivered';
  const note = order.note ? ` · ${escapeHtml(order.note)}` : '';
  const deliveryAction = delivered
    ? '<b>ส่งแล้ว</b>'
    : `<button data-deliver="${order.id}" data-trip-id="${trip.id}">${icon('package-check', 15)} ส่งสำเร็จ</button>`;

  return `
    <div class="stop-item ${delivered ? 'done' : ''}">
      <span class="stop-index">${delivered ? icon('check', 16) : index + 1}</span>
      <div>
        <strong>${escapeHtml(customer.name)}</strong>
        <p>${escapeHtml(customer.address)}</p>
        <small>${order.boxes} กล่อง · ${escapeHtml(order.menu)}${note}</small>
        <div class="stop-actions">
          <a href="tel:${escapeHtml(customer.phone)}">${icon('phone', 15)} โทร</a>
          <a href="https://www.google.com/maps?q=${customer.lat},${customer.lng}" target="_blank" rel="noreferrer">${icon('map-pin', 15)} แผนที่</a>
          ${deliveryAction}
        </div>
      </div>
    </div>`;
}
