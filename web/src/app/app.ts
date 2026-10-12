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

  iconOf(type: string): string {
    if (type === 'success') {
      return 'check_circle';
    } else if (type === 'error') {
      return 'error';
    } else if (type === 'warning') {
      return 'warning';
    }
    return 'info';
  }
}
