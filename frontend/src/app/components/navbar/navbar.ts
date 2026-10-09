import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {

  menus = [
    { path: '/routes', label: 'จัดเส้นทาง' },
    { path: '/orders', label: 'ออเดอร์' },
    { path: '/customers', label: 'ลูกค้า' },
    { path: '/rider', label: 'ใบงานไรเดอร์' },
  ];
}
