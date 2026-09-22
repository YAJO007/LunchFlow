import './styles.css';
import { createIcons, Bike, Check, ChevronRight, CircleDollarSign, Clock3, LayoutDashboard, Map, MapPin, Menu, PackageCheck, Phone, Plus, Route, Search, Trash2, Users, Utensils, X } from 'lucide';
import type { Customer, Order, Store, Trip } from './types.ts';

type Page = 'dashboard' | 'orders' | 'customers' | 'routes' | 'rider';

const app = document.querySelector<HTMLDivElement>('#app')!;
let store: Store = { customers: [], orders: [], riders: [], trips: [] };
let page: Page = 'dashboard';
let riderTripId = '';
let loading = true;
let toastTimer = 0;

const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
const formatTime = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' });

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }));
    throw new Error(payload.message);
  }
  return response.status === 204 ? undefined as T : response.json();
}

async function refresh(): Promise<void> {
  store = await api<Store>('/api/state');
  riderTripId ||= store.trips.find((trip) => trip.status !== 'completed')?.id ?? store.trips[0]?.id ?? '';
}

function customerOf(order: Order): Customer | undefined {
  return store.customers.find((customer) => customer.id === order.customerId);
}

function orderOf(id: string): Order | undefined {
  return store.orders.find((order) => order.id === id);
}

