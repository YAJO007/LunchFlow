import type { Customer, Order } from '../src/types.ts';

type NewCustomer = Omit<Customer, 'id'>;
type NewOrder = Pick<Order, 'customerId' | 'boxes' | 'menu' | 'note' | 'payment'>;

export class InputError extends Error {}

export function parseCustomer(body: Record<string, unknown>): NewCustomer {
  return {
    name: requiredText(body.name, 'ชื่อ'),
    phone: requiredText(body.phone, 'เบอร์โทร'),
    address: requiredText(body.address, 'ที่อยู่'),
    zone: requiredText(body.zone, 'โซน'),
    lat: requiredNumber(body.lat, 'ละติจูด'),
    lng: requiredNumber(body.lng, 'ลองจิจูด')
  };
}

export function parseOrder(body: Record<string, unknown>): NewOrder {
  const boxes = requiredNumber(body.boxes, 'จำนวนกล่อง');
  if (!Number.isInteger(boxes) || boxes < 1 || boxes > 50) {
    throw new InputError('จำนวนกล่องต้องอยู่ระหว่าง 1 ถึง 50');
  }

  return {
    customerId: requiredText(body.customerId, 'ลูกค้า'),
    boxes,
    menu: requiredText(body.menu, 'เมนู'),
    note: optionalText(body.note),
    payment: body.payment === 'cash' ? 'cash' : 'paid'
  };
}

function requiredText(value: unknown, field: string): string {
  const text = String(value ?? '').trim();
  if (!text) throw new InputError(`กรุณาระบุ${field}`);
  return text;
}

function optionalText(value: unknown): string {
  return String(value ?? '').trim();
}

function requiredNumber(value: unknown, field: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new InputError(`${field}ไม่ถูกต้อง`);
  return number;
}
