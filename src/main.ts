import './styles.css';

type Customer = {
  id: number;
  name: string;
  phone: string;
  x: number;
  y: number;
  zone: string;
};

type Order = {
  id: number;
  customerId: number;
  boxes: number;
  note: string;
};

type RiderRoute = {
  id: number;
  code: string;
  color: string;
  orders: Order[];
  stops: Customer[];
  distanceKm: number;
  minutes: number;
  deliveryCost: number;
  revenue: number;
  profit: number;
};

type AppState = {
  customers: Customer[];
  orders: Order[];
  selected: 'dashboard' | 'customers' | 'orders' | 'routes' | 'rider' | 'api';
  activeCode: string;
  routeVersion: number;
};

const shop = { x: 50, y: 52 };
const pricePerBox = 65;
const foodCostPerBox = 40;
const riderBaseFee = 15;
const riderSpeedKmH = 30;
const colors = ['#ef4444', '#16a34a', '#2563eb', '#f59e0b', '#7c3aed', '#0891b2'];

const seedCustomers: Customer[] = [
  { id: 1, name: 'คุณเอ', phone: '081-234-1001', x: 18, y: 25, zone: 'หอพักหน้ามอ' },
  { id: 2, name: 'คุณบี', phone: '081-234-1002', x: 32, y: 18, zone: 'คณะวิทย์' },
  { id: 3, name: 'คุณซี', phone: '081-234-1003', x: 70, y: 20, zone: 'ตลาดน้อย' },
  { id: 4, name: 'คุณดี', phone: '081-234-1004', x: 82, y: 42, zone: 'หอใน' },
  { id: 5, name: 'คุณอี', phone: '081-234-1005', x: 68, y: 74, zone: 'คณะบัญชี' },
  { id: 6, name: 'คุณเอฟ', phone: '081-234-1006', x: 42, y: 82, zone: 'ประตู 2' },
  { id: 7, name: 'คุณจี', phone: '081-234-1007', x: 20, y: 68, zone: 'กังสดาล' },
  { id: 8, name: 'คุณเอช', phone: '081-234-1008', x: 56, y: 28, zone: 'หอพักหลังมอ' },
  { id: 9, name: 'คุณไอ', phone: '081-234-1009', x: 88, y: 66, zone: 'ศูนย์อาหาร' }
];

const seedOrders: Order[] = [
  { id: 101, customerId: 1, boxes: 2, note: 'ไม่ใส่ผัก' },
  { id: 102, customerId: 2, boxes: 3, note: 'เผ็ดน้อย' },
  { id: 103, customerId: 3, boxes: 1, note: 'โทรก่อนถึง' },
  { id: 104, customerId: 4, boxes: 2, note: 'รับที่ล็อบบี้' },
  { id: 105, customerId: 5, boxes: 3, note: 'เพิ่มช้อน' },
  { id: 106, customerId: 6, boxes: 2, note: 'จอดหน้าตึก' },
  { id: 107, customerId: 7, boxes: 1, note: 'จ่ายเงินสด' },
  { id: 108, customerId: 8, boxes: 2, note: 'ฝาก รปภ.' }
];

const app = document.querySelector<HTMLDivElement>('#app')!;

let state: AppState = loadState();
let routes: RiderRoute[] = optimizeRoutes(state.orders, state.customers, state.routeVersion);

function loadState(): AppState {
  const saved = localStorage.getItem('lunch-route-state');
  if (saved) {
    return JSON.parse(saved) as AppState;
  }
  return {
    customers: seedCustomers,
    orders: seedOrders,
    selected: 'dashboard',
    activeCode: 'R-001',
    routeVersion: 0
  };
}

function saveState() {
  localStorage.setItem('lunch-route-state', JSON.stringify(state));
}

function customerOf(order: Order) {
  return state.customers.find((customer) => customer.id === order.customerId)!;
}

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y) * 0.045;
}

function routeDistance(stops: Customer[]) {
  let distance = 0;
  let current = shop;
  for (const stop of stops) {
    distance += pointDistance(current, stop);
    current = stop;
  }
  distance += pointDistance(current, shop);
  return distance;
}

