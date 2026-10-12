import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Brand } from '../../components/brand/brand';
import { SERVICE_RADIUS_KM } from '../../config/shop';
import { AppData } from '../../service/app-data';

// หน้าแรก: เลือกว่าเป็นเจ้าของร้านหรือไรเดอร์
@Component({
  selector: 'app-home',
  imports: [RouterModule, Brand],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  radius = SERVICE_RADIUS_KM;

  constructor(public appData: AppData) {}
}
