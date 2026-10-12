import { Component, input, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppData } from '../../../service/app-data';

@Component({
  selector: 'app-rider-login',
  imports: [],
  templateUrl: './rider-login.html',
  styleUrl: './rider-login.css',
})
export class RiderLogin implements OnInit {
  job = input<string>();

  error = signal('');
  recent = signal<string[]>([]);

  constructor(private router: Router, private appData: AppData) {
    this.recent.set(this.appData.recentJobs());
  }

  ngOnInit() {
    if (this.job()) {
      this.router.navigate(['/rider/job', this.job()]);
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
