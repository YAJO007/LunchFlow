import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Notify {
  text = signal('');
  type = signal('success');

  show(text: string, type: string) {
    this.text.set(text);
    this.type.set(type);
    setTimeout(() => this.text.set(''), 3000);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }
}
