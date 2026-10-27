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
    // ยกเลิกตัวจับเวลาของข้อความเก่า ไม่งั้นมันจะลบข้อความใหม่เร็วเกินไป
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.text.set(''), 3000);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }

  // แสดงข้อความ error ที่ API ส่งกลับมา เช่น { error: "ไม่พบลูกค้า" }
  // ถ้าเชื่อมต่อ API ไม่ได้เลย จะไม่มีข้อความจาก API ให้บอกผู้ใช้แทน
  apiError(error: any) {
    if (error.error && error.error.error) {
      this.error(error.error.error);
    } else {
      this.error('เชื่อมต่อ API ไม่ได้ ลองใหม่อีกครั้ง');
    }
  }
}
