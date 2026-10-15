import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Rider } from '../../../model/rider';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';

@Component({
  selector: 'app-riders',
  imports: [FormsModule],
  templateUrl: './riders.html',
  styleUrl: './riders.css',
})
export class Riders {
  newName = signal('');
  newPhone = signal('');

  constructor(
    public appData: AppData,
    private notify: Notify,
  ) {}

  toggle(rider: Rider) {
    const riders = this.appData.riders().map((r) => {
      if (r.no === rider.no) {
        return { no: r.no, name: r.name, phone: r.phone, available: !r.available };
      }
      return r;
    });
    this.appData.saveRiders(riders);
  }

  add() {
    if (!this.newName()) {
      this.notify.error('กรอกชื่อไรเดอร์');
      return;
    }
    const riders = this.appData.riders();
    let no = 1;
    if (riders.length > 0) {
      no = riders[riders.length - 1].no + 1;
    }
    const rider: Rider = { no: no, name: this.newName(), phone: this.newPhone(), available: true };
    this.appData.saveRiders([...riders, rider]);
    this.newName.set('');
    this.newPhone.set('');
  }

  remove(rider: Rider) {
    this.appData.saveRiders(this.appData.riders().filter((r) => r.no !== rider.no));
  }
}
