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
    const id = Number(jobNo.value);
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('กรุณากรอกเลขใบงานเป็นจำนวนเต็ม เช่น 1001');
      return;
    }
    this.error.set('');
    this.router.navigate(['/rider/job', id]);
  }
}
