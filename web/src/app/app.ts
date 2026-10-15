import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notify } from './service/notify';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('lunchflow-web');

  constructor(public notify: Notify) {}
}
