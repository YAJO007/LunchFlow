import { Component, Input } from '@angular/core';
import { DEFAULT_SHOP } from '../../config/shop';
import { RiderJob } from '../../model/route';
import { Shop } from '../../model/shop';

// จุดที่จะปักบนแผนที่ (เช่น บ้านลูกค้า)
export interface MapPoint {
  lat: number;
  lng: number;
  color: string;
}

// รูปแผนที่ 1 แผ่น (ขนาด 256x256) จาก OpenStreetMap และตำแหน่งที่จะวาง
export interface Tile {
  url: string;
  x: number;
  y: number;
}

// แผนที่: เอารูปแผนที่จาก OpenStreetMap มาเรียงเป็นพื้นหลัง
// แล้ววาดเส้นทางไรเดอร์และจุดต่าง ๆ ทับด้วย <svg>
@Component({
  selector: 'app-route-map',
  imports: [],
  templateUrl: './route-map.html',
  styleUrl: './route-map.css',
})
export class RouteMap {
  @Input() jobs: RiderJob[] = []; // ใบงานไรเดอร์ (วาดเป็นเส้นแยกสี)
  @Input() points: MapPoint[] = []; // จุดเดี่ยว ๆ (เช่น บ้านลูกค้า)
  @Input() shop: Shop = DEFAULT_SHOP; // ร้าน (จุดสีดำ)

  size = 400; // แผนที่กว้าง x สูง 400 หน่วย

  // แปลงลองจิจูดเป็นตำแหน่งแนวนอน (x) บนแผนที่โลก ตามสูตรของ OpenStreetMap
  worldX(lng: number, zoom: number): number {
    return ((lng + 180) / 360) * 256 * Math.pow(2, zoom);
  }

  // แปลงละติจูดเป็นตำแหน่งแนวตั้ง (y) บนแผนที่โลก ตามสูตรของ OpenStreetMap
  worldY(lat: number, zoom: number): number {
    const rad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 256 * Math.pow(2, zoom);
  }

  // รวมพิกัดทุกจุดที่ต้องแสดง [ละติจูด, ลองจิจูด]
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

  // เลือกระดับซูมที่ใกล้ที่สุดที่ยังเห็นทุกจุดในกรอบ (ลองจากซูม 17 ลงไปเรื่อย ๆ)
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

  // จุดกึ่งกลางของทุกจุด (ใช้เป็นกลางแผนที่)
  centerX(): number {
    const xs = this.allLatLng().map((p) => this.worldX(p[1], this.zoom()));
    return (Math.max(...xs) + Math.min(...xs)) / 2;
  }

  centerY(): number {
    const ys = this.allLatLng().map((p) => this.worldY(p[0], this.zoom()));
    return (Math.max(...ys) + Math.min(...ys)) / 2;
  }

  // ตำแหน่งบนกรอบแผนที่ของเรา (0 - 400)
  x(lng: number): number {
    return this.worldX(lng, this.zoom()) - this.centerX() + this.size / 2;
  }

  y(lat: number): number {
    return this.worldY(lat, this.zoom()) - this.centerY() + this.size / 2;
  }

  // รายการรูปแผนที่ที่ต้องโหลดมาเรียงให้เต็มกรอบ
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

  // จุดของเส้นทางไรเดอร์ 1 คน ได้ข้อความแบบ "x1,y1 x2,y2 ..." เอาไปใช้กับ <polyline>
  // ถ้า API ส่งเส้นทางตามถนน (path) มา ให้วาดตามถนน
  // ถ้าไม่มี ให้ลากเส้นตรง ร้าน → จุดที่ 1 → จุดที่ 2 → ...
  linePoints(job: RiderJob): string {
    if (job.path && job.path.length > 0) {
      return job.path.map((p) => this.x(p[1]) + ',' + this.y(p[0])).join(' ');
    }

    let text = this.x(this.shop.longitude) + ',' + this.y(this.shop.latitude);
    for (const stop of job.stops) {
      text += ' ' + this.x(stop.longitude) + ',' + this.y(stop.latitude);
    }
    return text;
  }
}
