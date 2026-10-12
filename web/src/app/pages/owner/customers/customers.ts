import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapPoint, RouteMap } from '../../../components/route-map/route-map';
import { SERVICE_RADIUS_KM } from '../../../config/shop';
import { Customer } from '../../../model/customer';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { Notify } from '../../../service/notify';
import { km } from '../../../utils/format';
import { distanceKm, mapLink } from '../../../utils/geo';

// หน้าจัดการข้อมูลลูกค้า: แสดง ค้นหา เพิ่ม แก้ไข ลบ
@Component({
  selector: 'app-customers',
  imports: [FormsModule, RouteMap],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers {
  customers = signal<Customer[]>([]);
  loading = signal(false);
  requestNo = 0; // นับคำขอ ใช้ทิ้งผลลัพธ์เก่าที่ตอบกลับช้า
  mode = signal('all'); // all = ทั้งหมด, search = ผลค้นหา, nearby = ใกล้ร้าน 1 กม.
  selectedId = signal(0); // ลูกค้าที่เลือก (เน้นบนแผนที่)

  // ฟอร์มเพิ่ม/แก้ไข
  formOpen = signal(false);
  editId = signal(0); // 0 = เพิ่มใหม่
  firstname = signal('');
  lastname = signal('');
  phone = signal('');
  address = signal('');
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  formError = signal('');
  saving = signal(false);
  removing = signal(false);

  // ยืนยันการลบ
  deleting = signal<any>(undefined); // ลูกค้าที่กำลังจะลบ

  km = km;
  mapLink = mapLink;
  radius = SERVICE_RADIUS_KM;

  constructor(
    private api: Api,
    public appData: AppData,
    private notify: Notify,
  ) {
    this.loadAll();
  }

  async loadAll() {
    const no = ++this.requestNo;
    this.loading.set(true);
    try {
      const list = await this.api.getCustomers();
      if (no !== this.requestNo) return;
      this.customers.set(list);
      this.mode.set('all');
    } catch (error: any) {
      if (no !== this.requestNo) return;
      this.notify.error(error.message);
    }
    this.loading.set(false);
  }

  // ค้นหาจากส่วนหนึ่งของชื่อ/นามสกุล (ส่ง input เข้ามาเป็นพารามิเตอร์ ตามบทเรียน Data binding)
  async search(fn: HTMLInputElement, ln: HTMLInputElement) {
    if (fn.value.trim() === '' && ln.value.trim() === '') {
      this.loadAll();
      return;
    }
    const no = ++this.requestNo;
    this.loading.set(true);
    try {
      const list = await this.api.searchCustomers(fn.value.trim(), ln.value.trim());
      if (no !== this.requestNo) return;
      this.customers.set(list);
      this.mode.set('search');
    } catch (error: any) {
      if (no !== this.requestNo) return;
      this.notify.error(error.message);
    }
    this.loading.set(false);
  }

  clearSearch(fn: HTMLInputElement, ln: HTMLInputElement) {
    fn.value = '';
    ln.value = '';
    this.loadAll();
  }

  // ลูกค้าในระยะ 1 กม. จากร้าน (GET /customer/nearby)
  async nearby() {
    const no = ++this.requestNo;
    this.loading.set(true);
    try {
      const shop = this.appData.shop();
      const list = await this.api.getNearbyCustomers(shop.latitude, shop.longitude);
      if (no !== this.requestNo) return;
      this.customers.set(list);
      this.mode.set('nearby');
    } catch (error: any) {
      if (no !== this.requestNo) return;
      this.notify.error(error.message);
    }
    this.loading.set(false);
  }

  // ระยะทางจากร้านถึงบ้านลูกค้า
  distanceOf(c: { latitude: number; longitude: number }): number {
    const shop = this.appData.shop();
    return distanceKm(shop.latitude, shop.longitude, c.latitude, c.longitude);
  }

  // จุดบ้านลูกค้าสำหรับแผนที่
  points(): MapPoint[] {
    return this.customers().map((c) => ({
      lat: c.latitude,
      lng: c.longitude,
      label: c.firstname + ' ' + c.lastname,
      color: c.id === this.selectedId() ? '#22d3ee' : this.distanceOf(c) > this.radius ? '#fbbf24' : '#a855f7',
    }));
  }

  outsideCount(): number {
    return this.customers().filter((c) => this.distanceOf(c) > this.radius).length;
  }

  // ---------- ฟอร์ม ----------
  openAdd() {
    this.editId.set(0);
    this.firstname.set('');
    this.lastname.set('');
    this.phone.set('');
    this.address.set('');
    this.latitude.set(null);
    this.longitude.set(null);
    this.formError.set('');
    this.formOpen.set(true);
  }

  openEdit(c: Customer) {
    this.editId.set(c.id);
    this.firstname.set(c.firstname);
    this.lastname.set(c.lastname);
    this.phone.set(c.phone);
    this.address.set(c.address);
    this.latitude.set(c.latitude);
    this.longitude.set(c.longitude);
    this.formError.set('');
    this.formOpen.set(true);
  }

  // ระยะจากร้านของพิกัดที่กรอกในฟอร์ม (ยังไม่กรอก = -1)
  formDistance(): number {
    if (this.latitude() === null || this.longitude() === null) {
      return -1;
    }
    return this.distanceOf({ latitude: Number(this.latitude()), longitude: Number(this.longitude()) });
  }

  // ตรวจสอบข้อมูลก่อนบันทึก ถ้าผ่านจะได้ข้อความว่าง ''
  validate(): string {
    if (!this.firstname().trim() || !this.lastname().trim()) {
      return 'กรอกชื่อและนามสกุล';
    }
    if (!/^0[0-9]{8,9}$/.test(this.phone().trim())) {
      return 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก';
    }
    if (!this.address().trim()) {
      return 'กรอกที่อยู่';
    }
    if (this.latitude() === null || this.longitude() === null || !Number.isFinite(Number(this.latitude())) || !Number.isFinite(Number(this.longitude()))) {
      return 'กรอกพิกัดเป็นตัวเลข';
    }
    if (Math.abs(Number(this.latitude())) > 90 || Math.abs(Number(this.longitude())) > 180) {
      return 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90 และลองจิจูด -180 ถึง 180';
    }
    if (this.formDistance() > 10) {
      return 'พิกัดห่างร้านเกิน 10 กม. น่าจะผิด';
    }
    return '';
  }

  async save() {
    if (this.saving()) return;
    const error = this.validate();
    if (error) {
      this.formError.set(error);
      return;
    }
    const body = {
      firstname: this.firstname().trim(),
      lastname: this.lastname().trim(),
      phone: this.phone().trim(),
      address: this.address().trim(),
      latitude: Number(this.latitude()),
      longitude: Number(this.longitude()),
    };
    this.saving.set(true);
    try {
      if (this.editId() === 0) {
        const result = await this.api.addCustomer(body);
        this.notify.success('เพิ่มลูกค้า #' + result.last_id);
      } else {
        await this.api.updateCustomer(this.editId(), body);
        this.notify.success('บันทึกแล้ว');
      }
      this.formOpen.set(false);
      this.loadAll();
    } catch (error: any) {
      this.formError.set(error.message);
    }
    this.saving.set(false);
  }

  // ---------- ลบ ----------
  async confirmDelete() {
    if (this.removing() || !this.deleting()) return;
    const c = this.deleting() as Customer;
    this.removing.set(true);
    try {
      await this.api.deleteCustomer(c.id);
      this.notify.success('ลบลูกค้า ' + c.firstname + ' แล้ว');
      this.deleting.set(undefined);
      this.loadAll();
    } catch (error: any) {
      this.notify.error(error.message);
    }
    this.removing.set(false);
  }
}
