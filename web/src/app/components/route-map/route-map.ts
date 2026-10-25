import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DEFAULT_SHOP } from '../../config/shop';
import { RiderJob } from '../../model/route';
import { Shop } from '../../model/shop';

export interface MapPoint {
  lat: number;
  lng: number;
  color: string;
}

export interface Tile {
  url: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-route-map',
  imports: [],
  templateUrl: './route-map.html',
  styleUrl: './route-map.css',
})
export class RouteMap {
  @Input() jobs: RiderJob[] = [];
  @Input() points: MapPoint[] = [];
  @Input() shop: Shop = DEFAULT_SHOP;
  @Input() selectable = false;
  @Output() pointSelected = new EventEmitter<MapPoint>();

  size = 400;

  worldX(lng: number, zoom: number): number {
    return ((lng + 180) / 360) * 256 * Math.pow(2, zoom);
  }

  worldY(lat: number, zoom: number): number {
    const rad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 256 * Math.pow(2, zoom);
  }

  allLatLng(): number[][] {
    const list = [[this.shop.latitude, this.shop.longitude]];
    if (this.selectable) {
      return list;
    }
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

  zoom(): number {
    if (this.selectable) {
      return 13;
    }
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

  centerX(): number {
    const xs = this.allLatLng().map((p) => this.worldX(p[1], this.zoom()));
    return (Math.max(...xs) + Math.min(...xs)) / 2;
  }

  centerY(): number {
    const ys = this.allLatLng().map((p) => this.worldY(p[0], this.zoom()));
    return (Math.max(...ys) + Math.min(...ys)) / 2;
  }

  x(lng: number): number {
    return this.worldX(lng, this.zoom()) - this.centerX() + this.size / 2;
  }

  y(lat: number): number {
    return this.worldY(lat, this.zoom()) - this.centerY() + this.size / 2;
  }

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

  linePoints(job: RiderJob): string {
    let text = this.x(this.shop.longitude) + ',' + this.y(this.shop.latitude);
    for (const stop of job.stops) {
      text += ' ' + this.x(stop.longitude) + ',' + this.y(stop.latitude);
    }
    return text;
  }

  selectPoint(event: MouseEvent) {
    if (!this.selectable) {
      return;
    }

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.size;
    const y = ((event.clientY - rect.top) / rect.height) * this.size;
    const worldSize = 256 * Math.pow(2, this.zoom());
    const worldX = this.centerX() + x - this.size / 2;
    const worldY = this.centerY() + y - this.size / 2;
    const lng = (worldX / worldSize) * 360 - 180;
    const mercatorY = Math.PI - (2 * Math.PI * worldY) / worldSize;
    const lat = (180 / Math.PI) * Math.atan(Math.sinh(mercatorY));

    this.pointSelected.emit({ lat, lng, color: '#1e8e3e' });
  }
}
