import { Injectable, signal } from '@angular/core';

// ข้อความแจ้งเตือน 1 รายการ
export class Toast {
  id: number = 0;
  type: string = 'success'; // success | error | info | warning
  text: string = '';
}

// Service แสดงข้อความแจ้งเตือนมุมจอ (ใช้ร่วมกันทุกหน้า)
@Injectable({
  providedIn: 'root',
})
export class Notify {
  toasts = signal<Toast[]>([]);

  show(text: string, type: string = 'success') {
    const toast = new Toast();
    toast.id = Date.now() + Math.random();
    toast.type = type;
    toast.text = text;
    this.toasts.set([...this.toasts(), toast]);
    // ซ่อนเองอัตโนมัติหลัง 4 วินาที
    setTimeout(() => this.close(toast.id), 4000);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }

  close(id: number) {
    this.toasts.set(this.toasts().filter((t) => t.id !== id));
  }
}
