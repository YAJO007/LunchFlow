import { AfterViewInit, Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Api } from '../../services/api';
import { RiderJob, RoutePlan, Shop } from '../../models';
import { addShopMarker, createMap, drawJob, fitToLayer } from '../../utils/map';

@Component({
  selector: 'app-route-planning',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './routes.html',
})
export class RoutePlanning implements AfterViewInit {
  shop = signal<Shop | null>(null);
  plan = signal<RoutePlan | null>(null);
  option = signal(0); // แผนที่กำลังดู (0 = ดีที่สุด)
  totalOptions = signal(0);
  confirmed = signal(false); // กดยืนยันแล้วหรือยัง
  loading = signal(false);
  errorMessage = signal('');

  // ไรเดอร์ที่เลือกดูบนแผนที่ (null = ดูทุกคน)
  selectedRider = signal<number | null>(null);

  private map!: L.Map;
  private layer = L.featureGroup();

  constructor(private api: Api) {}

  async ngAfterViewInit() {
    this.map = createMap('route-map');
    this.layer.addTo(this.map);
    addShopMarker(this.layer);

    try {
      this.shop.set(await this.api.getShop());
    } catch (error) {
      this.showError(error);
    }
  }

  // ปุ่ม "คำนวณเส้นทาง" = เริ่มที่แผนที่ดีที่สุด
  calculate() {
    this.loadOption(0);
  }

  // ปุ่ม "คำนวณใหม่" = ดูแผนสำรองถัดไป
  recalculate() {
    this.loadOption(this.option() + 1);
  }

  async loadOption(option: number) {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const result = await this.api.calculateRoute(option);
      this.option.set(result.option);
      this.totalOptions.set(result.total_options);
      this.plan.set(result.plan);
      this.confirmed.set(false);
      this.selectedRider.set(null);
      this.drawPlan();
    } catch (error) {
      this.showError(error);
    }
    this.loading.set(false);
  }

  // ยืนยันแผน -> บันทึกลงฐานข้อมูลและได้เลขใบงานของไรเดอร์แต่ละคน
  async confirmPlan() {
    this.loading.set(true);
    try {
      const saved = await this.api.confirmRoute(this.option());
      this.plan.set(saved);
      this.confirmed.set(true);
      this.drawPlan();
    } catch (error) {
      this.showError(error);
    }
    this.loading.set(false);
  }

  // ดูแผนล่าสุดที่ยืนยันไว้ (เผื่อปิดหน้าไปแล้วอยากดูเลขใบงานอีกครั้ง)
  async loadLatest() {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.plan.set(await this.api.getLatestPlan());
      this.confirmed.set(true);
      this.selectedRider.set(null);
      this.drawPlan();
    } catch (error) {
      this.showError(error);
    }
    this.loading.set(false);
  }

  // กดการ์ดไรเดอร์ = ดูเฉพาะเส้นทางคนนั้น (กดซ้ำ = กลับมาดูทุกคน)
  toggleRider(riderNo: number) {
    this.selectedRider.set(this.selectedRider() === riderNo ? null : riderNo);
    this.drawPlan();
  }

  // วาดเส้นทางทุกคน (หรือเฉพาะคนที่เลือก) บนแผนที่
  drawPlan() {
    const plan = this.plan();
    this.layer.clearLayers();
    addShopMarker(this.layer);
    if (!plan) {
      return;
    }
    for (const job of plan.jobs) {
      if (this.selectedRider() === null || this.selectedRider() === job.rider_no) {
        drawJob(this.layer, job);
      }
    }
    fitToLayer(this.map, this.layer);
  }

  // ลิงก์ไปหน้าใบงานไรเดอร์
  jobLink(job: RiderJob) {
    return { job: job.id };
  }

  private showError(error: unknown) {
    this.errorMessage.set(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
  }
}
