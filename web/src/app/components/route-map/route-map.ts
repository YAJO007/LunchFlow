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

// รูปแผนที่ 1 แผ่น (OpenStreetMap แบ่งแผนที่เป็นรูปสี่เหลี่ยมขนาด 256 x 256)
export interface Tile {
  url: string;
  x: number;
  y: number;
}

// แผนที่เส้นทาง: ใช้รูปแผนที่จาก OpenStreetMap เป็นพื้นหลัง แล้ววาดเส้นทางทับด้วย SVG
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

  size = 400; // ขนาดของแผนที่ (หน่วยใน SVG)

  // แปลงพิกัดเป็นตำแหน่งบนแผนที่โลก (สูตร Web Mercator ที่ Google Maps และ OpenStreetMap ใช้)
  worldX(lng: number, zoom: number): number {
    return ((lng + 180) / 360) * 256 * Math.pow(2, zoom);
  }

  worldY(lat: number, zoom: number): number {
    const rad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 256 * Math.pow(2, zoom);
  }

  // พิกัดทุกจุดที่ต้องแสดง (ร้าน + บ้านลูกค้า + จุดส่ง)
  allLatLng(): number[][] {
    const list = [[this.shop.latitude, this.shop.longitude]];
    for (const p of this.points) {
      list.push([p.lat, p.lng]);
    }
    for (const job of this.jobs) {
      for (const stop of job.stops) {
        list.push([stop.latitude, stop.longitude]);
      }
    }
    return list;
  }

  // เลือกระดับซูมที่ใกล้ที่สุดที่ยังเห็นทุกจุด
  zoom(): number {
    const list = this.allLatLng();
    for (let z = 17; z > 10; z--) {
      const xs = list.map((p) => this.worldX(p[1], z));
      const ys = list.map((p) => this.worldY(p[0], z));
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      if (width < this.size - 40 && height < this.size - 40) {
        return z;
      }
    }
    return 10;
  }

  // จุดกึ่งกลางของแผนที่ (ตำแหน่งบนแผนที่โลก)
  centerX(): number {
    const xs = this.allLatLng().map((p) => this.worldX(p[1], this.zoom()));
    return (Math.max(...xs) + Math.min(...xs)) / 2;
  }

  centerY(): number {
    const ys = this.allLatLng().map((p) => this.worldY(p[0], this.zoom()));
    return (Math.max(...ys) + Math.min(...ys)) / 2;
  }

  // แปลงพิกัดเป็นตำแหน่งบน SVG
  x(lng: number): number {
    return this.worldX(lng, this.zoom()) - this.centerX() + this.size / 2;
  }

  y(lat: number): number {
    return this.worldY(lat, this.zoom()) - this.centerY() + this.size / 2;
  }

  // รูปแผนที่ทุกแผ่นที่ต้องใช้ให้เต็มกรอบ
  tiles(): Tile[] {
    const z = this.zoom();
    const left = this.centerX() - this.size / 2;
    const top = this.centerY() - this.size / 2;
    const list: Tile[] = [];
    for (let tx = Math.floor(left / 256); tx <= Math.floor((left + this.size) / 256); tx++) {
      for (let ty = Math.floor(top / 256); ty <= Math.floor((top + this.size) / 256); ty++) {
        list.push({
          url: 'https://tile.openstreetmap.org/' + z + '/' + tx + '/' + ty + '.png',
          x: tx * 256 - left,
          y: ty * 256 - top,
        });
      }
    }
    return list;
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
