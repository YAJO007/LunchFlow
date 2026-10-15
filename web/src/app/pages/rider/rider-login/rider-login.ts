import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rider-login',
  imports: [],
  templateUrl: './rider-login.html',
  styleUrl: './rider-login.css',
})
export class RiderLogin {
  error = signal('');

  constructor(private router: Router) {}

  open(jobNo: HTMLInputElement) {
    if (jobNo.value === '') {
      this.error.set('กรอกเลขใบงาน เช่น 1001');
      return;
    }
    this.router.navigate(['/rider/job', jobNo.value]);
  }
}
