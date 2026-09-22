import type { Store, Trip } from '../types.ts';
import { escapeHtml, formatMoney, tripStatusLabel } from '../lib/format.ts';
import { findOrder, findRider } from '../lib/store.ts';
import { icon } from '../ui/icons.ts';
import { emptyState, orderTable, routeMap } from './shared.ts';

export function dashboardView(store: Store): string {
  const pendingOrders = store.orders.filter((order) => order.status === 'pending');
  const assignedOrders = store.orders.filter((order) => order.status === 'assigned');
  const deliveredOrders = store.orders.filter((order) => order.status === 'delivered');
  const activeTrips = store.trips.filter((trip) => trip.status !== 'completed');
  const totalBoxes = store.orders.reduce((sum, order) => sum + order.boxes, 0);

  return `
    <section class="summary-grid">
      ${summaryCard('ออเดอร์ทั้งหมด', store.orders.length, `${totalBoxes} กล่อง`, 'utensils', 'rust')}
      ${summaryCard('รอจัดรอบ', pendingOrders.length, pendingOrders.length ? 'ควรจัดรอบก่อน 11:30' : 'จัดรอบครบแล้ว', 'clock-3', 'amber')}
      ${summaryCard('กำลังนำส่ง', assignedOrders.length, `${activeTrips.length} รอบที่เปิดอยู่`, 'bike', 'teal')}
      ${summaryCard('ยอดขายวันนี้', formatMoney(totalBoxes * 65), `${deliveredOrders.length} ออเดอร์ส่งสำเร็จ`, 'circle-dollar-sign', 'blue')}
    </section>
    <section class="dashboard-grid">
      <article class="surface dispatch-panel">
        <div class="section-head">
          <div><span class="kicker">ศูนย์ควบคุม</span><h2>สถานะรอบส่งวันนี้</h2></div>
          <button class="button ${pendingOrders.length ? 'primary' : 'secondary'}" data-dispatch ${pendingOrders.length ? '' : 'disabled'}>
            ${icon('route')} ${pendingOrders.length ? `จัดรอบ ${pendingOrders.length} ออเดอร์` : 'จัดรอบครบแล้ว'}
          </button>
        </div>
        ${activeTrips.length
          ? `<div class="trip-progress">${activeTrips.map((trip) => tripProgress(store, trip)).join('')}</div>`
          : emptyState('package-check', 'ยังไม่มีรอบส่ง', 'เมื่อมีออเดอร์ กดจัดรอบเพื่อแบ่งงานให้ไรเดอร์')}
      </article>
      <article class="surface map-surface">
        <div class="section-head">
          <div><span class="kicker">พื้นที่ให้บริการ</span><h2>เส้นทางปัจจุบัน</h2></div>
          <button class="text-button" data-page="routes">ดูรายละเอียด ${icon('chevron-right', 16)}</button>
        </div>
        ${routeMap(store, activeTrips)}
      </article>
    </section>
    <section class="surface recent-orders">
      <div class="section-head">
        <div><span class="kicker">รายการล่าสุด</span><h2>ออเดอร์วันนี้</h2></div>
        <button class="text-button" data-page="orders">ดูทั้งหมด ${icon('chevron-right', 16)}</button>
      </div>
      ${orderTable(store, store.orders.slice(0, 6))}
    </section>`;
}

function summaryCard(label: string, value: string | number, detail: string, iconName: string, tone: string): string {
  return `<article class="summary-card"><div class="summary-icon ${tone}">${icon(iconName, 20)}</div><div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div></article>`;
}

function tripProgress(store: Store, trip: Trip): string {
  const rider = findRider(store, trip.riderId);
  const deliveredCount = trip.orderIds.filter((id) => findOrder(store, id)?.status === 'delivered').length;
  const percentage = Math.round((deliveredCount / trip.orderIds.length) * 100);

  return `
    <button class="trip-row" data-trip="${trip.id}" data-page="rider">
      <span class="rider-avatar" style="--rider:${rider?.color}">${escapeHtml(rider?.name.charAt(0))}</span>
      <span class="trip-main">
        <strong>${trip.code} · ${escapeHtml(rider?.name)}</strong>
        <small>${tripStatusLabel[trip.status]} · ${trip.orderIds.length} จุด · ${trip.distanceKm} กม.</small>
        <i><b style="width:${percentage}%"></b></i>
      </span>
      <span class="progress-count">${deliveredCount}/${trip.orderIds.length}</span>${icon('chevron-right', 18)}
    </button>`;
}
