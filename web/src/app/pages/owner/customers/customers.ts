import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapPoint, RouteMap } from '../../../components/route-map/route-map';
import { Customer } from '../../../model/customer';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, RouteMap],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers {
  customers = signal<Customer[]>([]);

  formOpen = signal(false);
  editId = signal(0);
  firstname = signal('');
  lastname = signal('');
  phone = signal('');
  address = signal('');
  latitude = signal('');
  longitude = signal('');

  constructor(
    private api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {
    this.loadAll();
  }

  async loadAll() {
    try {
      this.customers.set(await this.api.getCustomers());
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  // ค้นจากชื่อเต็ม (ชื่อ + นามสกุล) ด้วยคำบางส่วน
  // พิมพ์หลายคำคั่นด้วยช่องว่างได้ ต้องเจอครบทุกคำ เช่น "ชาย ดี" เจอ "สมชาย ใจดี"
  async search(text: string) {
    const words = text.trim().toLowerCase().split(/\s+/).filter((w) => w !== '');
    try {
      const all = await this.api.getCustomers();
      this.customers.set(
        all.filter((c) => {
          const fullName = (c.firstname + ' ' + c.lastname).toLowerCase();
          return words.every((w) => fullName.includes(w));
        }),
      );
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  async nearby() {
    try {
      const shop = this.appData.shop();
      this.customers.set(await this.api.getNearbyCustomers(shop.latitude, shop.longitude));
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  points(): MapPoint[] {
    return this.customers().map((c) => ({ lat: c.latitude, lng: c.longitude, color: '#1e8e3e' }));
  }

  selectedLocation(): MapPoint[] {
    const lat = Number(this.latitude());
    const lng = Number(this.longitude());
    if (!this.latitude() || !this.longitude() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }
    return [{ lat, lng, color: '#1e8e3e' }];
  }

  selectLocation(point: MapPoint) {
    this.latitude.set(point.lat.toFixed(6));
    this.longitude.set(point.lng.toFixed(6));
  }

  openAdd() {
    this.editId.set(0);
    this.firstname.set('');
    this.lastname.set('');
    this.phone.set('');
    this.address.set('');
    this.latitude.set('');
    this.longitude.set('');
    this.formOpen.set(true);
  }

  openEdit(c: Customer) {
    this.editId.set(c.id);
    this.firstname.set(c.firstname);
    this.lastname.set(c.lastname);
    this.phone.set(c.phone);
    this.address.set(c.address);
    this.latitude.set(String(c.latitude));
    this.longitude.set(String(c.longitude));
    this.formOpen.set(true);
  }

  async save() {
    if (!this.firstname() || !this.lastname() || !this.phone() || !this.address() || !this.latitude() || !this.longitude()) {
      this.notify.error('กรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    const body = {
      firstname: this.firstname(),
      lastname: this.lastname(),
      phone: this.phone(),
      address: this.address(),
      latitude: Number(this.latitude()),
      longitude: Number(this.longitude()),
    };
    try {
      if (this.editId() === 0) {
        await this.api.addCustomer(body);
        this.notify.success('เพิ่มลูกค้าแล้ว');
      } else {
        await this.api.updateCustomer(this.editId(), body);
        this.notify.success('บันทึกแล้ว');
      }
      this.formOpen.set(false);
      this.loadAll();
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }

  async remove(c: Customer) {
    if (!confirm('ลบลูกค้า ' + c.firstname + ' ?')) {
      return;
    }
    try {
      await this.api.deleteCustomer(c.id);
      this.notify.success('ลบแล้ว');
      this.loadAll();
    } catch (error: any) {
      this.notify.error(error.message);
    }
  }
}
