import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-brand',
  imports: [],
  templateUrl: './brand.html',
  styleUrl: './brand.css',
})
export class Brand {
  @Input() size: string = 'md';
}
