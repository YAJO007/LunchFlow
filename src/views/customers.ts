import type { Store } from '../types.ts';
import { escapeHtml } from '../lib/format.ts';
import { icon } from '../ui/icons.ts';

export function customersView(store: Store): string {
  const cards = store.customers.map((customer) => {
    const orderCount = store.orders.filter((order) => order.customerId === customer.id).length;
    const deleteButton = orderCount === 0
      ? `<button class="icon-button danger" data-delete-customer="${customer.id}" title="ลบลูกค้า">${icon('trash-2', 16)}</button>`
      : '';

    return `
      <article class="customer-card">
        <div class="customer-top">
          <span class="customer-avatar">${escapeHtml(customer.name.charAt(0))}</span>
          <span><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.zone)}</small></span>
          ${deleteButton}
        </div>
        <p>${icon('map-pin', 16)} ${escapeHtml(customer.address)}</p>
        <p>${icon('phone', 16)} ${escapeHtml(customer.phone)}</p>
        <div class="customer-foot">
          <span>${orderCount} ออเดอร์</span>
          <a href="https://www.google.com/maps?q=${customer.lat},${customer.lng}" target="_blank" rel="noreferrer">เปิดแผนที่ ${icon('chevron-right', 14)}</a>
        </div>
      </article>`;
  }).join('');

  return `
    <section class="surface">
      <div class="section-head">
        <div><span class="kicker">ฐานข้อมูลลูกค้า</span><h2>ลูกค้า ${store.customers.length} ราย</h2></div>
        <button class="button primary" data-new-customer>${icon('plus')} เพิ่มลูกค้า</button>
      </div>
      <div class="customer-grid">${cards}</div>
    </section>`;
}
