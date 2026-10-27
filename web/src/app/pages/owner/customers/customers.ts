import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapPoint, RouteMap } from '../../../components/route-map/route-map';
import { Customer } from '../../../model/customer';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { randomCustomer } from '../../../utils/random-customer';
import { distanceKm, navigateLink } from '../../../utils/geo';
import { km } from '../../../utils/format';

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

  randomCount = signal(5);

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
      this.notify.apiError(error);
    }
  }

  // ค้นหาลูกค้าจากชื่อหรือนามสกุล ผ่าน API /customer/search?name=...
  async search(text: string) {
    try {
      this.customers.set(await this.api.searchCustomers(text.trim()));
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  // ล้างช่องค้นหา แล้วแสดงลูกค้าทั้งหมด
  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.loadAll();
  }

  // ระยะจากร้านถึงบ้านลูกค้า (กม.) เช่น "0.63"
  distanceFromShop(c: Customer): string {
    let shop = this.appData.shop();
    return km(distanceKm(shop.latitude, shop.longitude, c.latitude, c.longitude));
  }

  // ลิงก์เปิด Google Maps ไปบ้านลูกค้า
  mapLink(c: Customer): string {
    return navigateLink(c.latitude, c.longitude);
  }

  points(): MapPoint[] {
    return this.customers().map((c) => ({ lat: c.latitude, lng: c.longitude, color: '#1e7a46' }));
  }

  selectedLocation(): MapPoint[] {
    const lat = Number(this.latitude());
    const lng = Number(this.longitude());
    if (!this.latitude() || !this.longitude() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }
    return [{ lat, lng, color: '#1e7a46' }];
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
      this.notify.apiError(error);
    }
  }

  // สุ่มลูกค้าใหม่ตามจำนวนที่กรอก (1-50 คน)
  async addRandom() {
    let count = Number(this.randomCount());
    if (count < 1 || count > 50) {
      this.notify.error('จำนวนต้องอยู่ระหว่าง 1-50 คน');
      return;
    }
    try {
      for (let i = 0; i < count; i++) {
        let customer = randomCustomer();
        await this.api.addCustomer(customer);
      }
      this.notify.success('เพิ่มลูกค้าสุ่ม ' + count + ' คนแล้ว');
      this.loadAll();
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  // ลบลูกค้าทุกคน (ออเดอร์ของลูกค้าจะถูกลบไปด้วย)
  async removeAll() {
    if (!confirm('ลบลูกค้าทั้งหมดใช่ไหม?\n\nออเดอร์ทั้งหมดของลูกค้าจะถูกลบไปด้วย และกู้คืนไม่ได้')) {
      return;
    }
    try {
      // เรียก API ครั้งเดียว ลบทั้งหมดในฐานข้อมูล (เร็วกว่าลบทีละคน)
      const result = await this.api.clearCustomers();
      this.notify.success('ลบลูกค้าทั้งหมด ' + result.affected_row + ' คนแล้ว');
      this.loadAll();
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  async remove(c: Customer) {
    if (!confirm('ลบลูกค้า ' + c.firstname + ' ' + c.lastname + ' ใช่ไหม?\n\nออเดอร์ทั้งหมดของลูกค้าคนนี้จะถูกลบไปด้วย')) {
      return;
    }
    try {
      await this.api.deleteCustomer(c.id);
      this.notify.success('ลบแล้ว');
      this.loadAll();
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }
}
