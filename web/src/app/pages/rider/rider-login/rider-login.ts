import { Component, input, signal, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { AppData } from '../../../service/app-data';

// หน้าไรเดอร์กรอกเลขใบงาน
@Component({
  selector: 'app-rider-login',
  imports: [],
  templateUrl: './rider-login.html',
  styleUrl: './rider-login.css',
})
export class RiderLogin implements OnChanges {
  // รับ query param ?job=1001 (ตามบทเรียน 04-Dynamic path and query params)
  job = input<string>();

  error = signal('');
  recent = signal<string[]>([]); // ใบงานที่เคยเปิด (เก็บใน localStorage)

  constructor(private router: Router, private appData: AppData) {
    this.recent.set(this.appData.recentJobs());
  }

  // โหลดใหม่เมื่อ query param เปลี่ยน โดย Angular ใส่ค่า input() ให้แล้ว
  ngOnChanges() {
    if (this.job()) {
      const no = this.job()!;
      if (!/^[1-9][0-9]*$/.test(no) || !Number.isSafeInteger(Number(no))) {
        this.error.set('กรอกเป็นตัวเลข เช่น 1001');
        return;
      }
      this.router.navigate(['/rider/job', no]);
    }
  }

  open(jobNo: HTMLInputElement) {
    const no = jobNo.value.trim();
    if (!/^[1-9][0-9]*$/.test(no) || !Number.isSafeInteger(Number(no))) {
      this.error.set('กรอกเป็นตัวเลข เช่น 1001');
      return;
    }
    this.error.set('');
    this.router.navigate(['/rider/job', no]);
  }

  openRecent(no: string) {
    this.router.navigate(['/rider/job', no]);
  }

  clearRecent() {
    localStorage.removeItem('recentJobs');
    this.recent.set([]);
  }
}
