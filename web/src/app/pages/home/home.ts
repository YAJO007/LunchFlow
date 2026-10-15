import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// หน้าแรก: เลือกว่าเป็นเจ้าของร้านหรือไรเดอร์
@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