function nearestOrderList(orders: Order[], customers: Customer[]) {
  const remaining = [...orders];
  const sorted: Order[] = [];
  let current = shop;

  while (remaining.length) {
    remaining.sort((a, b) => {
      const ca = customers.find((customer) => customer.id === a.customerId)!;
      const cb = customers.find((customer) => customer.id === b.customerId)!;
      return pointDistance(current, ca) - pointDistance(current, cb);
    });
    const next = remaining.shift()!;
    sorted.push(next);
    current = customers.find((customer) => customer.id === next.customerId)!;
  }

  return sorted;
}

function optimizeRoutes(orders: Order[], customers: Customer[], version: number) {
  const ordered = nearestOrderList(orders, customers);
  if (version % 2 === 1) ordered.reverse();

  const groups: Order[][] = [];
  for (let i = 0; i < ordered.length; i += 3) {
    groups.push(ordered.slice(i, i + 3));
  }

  return groups.map((group, index) => {
    const orderedGroup = nearestOrderList(group, customers);
    const stops = orderedGroup.map((order) => customers.find((customer) => customer.id === order.customerId)!);
    const distanceKm = routeDistance(stops);
    const boxes = orderedGroup.reduce((sum, order) => sum + order.boxes, 0);
    const minutes = Math.ceil((distanceKm / riderSpeedKmH) * 60 + stops.length * 4);
    const deliveryCost = Math.ceil(riderBaseFee + distanceKm * 2 * boxes);
    const revenue = boxes * pricePerBox;
    const profit = revenue - boxes * foodCostPerBox - deliveryCost;

    return {
      id: index + 1,
      code: `R-${String(index + 1).padStart(3, '0')}`,
      color: colors[index % colors.length],
      orders: orderedGroup,
      stops,
      distanceKm,
      minutes,
      deliveryCost,
      revenue,
      profit
    };
  });
}

function totals() {
  return routes.reduce(
    (sum, route) => ({
      boxes: sum.boxes + route.orders.reduce((n, order) => n + order.boxes, 0),
      revenue: sum.revenue + route.revenue,
      cost: sum.cost + route.deliveryCost,
      profit: sum.profit + route.profit,
      minutes: Math.max(sum.minutes, route.minutes)
    }),
    { boxes: 0, revenue: 0, cost: 0, profit: 0, minutes: 0 }
  );
}

