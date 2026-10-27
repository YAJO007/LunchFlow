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
  ) {
    this.load();
  }

  async load() {
    try {
      await this.appData.loadRiders();
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  async toggle(rider: Rider) {
    try {
      await this.appData.updateRider(rider.no, { available: !rider.available });
      this.notify.success('อัปเดตสถานะแล้ว');
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  // ตั้งให้ไรเดอร์ทุกคนพร้อมรับงาน
  async allReady() {
    try {
      let riders = this.appData.riders();
      for (let i = 0; i < riders.length; i++) {
        if (!riders[i].available) {
          await this.appData.updateRider(riders[i].no, { available: true });
        }
      }
      this.notify.success('ไรเดอร์พร้อมทุกคนแล้ว');
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  async add() {
    const name = this.newName().trim();
    if (!name) {
      this.notify.error('กรอกชื่อไรเดอร์');
      return;
    }

    try {
      await this.appData.addRider({ name: name, phone: this.newPhone().trim() });
      this.newName.set('');
      this.newPhone.set('');
      this.notify.success('เพิ่มไรเดอร์แล้ว');
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  async remove(rider: Rider) {
    try {
      await this.appData.deleteRider(rider.no);
      this.notify.success('ลบไรเดอร์แล้ว');
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }
}