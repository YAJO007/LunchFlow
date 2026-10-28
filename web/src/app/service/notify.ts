import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Notify {
  text = signal('');
  type = signal('success');
  timer: any;

  show(text: string, type: string) {
    this.text.set(text);
    this.type.set(type);
    // ล้างตัวจับเวลาเก่า
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.text.set(''), 3000);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }

  // แสดง error จาก API
  // ต่อ API ไม่ได้ ใช้ข้อความแทน
  apiError(error: any) {
    if (error.error && error.error.error) {
      this.error(error.error.error);
    } else {
      this.error('เชื่อมต่อ API ไม่ได้ ลองใหม่อีกครั้ง');
    }
  }
}
