import type { Store, Trip } from '../types.ts';
import { escapeHtml, tripStatusLabel } from '../lib/format.ts';
import { findRider } from '../lib/store.ts';
import { icon } from '../ui/icons.ts';
import { emptyState, routeMap } from './shared.ts';

export function routesView(store: Store): string {
  const canDispatch = store.orders.some((order) => order.status === 'pending');
  const tripList = store.trips.length
    ? store.trips.map((trip) => tripCard(store, trip)).join('')
    : emptyState('route', 'ยังไม่มีรอบส่ง', 'เพิ่มออเดอร์และกดจัดรอบ');

  return `
    <section class="route-page">
      <article class="surface route-map-panel">
        <div class="section-head">
          <div><span class="kicker">วางแผนอัตโนมัติ</span><h2>แผนที่รอบส่ง</h2></div>
          <button class="button primary" data-dispatch ${canDispatch ? '' : 'disabled'}>${icon('route')} จัดออเดอร์ค้างรอบ</button>
        </div>
        ${routeMap(store, store.trips)}
      </article>
      <aside class="surface trip-list">
        <div class="section-head"><div><span class="kicker">${store.trips.length} รอบ</span><h2>งานไรเดอร์</h2></div></div>
        ${tripList}
      </aside>
    </section>`;
}

function tripCard(store: Store, trip: Trip): string {
  const rider = findRider(store, trip.riderId);
  return `
    <button class="trip-card" style="--rider:${rider?.color}" data-trip="${trip.id}" data-page="rider">
      <div>
        <span class="rider-avatar">${escapeHtml(rider?.name.charAt(0))}</span>
        <span><strong>${trip.code}</strong><small>${escapeHtml(rider?.name)} · ${tripStatusLabel[trip.status]}</small></span>
        <b>${trip.orderIds.length} จุด</b>
      </div>
      <div class="trip-meta"><span>${trip.distanceKm} กม.</span><span>ประมาณ ${trip.etaMinutes} นาที</span></div>
    </button>`;
}
