import { AfterViewInit, Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import * as L from 'leaflet';
import { Api } from '../../services/api';
import { Customer } from '../../models';
import { addPin, addShopMarker, createMap, fitToLayer } from '../../utils/map';

@Component({
  selector: 'app-customers',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './customers.html',
})
export class Customers implements AfterViewInit {
  // รายชื่อลูกค้าที่แสดงในตาราง
  customers = signal<Customer[]>([]);
  message = signal('');
  errorMessage = signal('');

  // ช่องค้นหา
  searchFirstname = model('');
  searchLastname = model('');

  // ฟอร์มเพิ่ม/แก้ไขลูกค้า
  editingId = signal<number | null>(null); // null = เพิ่มใหม่
  firstname = model('');
  lastname = model('');
  phone = model('');
  address = model('');
  latitude = model<number | null>(null);
  longitude = model<number | null>(null);

  // id ลูกค้าที่กำลังถามยืนยันการลบ
  deletingId = signal<number | null>(null);

  // แผนที่
  private map!: L.Map;
  private layer = L.featureGroup(); // หมุดลูกค้า
  private pickLayer = L.featureGroup(); // หมุดตำแหน่งที่คลิกเลือก
  private markers: { [id: number]: L.Marker } = {};

  constructor(private api: Api) {}

  // สร้างแผนที่หลังจากหน้า HTML พร้อมแล้ว (ต้องมี <div id="customer-map"> ก่อน)
  ngAfterViewInit() {
    this.map = createMap('customer-map');
    this.layer.addTo(this.map);
    this.pickLayer.addTo(this.map);

    // คลิกบนแผนที่ = เลือกพิกัดบ้านลูกค้าให้ฟอร์ม
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.setPickedLocation(event.latlng.lat, event.latlng.lng);
    });

    this.loadCustomers();
  }

  async loadCustomers() {
    try {
      this.customers.set(await this.api.getCustomers());
      this.drawCustomers(true);
    } catch (error) {
      this.showError(error);
    }
  }

  async search() {
    try {
      const result = await this.api.searchCustomers(this.searchFirstname(), this.searchLastname());
      this.customers.set(result);
      this.drawCustomers(true);
      this.message.set('พบลูกค้า ' + result.length + ' คน');
    } catch (error) {
      this.showError(error);
    }
  }

  // ค้นหาลูกค้าในระยะ 1 กม. จากจุดที่เลือกบนแผนที่
  async searchNearby() {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lng === null) {
      this.errorMessage.set('กรุณาคลิกเลือกจุดบนแผนที่ก่อน');
      return;
    }
    try {
      const result = await this.api.getNearbyCustomers(lat, lng);
      this.customers.set(result);
      this.drawCustomers(false);
      L.circle([lat, lng], { radius: 1000, color: '#d9480f', fillOpacity: 0.08 }).addTo(this.layer);
      this.message.set('ลูกค้าในระยะ 1 กม. มี ' + result.length + ' คน');
    } catch (error) {
      this.showError(error);
    }
  }

  clearSearch() {
    this.searchFirstname.set('');
    this.searchLastname.set('');
    this.message.set('');
    this.loadCustomers();
  }

  // วาดหมุดลูกค้าทุกคนบนแผนที่
  drawCustomers(zoomToAll: boolean) {
    this.layer.clearLayers();
    this.markers = {};
    addShopMarker(this.layer);

    for (const customer of this.customers()) {
      const popup =
        '<b>' + customer.firstname + ' ' + customer.lastname + '</b><br>' +
        customer.phone + '<br>' + customer.address;
      this.markers[customer.id] = addPin(
        this.layer,
        customer.latitude,
        customer.longitude,
        '#2b6e4f',
        String(customer.id),
        popup,
      );
    }
    if (zoomToAll) {
      fitToLayer(this.map, this.layer);
    }
  }

  // กดชื่อลูกค้าในตาราง = เลื่อนแผนที่ไปที่บ้านลูกค้า
  showOnMap(customer: Customer) {
    this.map.setView([customer.latitude, customer.longitude], 17);
    this.markers[customer.id]?.openPopup();
    document.getElementById('customer-map')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ปักหมุดตำแหน่งที่เลือก และใส่พิกัดลงฟอร์ม
  setPickedLocation(lat: number, lng: number) {
    this.latitude.set(Number(lat.toFixed(6)));
    this.longitude.set(Number(lng.toFixed(6)));

    this.pickLayer.clearLayers();
    addPin(this.pickLayer, lat, lng, '#d9480f', '+', 'ตำแหน่งที่เลือก');
  }

  // ---------- ฟอร์ม ----------

  editCustomer(customer: Customer) {
    this.editingId.set(customer.id);
    this.firstname.set(customer.firstname);
    this.lastname.set(customer.lastname);
    this.phone.set(customer.phone);
    this.address.set(customer.address);
    this.setPickedLocation(customer.latitude, customer.longitude);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.editingId.set(null);
    this.firstname.set('');
    this.lastname.set('');
    this.phone.set('');
    this.address.set('');
    this.latitude.set(null);
    this.longitude.set(null);
    this.pickLayer.clearLayers();
  }

  async saveCustomer() {
    this.errorMessage.set('');
    if (
      !this.firstname() || !this.lastname() || !this.phone() || !this.address() ||
      this.latitude() === null || this.longitude() === null
    ) {
      this.errorMessage.set('กรุณากรอกข้อมูลให้ครบ และคลิกเลือกตำแหน่งบ้านบนแผนที่');
      return;
    }

    const data = {
      firstname: this.firstname(),
      lastname: this.lastname(),
      phone: this.phone(),
      address: this.address(),
      latitude: Number(this.latitude()),
      longitude: Number(this.longitude()),
    };

    try {
      const id = this.editingId();
      if (id === null) {
        await this.api.addCustomer(data);
        this.message.set('เพิ่มลูกค้าเรียบร้อย');
      } else {
        await this.api.updateCustomer(id, data);
        this.message.set('แก้ไขข้อมูลลูกค้าเรียบร้อย');
      }
      this.resetForm();
      await this.loadCustomers();
    } catch (error) {
      this.showError(error);
    }
  }

  async deleteCustomer(id: number) {
    try {
      await this.api.deleteCustomer(id);
      this.deletingId.set(null);
      this.message.set('ลบลูกค้าเรียบร้อย (ออเดอร์ของลูกค้าคนนี้ถูกลบด้วย)');
      await this.loadCustomers();
    } catch (error) {
      this.showError(error);
    }
  }

  private showError(error: unknown) {
    this.errorMessage.set(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
  }
}
