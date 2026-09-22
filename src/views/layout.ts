import type { Page } from '../types.ts';
import { formatToday } from '../lib/format.ts';
import { icon } from '../ui/icons.ts';

const pageTitles: Record<Page, string> = {
  dashboard: 'ภาพรวมการจัดส่ง',
  orders: 'จัดการออเดอร์',
  customers: 'ข้อมูลลูกค้า',
  routes: 'รอบและเส้นทางจัดส่ง',
  rider: 'ใบงานไรเดอร์'
};

const navigation: Array<{ page: Page; icon: string; label: string }> = [
  { page: 'dashboard', icon: 'layout-dashboard', label: 'ภาพรวมวันนี้' },
  { page: 'orders', icon: 'utensils', label: 'ออเดอร์' },
  { page: 'customers', icon: 'users', label: 'ลูกค้า' },
  { page: 'routes', icon: 'route', label: 'รอบจัดส่ง' },
  { page: 'rider', icon: 'bike', label: 'หน้าไรเดอร์' }
];

export function appLayout(page: Page, content: string): string {
  const navigationItems = navigation.map((item) => `
    <button class="nav-item ${page === item.page ? 'active' : ''}" data-page="${item.page}">
      ${icon(item.icon)}<span>${item.label}</span>
    </button>`).join('');

  return `
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="brand-mark">LR</div><div><strong>LunchRoute</strong><span>Delivery operations</span></div></div>
        <nav class="nav-list">${navigationItems}</nav>
        <div class="service-card"><span class="online-dot"></span><div><strong>ระบบพร้อมใช้งาน</strong><small>อัปเดตข้อมูลล่าสุดแล้ว</small></div></div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <button class="icon-button mobile-menu" data-menu aria-label="เปิดเมนู">${icon('menu')}</button>
          <div><p class="date-label">${formatToday()}</p><h1>${pageTitles[page]}</h1></div>
          <div class="top-actions">
            <div class="cutoff"><span>เวลาปิดรอบ</span><strong>11:30 น.</strong></div>
            <button class="button primary" data-new-order>${icon('plus')} รับออเดอร์</button>
          </div>
        </header>
        <main>${content}</main>
      </div>
    </div>
    <div class="modal-root" id="modal-root"></div>
    <div class="toast" id="toast"></div>`;
}
