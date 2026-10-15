import { Injectable, signal } from '@angular/core';

// Service แสดงข้อความแจ้งเตือนมุมจอ (daisyUI toast) ใช้ร่วมกันทุกหน้า
@Injectable({
  providedIn: 'root',
})
export class Notify {
  text = signal('');
  type = signal('success'); // success หรือ error

  show(text: string, type: string) {
    this.text.set(text);
    this.type.set(type);
    // ซ่อนเองหลัง 3 วินาที
    setTimeout(() => this.text.set(''), 3000);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }
}