function render() {
  routes = optimizeRoutes(state.orders, state.customers, state.routeVersion);
  saveState();
  const total = totals();
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">Angular + TypeScript + NodeJS Web API Concept</p>
        <h1>LunchRoute</h1>
      </div>
      <nav>
        ${navButton('dashboard', 'ภาพรวม')}
        ${navButton('customers', 'ลูกค้า')}
        ${navButton('orders', 'ออเดอร์')}
        ${navButton('routes', 'เส้นทาง')}
        ${navButton('rider', 'ไรเดอร์')}
        ${navButton('api', 'API')}
      </nav>
    </header>
    <main>
      ${hero(total)}
      ${renderSelected()}
    </main>
  `;
  bindEvents();
}

function navButton(key: AppState['selected'], label: string) {
  return `<button class="nav ${state.selected === key ? 'active' : ''}" data-nav="${key}">${label}</button>`;
}

function hero(total: ReturnType<typeof totals>) {
  return `
    <section class="hero">
      <div class="hero-copy">
        <span>ส่งด่วนมื้อเที่ยง</span>
        <h2>จัดงานไรเดอร์ให้ทัน 12:30 น. โดยคุมต้นทุนและกำไรในจอเดียว</h2>
        <p>ระบบนี้จำลองการทำงานจากโจทย์ร้านข้าวกล่อง: รับออเดอร์จำนวนมากตอน 11:30 น., แบ่งงานไม่เกิน 3 จุดต่อไรเดอร์, แสดงเส้นทางสีแยกคน และคำนวณค่าใช้จ่ายทันที</p>
      </div>
      <div class="map-preview">${mapSvg(routes)}</div>
    </section>
    <section class="metrics">
      ${metric('กล่องทั้งหมด', `${total.boxes}`, 'จากออเดอร์ที่เปิดอยู่')}
      ${metric('รายรับ', baht(total.revenue), '65 บาทต่อกล่อง')}
      ${metric('ค่าส่งรวม', baht(total.cost), '15 บาทต่อรอบ + ระยะทาง')}
      ${metric('กำไรสุทธิ', baht(total.profit), total.profit >= 0 ? 'ยังมีกำไร' : 'ควรคำนวณใหม่')}
      ${metric('เวลาสูงสุด', `${total.minutes} นาที`, total.minutes <= 60 ? 'ทันกรอบ 1 ชั่วโมง' : 'เสี่ยงส่งเลท')}
    </section>
  `;
}

function metric(label: string, value: string, caption: string) {
  return `<article class="metric"><p>${label}</p><strong>${value}</strong><span>${caption}</span></article>`;
}

function renderSelected() {
  if (state.selected === 'customers') return customersView();
  if (state.selected === 'orders') return ordersView();
  if (state.selected === 'routes') return routesView();
  if (state.selected === 'rider') return riderView();
  if (state.selected === 'api') return apiView();
  return dashboardView();
}

function dashboardView() {
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-title">
          <h3>สิ่งที่เว็บนี้ใช้จากบทเรียน</h3>
          <span>Learning coverage</span>
        </div>
        <div class="learning-grid">
          ${chip('TypeScript', 'types, array, function, class/model')}
          ${chip('UI & Styling', 'layout, card, input, responsive design')}
          ${chip('Data Binding', 'แสดงผลจาก state และอัปเดตจาก form')}
          ${chip('Routing Concept', 'ใช้แท็บแทนหน้า Owner/Rider/API')}
          ${chip('Data Sharing', 'บันทึก state ลง localStorage')}
          ${chip('NodeJS API', 'จำลอง CRUD endpoint และ response JSON')}
        </div>
      </article>
      <article class="panel">
        <div class="panel-title">
          <h3>กติกาธุรกิจ</h3>
          <span>Business rules</span>
        </div>
        <ul class="rules">
          <li>เริ่มส่ง 11:30 น. และต้องเสร็จภายใน 12:30 น.</li>
          <li>ไรเดอร์หนึ่งคนรับงานได้ไม่เกิน 3 ออเดอร์</li>
          <li>ค่าอาหารกล่องละ 65 บาท ต้นทุนอาหารกล่องละ 40 บาท</li>
          <li>ค่าไรเดอร์เริ่มต้น 15 บาทต่อรอบ และคิดตามระยะทางกับจำนวนกล่อง</li>
        </ul>
      </article>
    </section>
    ${routesView()}
  `;
}

function chip(title: string, desc: string) {
  return `<div class="chip"><strong>${title}</strong><span>${desc}</span></div>`;
}

