import type { Store } from '../types.ts';
import { icon } from '../ui/icons.ts';
import { orderTable } from './shared.ts';

export function ordersView(store: Store): string {
  return `
    <section class="surface">
      <div class="section-head">
        <div><span class="kicker">${store.orders.length} รายการ</span><h2>ออเดอร์ทั้งหมด</h2></div>
        <div class="toolbar">
          <label class="search">${icon('search', 17)}<input id="order-search" placeholder="ค้นหาชื่อหรือเลขออเดอร์"></label>
          <button class="button primary" data-new-order>${icon('plus')} เพิ่มออเดอร์</button>
        </div>
      </div>
      <div id="order-table">${orderTable(store, store.orders)}</div>
    </section>`;
}
