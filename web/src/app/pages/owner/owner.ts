import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Api } from '../../service/api';
import { AppData } from '../../service/app-data';

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
    if (!this.appData.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadShop();
  }

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