function safe(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function statusLabel(status: Order['status']): string {
  return { pending: 'รอจัดส่ง', assigned: 'กำลังจัดส่ง', delivered: 'ส่งสำเร็จ' }[status];
}

function tripStatus(status: Trip['status']): string {
  return { ready: 'พร้อมออกส่ง', 'on-route': 'กำลังนำส่ง', completed: 'เสร็จสิ้น' }[status];
}

function icon(name: string, size = 18): string {
  return `<i data-lucide="${name}" width="${size}" height="${size}"></i>`;
}

function render(): void {
  if (loading) {
    app.innerHTML = `<div class="boot"><div class="brand-mark">LR</div><p>กำลังเปิดระบบจัดส่ง...</p></div>`;
    return;
  }

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="brand-mark">LR</div><div><strong>LunchRoute</strong><span>Delivery operations</span></div></div>
        <nav class="nav-list">
          ${navItem('dashboard', 'layout-dashboard', 'ภาพรวมวันนี้')}
          ${navItem('orders', 'utensils', 'ออเดอร์')}
          ${navItem('customers', 'users', 'ลูกค้า')}
          ${navItem('routes', 'route', 'รอบจัดส่ง')}
          ${navItem('rider', 'bike', 'หน้าไรเดอร์')}
        </nav>
        <div class="service-card"><span class="online-dot"></span><div><strong>ระบบพร้อมใช้งาน</strong><small>อัปเดตข้อมูลล่าสุดแล้ว</small></div></div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <button class="icon-button mobile-menu" data-menu aria-label="เปิดเมนู">${icon('menu')}</button>
          <div><p class="date-label">${new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p><h1>${pageTitle()}</h1></div>
          <div class="top-actions"><div class="cutoff"><span>เวลาปิดรอบ</span><strong>11:30 น.</strong></div><button class="button primary" data-new-order>${icon('plus')} รับออเดอร์</button></div>
        </header>
        <main>${renderPage()}</main>
      </div>
    </div>
    <div class="modal-root" id="modal-root"></div>
    <div class="toast" id="toast"></div>
  `;
  createIcons({ icons: { Bike, Check, ChevronRight, CircleDollarSign, Clock3, LayoutDashboard, Map, MapPin, Menu, PackageCheck, Phone, Plus, Route, Search, Trash2, Users, Utensils, X } });
  bindEvents();
}

function navItem(key: Page, iconName: string, label: string): string {
  return `<button class="nav-item ${page === key ? 'active' : ''}" data-page="${key}">${icon(iconName)}<span>${label}</span></button>`;
}

function pageTitle(): string {
  return { dashboard: 'ภาพรวมการจัดส่ง', orders: 'จัดการออเดอร์', customers: 'ข้อมูลลูกค้า', routes: 'รอบและเส้นทางจัดส่ง', rider: 'ใบงานไรเดอร์' }[page];
}

function renderPage(): string {
  if (page === 'orders') return ordersView();
  if (page === 'customers') return customersView();
  if (page === 'routes') return routesView();
  if (page === 'rider') return riderView();
  return dashboardView();
}

function dashboardView(): string {
  const pending = store.orders.filter((order) => order.status === 'pending');
  const assigned = store.orders.filter((order) => order.status === 'assigned');
  const delivered = store.orders.filter((order) => order.status === 'delivered');
  const boxes = store.orders.reduce((sum, order) => sum + order.boxes, 0);
  const revenue = boxes * 65;
  const activeTrips = store.trips.filter((trip) => trip.status !== 'completed');

  return `
    <section class="summary-grid">
      ${summaryCard('ออเดอร์ทั้งหมด', store.orders.length, `${boxes} กล่อง`, 'utensils', 'rust')}
      ${summaryCard('รอจัดรอบ', pending.length, pending.length ? 'ควรจัดรอบก่อน 11:30' : 'จัดรอบครบแล้ว', 'clock-3', 'amber')}
      ${summaryCard('กำลังนำส่ง', assigned.length, `${activeTrips.length} รอบที่เปิดอยู่`, 'bike', 'teal')}
      ${summaryCard('ยอดขายวันนี้', money.format(revenue), `${delivered.length} ออเดอร์ส่งสำเร็จ`, 'circle-dollar-sign', 'blue')}
    </section>
    <section class="dashboard-grid">
      <article class="surface dispatch-panel">
        <div class="section-head"><div><span class="kicker">ศูนย์ควบคุม</span><h2>สถานะรอบส่งวันนี้</h2></div><button class="button ${pending.length ? 'primary' : 'secondary'}" data-dispatch ${pending.length ? '' : 'disabled'}>${icon('route')} ${pending.length ? `จัดรอบ ${pending.length} ออเดอร์` : 'จัดรอบครบแล้ว'}</button></div>
        ${activeTrips.length ? `<div class="trip-progress">${activeTrips.map(tripProgress).join('')}</div>` : emptyState('package-check', 'ยังไม่มีรอบส่ง', 'เมื่อมีออเดอร์ กดจัดรอบเพื่อแบ่งงานให้ไรเดอร์')}
      </article>
      <article class="surface map-surface">
        <div class="section-head"><div><span class="kicker">พื้นที่ให้บริการ</span><h2>เส้นทางปัจจุบัน</h2></div><button class="text-button" data-page="routes">ดูรายละเอียด ${icon('chevron-right', 16)}</button></div>
        ${routeMap(activeTrips)}
      </article>
    </section>
    <section class="surface recent-orders">
      <div class="section-head"><div><span class="kicker">รายการล่าสุด</span><h2>ออเดอร์วันนี้</h2></div><button class="text-button" data-page="orders">ดูทั้งหมด ${icon('chevron-right', 16)}</button></div>
      ${orderTable(store.orders.slice(0, 6))}
    </section>
  `;
}

function summaryCard(label: string, value: string | number, detail: string, iconName: string, tone: string): string {
  return `<article class="summary-card"><div class="summary-icon ${tone}">${icon(iconName, 20)}</div><div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div></article>`;
}

function tripProgress(trip: Trip): string {
  const rider = store.riders.find((item) => item.id === trip.riderId);
  const delivered = trip.orderIds.filter((id) => orderOf(id)?.status === 'delivered').length;
  const percentage = Math.round((delivered / trip.orderIds.length) * 100);
  return `<button class="trip-row" data-trip="${trip.id}" data-page="rider"><span class="rider-avatar" style="--rider:${rider?.color}">${safe(rider?.name.charAt(0))}</span><span class="trip-main"><strong>${trip.code} · ${safe(rider?.name)}</strong><small>${tripStatus(trip.status)} · ${trip.orderIds.length} จุด · ${trip.distanceKm} กม.</small><i><b style="width:${percentage}%"></b></i></span><span class="progress-count">${delivered}/${trip.orderIds.length}</span>${icon('chevron-right', 18)}</button>`;
}

function ordersView(): string {
  return `<section class="surface"><div class="section-head"><div><span class="kicker">${store.orders.length} รายการ</span><h2>ออเดอร์ทั้งหมด</h2></div><div class="toolbar"><label class="search">${icon('search', 17)}<input id="order-search" placeholder="ค้นหาชื่อหรือเลขออเดอร์"></label><button class="button primary" data-new-order>${icon('plus')} เพิ่มออเดอร์</button></div></div><div id="order-table">${orderTable(store.orders)}</div></section>`;
}

function orderTable(orders: Order[]): string {
  if (!orders.length) return emptyState('utensils', 'ยังไม่มีออเดอร์', 'เพิ่มออเดอร์แรกเพื่อเริ่มจัดส่ง');
  return `<div class="data-table"><div class="table-head"><span>ออเดอร์</span><span>ลูกค้า / จุดส่ง</span><span>รายการ</span><span>ชำระเงิน</span><span>สถานะ</span><span></span></div>${orders.map((order) => {
    const customer = customerOf(order);
    return `<div class="table-row"><span><strong>${safe(order.id)}</strong><small>${formatTime.format(new Date(order.createdAt))} น.</small></span><span><strong>${safe(customer?.name)}</strong><small>${safe(customer?.zone)}</small></span><span><strong>${safe(order.menu)}</strong><small>${order.boxes} กล่อง${order.note ? ` · ${safe(order.note)}` : ''}</small></span><span><strong>${order.payment === 'paid' ? 'โอนแล้ว' : 'เงินสด'}</strong><small>${money.format(order.boxes * 65)}</small></span><span><b class="status ${order.status}">${statusLabel(order.status)}</b></span><span>${order.status === 'pending' ? `<button class="icon-button danger" data-delete-order="${order.id}" title="ลบออเดอร์">${icon('trash-2', 17)}</button>` : ''}</span></div>`;
  }).join('')}</div>`;
}

function customersView(): string {
  return `<section class="surface"><div class="section-head"><div><span class="kicker">ฐานข้อมูลลูกค้า</span><h2>ลูกค้า ${store.customers.length} ราย</h2></div><button class="button primary" data-new-customer>${icon('plus')} เพิ่มลูกค้า</button></div><div class="customer-grid">${store.customers.map((customer) => {
    const orderCount = store.orders.filter((order) => order.customerId === customer.id).length;
    return `<article class="customer-card"><div class="customer-top"><span class="customer-avatar">${safe(customer.name.charAt(0))}</span><span><strong>${safe(customer.name)}</strong><small>${safe(customer.zone)}</small></span>${!orderCount ? `<button class="icon-button danger" data-delete-customer="${customer.id}" title="ลบลูกค้า">${icon('trash-2', 16)}</button>` : ''}</div><p>${icon('map-pin', 16)} ${safe(customer.address)}</p><p>${icon('phone', 16)} ${safe(customer.phone)}</p><div class="customer-foot"><span>${orderCount} ออเดอร์</span><a href="https://www.google.com/maps?q=${customer.lat},${customer.lng}" target="_blank" rel="noreferrer">เปิดแผนที่ ${icon('chevron-right', 14)}</a></div></article>`;
  }).join('')}</div></section>`;
}

function routesView(): string {
  return `<section class="route-page"><article class="surface route-map-panel"><div class="section-head"><div><span class="kicker">วางแผนอัตโนมัติ</span><h2>แผนที่รอบส่ง</h2></div><button class="button primary" data-dispatch ${store.orders.some((order) => order.status === 'pending') ? '' : 'disabled'}>${icon('route')} จัดออเดอร์ค้างรอบ</button></div>${routeMap(store.trips)}</article><aside class="surface trip-list"><div class="section-head"><div><span class="kicker">${store.trips.length} รอบ</span><h2>งานไรเดอร์</h2></div></div>${store.trips.length ? store.trips.map(tripCard).join('') : emptyState('route', 'ยังไม่มีรอบส่ง', 'เพิ่มออเดอร์และกดจัดรอบ')}</aside></section>`;
}

function tripCard(trip: Trip): string {
  const rider = store.riders.find((item) => item.id === trip.riderId);
  return `<button class="trip-card" style="--rider:${rider?.color}" data-trip="${trip.id}" data-page="rider"><div><span class="rider-avatar">${safe(rider?.name.charAt(0))}</span><span><strong>${trip.code}</strong><small>${safe(rider?.name)} · ${tripStatus(trip.status)}</small></span><b>${trip.orderIds.length} จุด</b></div><div class="trip-meta"><span>${trip.distanceKm} กม.</span><span>ประมาณ ${trip.etaMinutes} นาที</span></div></button>`;
}

function routeMap(trips: Trip[]): string {
  const customers = trips.flatMap((trip) => trip.orderIds.map((id) => orderOf(id)).filter(Boolean).map((order) => customerOf(order!)).filter(Boolean)) as Customer[];
  if (!customers.length) return `<div class="map-empty">${icon('map', 28)}<span>เส้นทางจะแสดงหลังจัดรอบส่ง</span></div>`;
  const minLat = Math.min(...customers.map((item) => item.lat), 16.4732) - .004;
  const maxLat = Math.max(...customers.map((item) => item.lat), 16.4732) + .004;
  const minLng = Math.min(...customers.map((item) => item.lng), 102.8217) - .004;
  const maxLng = Math.max(...customers.map((item) => item.lng), 102.8217) + .004;
  const point = (lat: number, lng: number) => ({ x: 8 + ((lng - minLng) / (maxLng - minLng)) * 84, y: 92 - ((lat - minLat) / (maxLat - minLat)) * 84 });
  const shop = point(16.4732, 102.8217);
  const routes = trips.map((trip) => {
    const rider = store.riders.find((item) => item.id === trip.riderId);
    const points = [shop, ...trip.orderIds.map((id) => customerOf(orderOf(id)!)).filter(Boolean).map((customer) => point(customer!.lat, customer!.lng))];
    return `<polyline points="${points.map((item) => `${item.x},${item.y}`).join(' ')}" style="--route:${rider?.color}"/><circle cx="${points.at(-1)?.x}" cy="${points.at(-1)?.y}" r="2.2" fill="${rider?.color}"/>`;
  }).join('');
  const pins = customers.map((customer) => { const p = point(customer.lat, customer.lng); return `<circle class="customer-pin" cx="${p.x}" cy="${p.y}" r="1.8"><title>${safe(customer.name)}</title></circle>`; }).join('');
  return `<div class="map-wrap"><svg class="route-map" viewBox="0 0 100 100" role="img" aria-label="แผนที่เส้นทางจัดส่ง"><path class="street" d="M-5 28 Q22 20 46 31 T105 23 M-5 72 Q25 61 48 73 T105 66 M24 -5 Q19 35 31 55 T26 105 M72 -5 Q63 28 75 53 T69 105"/><path class="street thin" d="M0 48 L100 43 M46 0 L52 100"/>${routes}${pins}<circle class="shop-pin" cx="${shop.x}" cy="${shop.y}" r="3.4"/><text x="${shop.x + 4}" y="${shop.y + 1}">ร้าน</text></svg><div class="map-legend">${trips.map((trip) => { const rider = store.riders.find((item) => item.id === trip.riderId); return `<span><i style="background:${rider?.color}"></i>${safe(rider?.name)}</span>`; }).join('')}</div></div>`;
}

function riderView(): string {
  const trip = store.trips.find((item) => item.id === riderTripId) ?? store.trips[0];
  return `<section class="rider-layout"><aside class="surface trip-selector"><span class="kicker">เลือกรอบส่ง</span><h2>ใบงานวันนี้</h2>${store.trips.length ? store.trips.map((item) => `<button class="selector-item ${item.id === trip?.id ? 'active' : ''}" data-select-trip="${item.id}"><span><strong>${item.code}</strong><small>${tripStatus(item.status)}</small></span><b>${item.orderIds.length} จุด</b></button>`).join('') : emptyState('bike', 'ยังไม่มีใบงาน', 'จัดรอบส่งก่อนเปิดหน้าไรเดอร์')}</aside>${trip ? riderTicket(trip) : ''}</section>`;
}

function riderTicket(trip: Trip): string {
  const rider = store.riders.find((item) => item.id === trip.riderId);
  const completed = trip.orderIds.filter((id) => orderOf(id)?.status === 'delivered').length;
  const nextOrder = trip.orderIds.map(orderOf).find((order) => order?.status !== 'delivered');
  const nextCustomer = nextOrder ? customerOf(nextOrder) : undefined;
  return `<article class="rider-phone"><header><div><span>ใบงาน ${trip.code}</span><h2>สวัสดี ${safe(rider?.name)}</h2></div><span class="rider-avatar" style="--rider:${rider?.color}">${safe(rider?.name.charAt(0))}</span></header><div class="rider-summary"><div><strong>${completed}/${trip.orderIds.length}</strong><span>ส่งสำเร็จ</span></div><div><strong>${trip.distanceKm}</strong><span>กิโลเมตร</span></div><div><strong>${trip.etaMinutes}</strong><span>นาทีโดยประมาณ</span></div></div>${nextCustomer ? `<a class="navigate-button" href="https://www.google.com/maps/dir/?api=1&destination=${nextCustomer.lat},${nextCustomer.lng}" target="_blank" rel="noreferrer">${icon('map-pin')} นำทางไปจุดถัดไป</a>` : `<div class="complete-banner">${icon('check')} ส่งครบทุกจุดแล้ว</div>`}<div class="stop-list">${trip.orderIds.map((id, index) => riderStop(trip, id, index)).join('')}</div>${trip.status === 'ready' ? `<button class="button rider-start" data-start-trip="${trip.id}">${icon('bike')} เริ่มออกส่ง</button>` : ''}</article>`;
}

function riderStop(trip: Trip, orderId: string, index: number): string {
  const order = orderOf(orderId)!;
  const customer = customerOf(order)!;
  const done = order.status === 'delivered';
  return `<div class="stop-item ${done ? 'done' : ''}"><span class="stop-index">${done ? icon('check', 16) : index + 1}</span><div><strong>${safe(customer.name)}</strong><p>${safe(customer.address)}</p><small>${order.boxes} กล่อง · ${safe(order.menu)}${order.note ? ` · ${safe(order.note)}` : ''}</small><div class="stop-actions"><a href="tel:${safe(customer.phone)}">${icon('phone', 15)} โทร</a><a href="https://www.google.com/maps?q=${customer.lat},${customer.lng}" target="_blank" rel="noreferrer">${icon('map-pin', 15)} แผนที่</a>${!done ? `<button data-deliver="${order.id}" data-trip-id="${trip.id}">${icon('package-check', 15)} ส่งสำเร็จ</button>` : '<b>ส่งแล้ว</b>'}</div></div></div>`;
}

function emptyState(iconName: string, title: string, detail: string): string {
  return `<div class="empty-state">${icon(iconName, 26)}<strong>${title}</strong><span>${detail}</span></div>`;
}

function orderModal(): string {
  return `<div class="modal-backdrop"><form class="modal" id="order-form"><div class="modal-head"><div><span class="kicker">ออเดอร์ใหม่</span><h2>รับรายการอาหาร</h2></div><button type="button" class="icon-button" data-close>${icon('x')}</button></div><label>ลูกค้า<select name="customerId" required><option value="">เลือกลูกค้า</option>${store.customers.map((customer) => `<option value="${customer.id}">${safe(customer.name)} · ${safe(customer.zone)}</option>`).join('')}</select></label><div class="form-grid"><label>เมนูอาหาร<input name="menu" placeholder="เช่น ข้าวกะเพราไก่" required></label><label>จำนวนกล่อง<input name="boxes" type="number" min="1" max="50" value="1" required></label></div><div class="form-grid"><label>การชำระเงิน<select name="payment"><option value="paid">โอนแล้ว</option><option value="cash">เก็บเงินสด</option></select></label><label>หมายเหตุ<input name="note" placeholder="เช่น ไม่ใส่พริก"></label></div><div class="modal-actions"><button type="button" class="button secondary" data-close>ยกเลิก</button><button class="button primary" type="submit">บันทึกออเดอร์</button></div></form></div>`;
}

function customerModal(): string {
  return `<div class="modal-backdrop"><form class="modal" id="customer-form"><div class="modal-head"><div><span class="kicker">ลูกค้าใหม่</span><h2>เพิ่มข้อมูลจุดส่ง</h2></div><button type="button" class="icon-button" data-close>${icon('x')}</button></div><div class="form-grid"><label>ชื่อ-นามสกุล<input name="name" required></label><label>เบอร์โทร<input name="phone" type="tel" required></label></div><label>ที่อยู่จัดส่ง<input name="address" required></label><label>โซน / จุดสังเกต<input name="zone" required></label><div class="form-grid"><label>ละติจูด<input name="lat" type="number" step="any" value="16.4732" required></label><label>ลองจิจูด<input name="lng" type="number" step="any" value="102.8217" required></label></div><p class="form-help">เปิด Google Maps แล้วคลิกขวาที่จุดส่งเพื่อคัดลอกพิกัด</p><div class="modal-actions"><button type="button" class="button secondary" data-close>ยกเลิก</button><button class="button primary" type="submit">เพิ่มลูกค้า</button></div></form></div>`;
}

function showModal(content: string): void {
  document.querySelector('#modal-root')!.innerHTML = content;
  createIcons({ icons: { X } });
  bindModalEvents();
}

function closeModal(): void {
  document.querySelector('#modal-root')!.innerHTML = '';
}

function showToast(message: string, error = false): void {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${error ? 'error' : ''}`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.className = 'toast', 2800);
}

async function act(task: () => Promise<unknown>, success: string): Promise<void> {
  try {
    await task();
    await refresh();
    render();
    showToast(success);
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด', true);
  }
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-page]').forEach((element) => element.addEventListener('click', () => {
    page = element.dataset.page as Page;
    if (element.dataset.trip) riderTripId = element.dataset.trip;
    render();
  }));
  document.querySelector('[data-menu]')?.addEventListener('click', () => document.querySelector('#sidebar')?.classList.toggle('open'));
  document.querySelectorAll('[data-new-order]').forEach((button) => button.addEventListener('click', () => showModal(orderModal())));
  document.querySelector('[data-new-customer]')?.addEventListener('click', () => showModal(customerModal()));
  document.querySelectorAll('[data-dispatch]').forEach((button) => button.addEventListener('click', () => act(() => api('/api/dispatch', { method: 'POST' }), 'จัดรอบส่งและมอบหมายไรเดอร์แล้ว')));
  document.querySelectorAll<HTMLElement>('[data-select-trip]').forEach((button) => button.addEventListener('click', () => { riderTripId = button.dataset.selectTrip!; render(); }));
  document.querySelectorAll<HTMLElement>('[data-start-trip]').forEach((button) => button.addEventListener('click', () => act(() => api(`/api/trips/${button.dataset.startTrip}/start`, { method: 'PATCH' }), 'เริ่มรอบส่งแล้ว')));
  document.querySelectorAll<HTMLElement>('[data-deliver]').forEach((button) => button.addEventListener('click', () => act(() => api(`/api/trips/${button.dataset.tripId}/deliver/${button.dataset.deliver}`, { method: 'PATCH' }), 'บันทึกว่าส่งสำเร็จแล้ว')));
  document.querySelectorAll<HTMLElement>('[data-delete-order]').forEach((button) => button.addEventListener('click', () => act(() => api(`/api/orders/${button.dataset.deleteOrder}`, { method: 'DELETE' }), 'ลบออเดอร์แล้ว')));
  document.querySelectorAll<HTMLElement>('[data-delete-customer]').forEach((button) => button.addEventListener('click', () => act(() => api(`/api/customers/${button.dataset.deleteCustomer}`, { method: 'DELETE' }), 'ลบข้อมูลลูกค้าแล้ว')));
  document.querySelector<HTMLInputElement>('#order-search')?.addEventListener('input', (event) => {
    const query = (event.currentTarget as HTMLInputElement).value.trim().toLowerCase();
    const results = store.orders.filter((order) => `${order.id} ${customerOf(order)?.name} ${order.menu}`.toLowerCase().includes(query));
    document.querySelector('#order-table')!.innerHTML = orderTable(results);
    createIcons({ icons: { Trash2, Utensils } });
  });
}

function bindModalEvents(): void {
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closeModal));
  document.querySelector('#order-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement));
    closeModal();
    void act(() => api('/api/orders', { method: 'POST', body: JSON.stringify(values) }), 'เพิ่มออเดอร์แล้ว');
  });
  document.querySelector('#customer-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement));
    closeModal();
    void act(() => api('/api/customers', { method: 'POST', body: JSON.stringify({ ...values, lat: Number(values.lat), lng: Number(values.lng) }) }), 'เพิ่มลูกค้าแล้ว');
  });
}

void (async () => {
  try {
    await refresh();
  } catch {
    app.innerHTML = `<div class="boot error-screen"><div class="brand-mark">LR</div><h1>เชื่อมต่อระบบไม่ได้</h1><p>ตรวจสอบว่า API ทำงานอยู่ แล้วรีเฟรชหน้าอีกครั้ง</p></div>`;
    return;
  }
  loading = false;
  render();
})();
