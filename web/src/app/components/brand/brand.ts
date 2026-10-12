import { Component, Input } from '@angular/core';

// โลโก้และชื่อระบบ ใช้ซ้ำได้หลายหน้า
@Component({
  selector: 'app-brand',
  imports: [],
  templateUrl: './brand.html',
  styleUrl: './brand.css',
})
export class Brand {
  @Input() size: string = 'md'; // md | lg
}
