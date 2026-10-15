import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

// หน้าไรเดอร์กรอกเลขใบงาน
@Component({
  selector: 'app-rider-login',
  imports: [],
  templateUrl: './rider-login.html',
  styleUrl: './rider-login.css',
})
export class RiderLogin {
  error = signal('');

  constructor(private router: Router) {}

  // ส่ง input เข้ามาเป็นพารามิเตอร์ (ตามบทเรียน Data binding)
  open(jobNo: HTMLInputElement) {
    if (jobNo.value === '') {
      this.error.set('กรอกเลขใบงาน เช่น 1001');
      return;
    }
    // เปลี่ยนหน้าด้วยโค้ด (ตามบทเรียน 03-Navigation Programmatically)
    this.router.navigate(['/rider/job', jobNo.value]);
  }
}
