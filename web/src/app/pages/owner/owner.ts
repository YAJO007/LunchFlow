import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { RouteApi } from '../../services/api/route-api';
import { AppData } from '../../service/app-data';

// กรอบฝั่งเจ้าของร้าน: เมนูด้านบน + หน้าย่อยตรงกลาง
@Component({
  selector: 'app-owner',
  imports: [RouterModule],
  templateUrl: './owner.html',
  styleUrl: './owner.css',
})
export class Owner {
  routeApi = inject(RouteApi);

  // เมนูด้านบน
  menu = [
    { link: '/owner', label: 'ภาพรวม', icon: 'fa-solid fa-house' },
    { link: '/owner/customers', label: 'ลูกค้า', icon: 'fa-solid fa-users' },
    { link: '/owner/orders', label: 'ออเดอร์', icon: 'fa-solid fa-clipboard-list' },
    { link: '/owner/routes', label: 'จัดเส้นทาง', icon: 'fa-solid fa-route' },
    { link: '/owner/riders', label: 'ไรเดอร์', icon: 'fa-solid fa-motorcycle' },
    { link: '/owner/profit', label: 'กำไร', icon: 'fa-solid fa-chart-line' },
  ];

  constructor(
    public router: Router, // เปลี่ยนหน้า
    private appData: AppData, // ข้อมูลกลาง
  ) {}

  ngOnInit() {
    // ยังไม่ล็อกอิน → /login
    if (!this.appData.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadShop();
  }

  // โหลดข้อมูลร้านจาก API เก็บใน appData
  async loadShop() {
    try {
      this.appData.shop.set(await this.routeApi.getShop());
    } catch (error) {
      // พลาดก็ใช้ค่าตั้งต้นต่อ
      console.log(error);
    }
  }

  // ออกจากระบบ → /login
  logout() {
    this.appData.logout();
    this.router.navigate(['/login']);
  }
}