function customersView() {
  return `
    <section class="panel">
      <div class="panel-title">
        <h3>จัดการข้อมูลลูกค้า</h3>
        <span>CRUD + พิกัดบนแผนที่</span>
      </div>
      <form class="form" id="customer-form">
        <input name="name" placeholder="ชื่อลูกค้า" required />
        <input name="phone" placeholder="เบอร์โทร" required />
        <input name="zone" placeholder="โซน/จุดสังเกต" required />
        <input name="x" type="number" min="5" max="95" placeholder="พิกัด X" required />
        <input name="y" type="number" min="5" max="95" placeholder="พิกัด Y" required />
        <button class="primary" type="submit">เพิ่มลูกค้า</button>
      </form>
      <div class="table">
        ${state.customers.map((customer) => `
          <div class="row">
            <strong>${customer.name}</strong>
            <span>${customer.phone}</span>
            <span>${customer.zone}</span>
            <span>(${customer.x}, ${customer.y})</span>
            <button class="icon danger" data-delete-customer="${customer.id}" title="ลบลูกค้า">ลบ</button>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function ordersView() {
  return `
    <section class="panel">
      <div class="panel-title">
        <h3>จำลองและจัดการออเดอร์</h3>
        <span>Insert / Update / Delete</span>
      </div>
      <form class="form" id="order-form">
        <select name="customerId" required>
          ${state.customers.map((customer) => `<option value="${customer.id}">${customer.name} - ${customer.zone}</option>`).join('')}
        </select>
        <input name="boxes" type="number" min="1" max="3" placeholder="จำนวนกล่อง" required />
        <input name="note" placeholder="หมายเหตุ" />
        <button class="primary" type="submit">เพิ่มออเดอร์</button>
      </form>
      <div class="table">
        ${state.orders.map((order) => {
          const customer = customerOf(order);
          return `
            <div class="row">
              <strong>#${order.id}</strong>
              <span>${customer.name}</span>
              <span>${order.boxes} กล่อง</span>
              <span>${order.note || '-'}</span>
              <button class="icon danger" data-delete-order="${order.id}" title="ลบออเดอร์">ลบ</button>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function routesView() {
  return `
    <section class="grid route-layout">
      <article class="panel map-panel">
        <div class="panel-title">
          <h3>แผนที่เส้นทางจัดส่ง</h3>
          <button class="primary" data-recalculate>คำนวณเส้นทางใหม่</button>
        </div>
        ${mapSvg(routes)}
      </article>
      <article class="panel">
        <div class="panel-title">
          <h3>ใบงานไรเดอร์</h3>
          <span>${routes.length} คน</span>
        </div>
        <div class="route-list">
          ${routes.map(routeCard).join('')}
        </div>
      </article>
    </section>
  `;
}

function routeCard(route: RiderRoute) {
  const boxes = route.orders.reduce((sum, order) => sum + order.boxes, 0);
  return `
    <div class="route-card" style="--route:${route.color}">
      <div>
        <strong>${route.code}</strong>
        <span>${boxes} กล่อง / ${route.stops.length} จุด</span>
      </div>
      <ol>
        ${route.orders.map((order) => `<li>${customerOf(order).name} (${order.boxes} กล่อง)</li>`).join('')}
      </ol>
      <div class="route-stats">
        <span>${route.distanceKm.toFixed(2)} กม.</span>
        <span>${route.minutes} นาที</span>
        <span>${baht(route.profit)}</span>
      </div>
    </div>
  `;
}

function riderView() {
  const route = routes.find((item) => item.code === state.activeCode) ?? routes[0];
  return `
    <section class="grid rider-layout">
      <article class="panel">
        <div class="panel-title">
          <h3>หน้าไรเดอร์บนมือถือ</h3>
          <span>กรอกเลขใบงาน</span>
        </div>
        <form class="form compact" id="rider-form">
          <input name="code" value="${state.activeCode}" placeholder="เช่น R-001" />
          <button class="primary" type="submit">ดูใบงาน</button>
        </form>
        ${route ? riderTicket(route) : '<p class="empty">ไม่พบใบงาน</p>'}
      </article>
      <article class="phone">
        ${route ? riderTicket(route, true) : '<p class="empty">ไม่พบใบงาน</p>'}
      </article>
    </section>
  `;
}

function riderTicket(route: RiderRoute, mobile = false) {
  const boxes = route.orders.reduce((sum, order) => sum + order.boxes, 0);
  return `
    <div class="${mobile ? 'ticket mobile' : 'ticket'}" style="--route:${route.color}">
      <p class="eyebrow">ใบงาน ${route.code}</p>
      <h3>หยิบข้าวทั้งหมด ${boxes} กล่อง</h3>
      <ol>
        ${route.orders.map((order, index) => {
          const customer = customerOf(order);
          return `<li><strong>จุดที่ ${index + 1}</strong> ส่งบ้าน${customer.name} - ${customer.zone}<span>${customer.phone}</span></li>`;
        }).join('')}
      </ol>
      <button class="map-link" type="button">เปิดแผนที่นำทาง</button>
    </div>
  `;
}

function apiView() {
  const sample = {
    status: 200,
    message: 'Route calculated',
    data: routes.map((route) => ({
      riderCode: route.code,
      orderIds: route.orders.map((order) => order.id),
      distanceKm: Number(route.distanceKm.toFixed(2)),
      etaMinutes: route.minutes,
      profit: route.profit
    }))
  };

  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-title">
          <h3>API Design ที่ใช้ในระบบ</h3>
          <span>NodeJS / Express / MySQL concept</span>
        </div>
        <div class="endpoint-list">
          ${endpoint('GET', '/api/customers', 'ดึงข้อมูลลูกค้าทั้งหมด')}
          ${endpoint('POST', '/api/orders', 'เพิ่มออเดอร์ใหม่')}
          ${endpoint('PUT', '/api/orders/:id', 'แก้ไขจำนวนกล่องหรือหมายเหตุ')}
          ${endpoint('DELETE', '/api/orders/:id', 'ลบออเดอร์')}
          ${endpoint('POST', '/api/routes/calculate', 'คำนวณเส้นทางและแบ่งงานไรเดอร์')}
          ${endpoint('GET', '/api/riders/:code/jobs', 'ไรเดอร์เปิดดูใบงานของตัวเอง')}
        </div>
      </article>
      <article class="panel">
        <div class="panel-title">
          <h3>Response ตัวอย่าง</h3>
          <span>JSON + status code</span>
        </div>
        <pre>${JSON.stringify(sample, null, 2)}</pre>
      </article>
    </section>
  `;
}

function endpoint(method: string, path: string, desc: string) {
  return `<div class="endpoint"><b>${method}</b><code>${path}</code><span>${desc}</span></div>`;
}

function mapSvg(routeItems: RiderRoute[]) {
  const lines = routeItems.flatMap((route) => {
    const points = [shop, ...route.stops, shop];
    return points.slice(1).map((point, index) => {
      const from = points[index];
      return `<line x1="${from.x}" y1="${from.y}" x2="${point.x}" y2="${point.y}" stroke="${route.color}" />`;
    }).join('');
  }).join('');

  const stops = routeItems.flatMap((route) => route.stops.map((stop, index) => `
    <g>
      <circle cx="${stop.x}" cy="${stop.y}" r="3.6" fill="${route.color}" />
      <text x="${stop.x + 4}" y="${stop.y - 2}">${index + 1}</text>
    </g>
  `)).join('');

  return `
    <svg class="route-map" viewBox="0 0 100 100" role="img" aria-label="แผนที่เส้นทางไรเดอร์">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(15,23,42,.08)" stroke-width=".5" />
        </pattern>
      </defs>
      <rect width="100" height="100" rx="4" fill="#eef7f3" />
      <rect width="100" height="100" fill="url(#grid)" />
      <path d="M10,36 C22,30 34,40 45,34 S72,20 92,31" class="road" />
      <path d="M12,74 C28,62 40,80 54,68 S77,66 91,80" class="road" />
      ${lines}
      <circle cx="${shop.x}" cy="${shop.y}" r="5" fill="#0f172a" />
      <text x="${shop.x + 6}" y="${shop.y + 2}" class="shop-label">ร้าน</text>
      ${stops}
    </svg>
  `;
}

function bindEvents() {
  document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selected = button.dataset.nav as AppState['selected'];
      render();
    });
  });

  document.querySelector<HTMLButtonElement>('[data-recalculate]')?.addEventListener('click', () => {
    state.routeVersion += 1;
    render();
  });

  document.querySelector<HTMLFormElement>('#customer-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    state.customers.push({
      id: Date.now(),
      name: String(data.get('name')),
      phone: String(data.get('phone')),
      zone: String(data.get('zone')),
      x: Number(data.get('x')),
      y: Number(data.get('y'))
    });
    render();
  });

  document.querySelector<HTMLFormElement>('#order-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    state.orders.push({
      id: Date.now(),
      customerId: Number(data.get('customerId')),
      boxes: Number(data.get('boxes')),
      note: String(data.get('note') ?? '')
    });
    render();
  });

  document.querySelector<HTMLFormElement>('#rider-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    state.activeCode = String(data.get('code')).toUpperCase();
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-delete-customer]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.deleteCustomer);
      state.customers = state.customers.filter((customer) => customer.id !== id);
      state.orders = state.orders.filter((order) => order.customerId !== id);
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-delete-order]').forEach((button) => {
    button.addEventListener('click', () => {
      state.orders = state.orders.filter((order) => order.id !== Number(button.dataset.deleteOrder));
      render();
    });
  });
}

function baht(value: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(value);
}

render();
