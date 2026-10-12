import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// หน้าแสดงเมื่อไม่พบ path (Wild Card Route **)
@Component({
  selector: 'app-pagenotfound',
  imports: [RouterModule],
  templateUrl: './pagenotfound.html',
  styleUrl: './pagenotfound.css',
})
export class Pagenotfound {}
