import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// Layout ของหน้าจอไรเดอร์ (ใช้บนมือถือ)
@Component({
  selector: 'app-rider',
  imports: [RouterModule],
  templateUrl: './rider.html',
  styleUrl: './rider.css',
})
export class Rider {}
