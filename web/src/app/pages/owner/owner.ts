import { Component, signal, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Brand } from '../../components/brand/brand';
import { Api } from '../../service/api';
import { AppData } from '../../service/app-data';
import { toMinutes } from '../../utils/format';

class Menu {
  path: string = '';
  label: string = '';
  icon: string = '';
}

@Component({
  selector: 'app-owner',
  imports: [RouterModule, Brand],
  templateUrl: './owner.html',
  styleUrl: './owner.css',
})
export class Owner implements OnDestroy {
  private timer?: ReturnType<typeof setInterval>;
  menus: Menu[] = [
    { path: '/owner', label: 'ภาพรวม', icon: 'dashboard' },
    { path: '/owner/customers', label: 'ลูกค้า', icon: 'group' },
    { path: '/owner/orders', label: 'ออเดอร์', icon: 'receipt_long' },
    { path: '/owner/riders', label: 'ไรเดอร์', icon: 'sports_motorsports' },
    { path: '/owner/routes', label: 'จัดเส้นทาง', icon: 'alt_route' },
    { path: '/owner/report', label: 'กำไร', icon: 'monitoring' },
  ];

  drawerOpen = signal(false);
  clock = signal('');
  countdown = signal('');

  constructor(
    private router: Router,
    private api: Api,
    public appData: AppData,
  ) {
    if (!this.appData.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadShop();
    this.tick();
    this.timer = setInterval(() => this.tick(), 30000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  async loadShop() {
    try {
      this.appData.shop.set(await this.api.getShop());
    } catch (error) {
    }
  }

  tick() {
    const now = new Date();
    this.clock.set(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
    const left = toMinutes(this.appData.shop().departureTime) - (now.getHours() * 60 + now.getMinutes());
    if (left > 0) {
      this.countdown.set('ออกส่งอีก ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + ' ชม.');
    } else {
      this.countdown.set('ถึงเวลาออกส่ง');
    }
  }

  isActive(path: string): boolean {
    const url = this.router.url.split('?')[0];
    if (path === '/owner') {
      return url === '/owner';
    }
    return url.startsWith(path);
  }

  go(path: string) {
    this.drawerOpen.set(false);
    this.router.navigate([path]);
  }

  logout() {
    this.appData.logout();
    this.router.navigate(['/login']);
  }
}
