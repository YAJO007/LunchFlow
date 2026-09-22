import type { Order, Trip } from '../types.ts';

const moneyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0
});

const timeFormatter = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit'
});

const dateFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

export const formatMoney = (value: number) => moneyFormatter.format(value);
export const formatTime = (value: string) => `${timeFormatter.format(new Date(value))} น.`;
export const formatToday = () => dateFormatter.format(new Date());

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!
  );
}

export const orderStatusLabel: Record<Order['status'], string> = {
  pending: 'รอจัดส่ง',
  assigned: 'กำลังจัดส่ง',
  delivered: 'ส่งสำเร็จ'
};

export const tripStatusLabel: Record<Trip['status'], string> = {
  ready: 'พร้อมออกส่ง',
  'on-route': 'กำลังนำส่ง',
  completed: 'เสร็จสิ้น'
};
