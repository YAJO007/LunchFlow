import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Brand } from '../../components/brand/brand';
import { AppData } from '../../service/app-data';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule, Brand],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = signal('');
  password = signal('');
  error = signal('');

  constructor(
    private router: Router,
    private appData: AppData,
  ) {
    if (this.appData.isLoggedIn()) {
      this.router.navigate(['/owner']);
    }
  }

  login() {
    if (this.appData.login(this.username().trim(), this.password())) {
      this.router.navigate(['/owner']);
    } else {
      this.error.set('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  }
}
