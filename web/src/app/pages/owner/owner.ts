import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Api } from '../../service/api';
import { AppData } from '../../service/app-data';

// หน้า owner = "กรอบ" ของฝั่งเจ้าของร้าน
// มีแถบเมนูด้านบน ส่วนตรงกลางจะสลับไปแสดงหน้าย่อย (ภาพรวม, ลูกค้า, ออเดอร์ ...)
@Component({
  selector: 'app-owner',
  imports: [RouterModule],
  templateUrl: './owner.html',
  styleUrl: './owner.css',
})
export class Owner {
  // รายการเมนูบนแถบด้านบน
  // link = กดแล้วไปหน้าไหน, label = ข้อความบนปุ่ม, icon = ไอคอนหน้าปุ่ม
  menu = [
    { link: '/owner', label: 'ภาพรวม', icon: 'fa-solid fa-house' },
    { link: '/owner/customers', label: 'ลูกค้า', icon: 'fa-solid fa-users' },
    { link: '/owner/orders', label: 'ออเดอร์', icon: 'fa-solid fa-clipboard-list' },
    { link: '/owner/routes', label: 'จัดเส้นทาง', icon: 'fa-solid fa-route' },
  ];

  // ทำงานทันทีตอนเปิดหน้านี้
  constructor(
    private router: Router, // ตัวช่วยเปลี่ยนหน้า
    private api: Api, // ตัวช่วยคุยกับหลังบ้าน (Web API)
    private appData: AppData, // กล่องเก็บข้อมูลที่ทุกหน้าใช้ร่วมกัน
  ) {
    // ล็อกอินแล้ว → โหลดข้อมูลร้าน
    this.loadShop();
  }

  // ขอข้อมูลร้านจาก API (เวลาออกจากร้าน, เวลาที่ต้องส่งถึง, ราคาต่อกล่อง ...)
  // แล้วเก็บไว้ใน appData ให้หน้าย่อยทุกหน้าหยิบไปใช้ได้
  async loadShop() {
    try {
      this.appData.shop.set(await this.api.getShop());
    } catch (error) {
      // ถ้าดึงไม่สำเร็จ แค่เขียนลง console ไว้ดู หน้าเว็บยังใช้ค่าตั้งต้นต่อได้
      console.log(error);
    }
  }

  // ปุ่ม "ออกจากระบบ": ลบสถานะล็อกอิน แล้วพากลับไปหน้าล็อกอิน
  logout() {
    this.appData.logout();
    this.router.navigate(['/login']);
  }
}
