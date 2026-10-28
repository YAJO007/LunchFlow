import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapPoint, RouteMap } from '../../../components/route-map/route-map';
import { Customer } from '../../../model/customer';
import { CustomerApi } from '../../../services/api/customer-api';
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
  customerApi = inject(CustomerApi);

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
    public appData: AppData,
    private notify: Notify,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  async loadAll() {
    try {
      this.customers.set(await this.customerApi.getCustomers());
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  // ค้นหาจากชื่อ
  async search(text: string) {
    try {
      this.customers.set(await this.customerApi.searchCustomers(text.trim()));
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  // ล้างค้นหา
  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.loadAll();
  }

  // ระยะจากร้าน (กม.)
  distanceFromShop(c: Customer): string {
    let shop = this.appData.shop();
    return km(distanceKm(shop.latitude, shop.longitude, c.latitude, c.longitude));
  }

  // ลิงก์ Google Maps
  mapLink(c: Customer): string {
    return navigateLink(c.latitude, c.longitude);
  }

  // จุดบ้านทุกคน
  points(): MapPoint[] {
    return this.customers().map((c) => ({ lat: c.latitude, lng: c.longitude, color: '#1e7a46' }));
  }

  // จุดบ้านในฟอร์ม
  selectedLocation(): MapPoint[] {
    const lat = Number(this.latitude());
    const lng = Number(this.longitude());
    if (!this.latitude() || !this.longitude() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }
    return [{ lat, lng, color: '#1e7a46' }];
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
        await this.customerApi.addCustomer(body);
        this.notify.success('เพิ่มลูกค้าแล้ว');
      } else {
        await this.customerApi.updateCustomer(this.editId(), body);
        this.notify.success('บันทึกแล้ว');
      }
      this.formOpen.set(false);
      this.loadAll();
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }

  // สุ่มลูกค้า 1-50 คน
  async addRandom() {
    let count = Number(this.randomCount());
    if (count < 1 || count > 50) {
      this.notify.error('จำนวนต้องอยู่ระหว่าง 1-50 คน');
      return;
    }
    try {
      for (let i = 0; i < count; i++) {
        let customer = randomCustomer();
        await this.customerApi.addCustomer(customer);
      }
      this.notify.success('เพิ่มลูกค้าสุ่ม ' + count + ' คนแล้ว');
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
      await this.customerApi.deleteCustomer(c.id);
      this.notify.success('ลบแล้ว');
      this.loadAll();
    } catch (error: any) {
      this.notify.apiError(error);
    }
  }
}
