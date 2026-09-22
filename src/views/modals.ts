import type { Store } from '../types.ts';
import { escapeHtml } from '../lib/format.ts';
import { icon } from '../ui/icons.ts';

export function orderModal(store: Store): string {
  const customerOptions = store.customers
    .map((customer) => `<option value="${customer.id}">${escapeHtml(customer.name)} · ${escapeHtml(customer.zone)}</option>`)
    .join('');

  return `
    <div class="modal-backdrop">
      <form class="modal" id="order-form">
        ${modalHeader('ออเดอร์ใหม่', 'รับรายการอาหาร')}
        <label>ลูกค้า<select name="customerId" required><option value="">เลือกลูกค้า</option>${customerOptions}</select></label>
        <div class="form-grid">
          <label>เมนูอาหาร<input name="menu" placeholder="เช่น ข้าวกะเพราไก่" required></label>
          <label>จำนวนกล่อง<input name="boxes" type="number" min="1" max="50" value="1" required></label>
        </div>
        <div class="form-grid">
          <label>การชำระเงิน<select name="payment"><option value="paid">โอนแล้ว</option><option value="cash">เก็บเงินสด</option></select></label>
          <label>หมายเหตุ<input name="note" placeholder="เช่น ไม่ใส่พริก"></label>
        </div>
        ${modalActions('บันทึกออเดอร์')}
      </form>
    </div>`;
}

export function customerModal(): string {
  return `
    <div class="modal-backdrop">
      <form class="modal" id="customer-form">
        ${modalHeader('ลูกค้าใหม่', 'เพิ่มข้อมูลจุดส่ง')}
        <div class="form-grid">
          <label>ชื่อ-นามสกุล<input name="name" required></label>
          <label>เบอร์โทร<input name="phone" type="tel" required></label>
        </div>
        <label>ที่อยู่จัดส่ง<input name="address" required></label>
        <label>โซน / จุดสังเกต<input name="zone" required></label>
        <div class="form-grid">
          <label>ละติจูด<input name="lat" type="number" step="any" value="16.4732" required></label>
          <label>ลองจิจูด<input name="lng" type="number" step="any" value="102.8217" required></label>
        </div>
        <p class="form-help">เปิด Google Maps แล้วคลิกขวาที่จุดส่งเพื่อคัดลอกพิกัด</p>
        ${modalActions('เพิ่มลูกค้า')}
      </form>
    </div>`;
}

function modalHeader(kicker: string, title: string): string {
  return `<div class="modal-head"><div><span class="kicker">${kicker}</span><h2>${title}</h2></div><button type="button" class="icon-button" data-close>${icon('x')}</button></div>`;
}

function modalActions(submitLabel: string): string {
  return `<div class="modal-actions"><button type="button" class="button secondary" data-close>ยกเลิก</button><button class="button primary" type="submit">${submitLabel}</button></div>`;
}
