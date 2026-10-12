import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Brand } from '../../components/brand/brand';

// Layout ของหน้าจอไรเดอร์ (ออกแบบสำหรับมือถือ)
@Component({
  selector: 'app-rider',
  imports: [RouterModule, Brand],
  templateUrl: './rider.html',
  styleUrl: './rider.css',
})
export class Rider {}
