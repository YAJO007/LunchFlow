import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Api } from '../../service/api';
import { AppData } from '../../service/app-data';

// Layout ของหน้าจอเจ้าของร้าน (มี router-outlet ด้านใน สำหรับหน้าย่อย)
@Component({
  selector: 'app-owner',
  imports: [RouterModule],
  templateUrl: './owner.html',
  styleUrl: './owner.css',
})
export class Owner {
  constructor(
    private router: Router,
    private api: Api,
    private appData: AppData,
  ) {
    // ยังไม่เข้าสู่ระบบ => ไปหน้า login
    if (!this.appData.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadShop();
  }

  // โหลดข้อมูลร้านและเงื่อนไขค่าใช้จ่ายจาก API มาเก็บใน service
  async loadShop() {
    try {
      this.appData.shop.set(await this.api.getShop());
    } catch (error) {
      console.log(error);
    }
  }

  logout() {
    this.appData.logout();
    this.router.navigate(['/login']);
  }
}
