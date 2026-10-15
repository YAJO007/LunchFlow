import { Component, Input } from '@angular/core';
import { DEFAULT_SHOP } from '../../config/shop';
import { RiderJob } from '../../model/route';
import { Shop } from '../../model/shop';

// จุดทั่วไปที่จะแสดงบนแผนที่ (เช่น บ้านลูกค้า)
export interface MapPoint {
  lat: number;
  lng: number;
  color: string;
}

// แผนที่เส้นทางแบบ SVG วาดจากพิกัดจริง (ร้านอยู่ตรงกลาง วงกลมคือรัศมี 1, 2, 3 กม.)
// ใช้แค่ data binding + @for ตามบทเรียน ไม่ต้องติดตั้งไลบรารีแผนที่เพิ่ม
@Component({
  selector: 'app-route-map',
  imports: [],
  templateUrl: './route-map.html',
  styleUrl: './route-map.css',
})
export class RouteMap {
  @Input() jobs: RiderJob[] = []; // ใบงานที่จะวาดเส้นทาง
  @Input() points: MapPoint[] = []; // จุดทั่วไป
  @Input() shop: Shop = DEFAULT_SHOP;

  size = 400; // ขนาด viewBox ของ SVG
  rings = [1, 2, 3]; // วงรัศมี (กม.)

  // ระยะทางจากร้าน (กม.) ในแนวแกน x และ y
  private kmX(lng: number): number {
    return (lng - this.shop.longitude) * 111.32 * Math.cos((this.shop.latitude * Math.PI) / 180);
  }

  private kmY(lat: number): number {
    return (lat - this.shop.latitude) * 110.57;
  }

  // หาว่าต้องย่อแผนที่เท่าไหร่ ให้ทุกจุดอยู่ในกรอบ (กี่พิกเซลต่อ 1 กม.)
  scale(): number {
    let maxKm = 3.3;
    for (const job of this.jobs) {
      for (const stop of job.stops) {
        maxKm = Math.max(maxKm, Math.abs(this.kmX(stop.longitude)), Math.abs(this.kmY(stop.latitude)));
      }
    }
    for (const p of this.points) {
      maxKm = Math.max(maxKm, Math.abs(this.kmX(p.lng)), Math.abs(this.kmY(p.lat)));
    }
    return (this.size / 2 - 18) / maxKm;
  }

  // แปลงพิกัดเป็นตำแหน่งบน SVG
  x(lng: number): number {
    return this.size / 2 + this.kmX(lng) * this.scale();
  }

  y(lat: number): number {
    return this.size / 2 - this.kmY(lat) * this.scale();
  }

  // จุดของเส้นทาง: เริ่มที่ร้าน แล้วไปตามลำดับจุดส่ง
  linePoints(job: RiderJob): string {
    let text = this.x(this.shop.longitude) + ',' + this.y(this.shop.latitude);
    for (const stop of job.stops) {
      text += ' ' + this.x(stop.longitude) + ',' + this.y(stop.latitude);
    }
    return text;
  }
}
