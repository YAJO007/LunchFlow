import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppData } from '../../service/app-data';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = signal('');
  password = signal('');
  error = signal('');
  showPassword = signal(false);

  constructor(
    private router: Router,
    private appData: AppData,
  ) {}

  login() {
    if (this.appData.login(this.username(), this.password())) {
      this.router.navigate(['/owner']);
    } else {
      this.error.set('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  }
}
