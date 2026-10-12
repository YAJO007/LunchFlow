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
    const riders = this.appData.riders().map((r) => (r.no === rider.no ? { ...r, available: !r.available } : r));
    this.appData.saveRiders(riders);
  }

  setAll(available: boolean) {
    this.appData.saveRiders(this.appData.riders().map((r) => ({ ...r, available: available })));
  }

  add() {
    if (!this.newName().trim()) {
      this.notify.error('กรอกชื่อไรเดอร์');
      return;
    }
    if (this.newPhone().trim() && !/^0[0-9]{8,9}$/.test(this.newPhone().trim())) {
      this.notify.error('เบอร์โทรไม่ถูกต้อง');
      return;
    }
    const riders = this.appData.riders();
    let maxNo = 0;
    for (const r of riders) {
      maxNo = Math.max(maxNo, r.no);
    }
    const rider: Rider = { no: maxNo + 1, name: this.newName().trim(), phone: this.newPhone().trim(), available: true };
    this.appData.saveRiders([...riders, rider]);
    this.notify.success('เพิ่ม ' + rider.name);
    this.newName.set('');
    this.newPhone.set('');
  }

  remove(rider: Rider) {
    this.appData.saveRiders(this.appData.riders().filter((r) => r.no !== rider.no));
    this.notify.show('ลบ ' + rider.name, 'info');
  }

  reset() {
    this.appData.resetRiders();
    this.notify.show('คืนค่าเริ่มต้น', 'info');
  }
}
