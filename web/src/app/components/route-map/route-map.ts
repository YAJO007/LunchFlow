import { Component, Input } from '@angular/core';
import { DEFAULT_SHOP } from '../../config/shop';
import { RiderJob } from '../../model/route';
import { Shop } from '../../model/shop';

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
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
  @Input() highlight: number = 0;

  size = 400;
  rings = [1, 2, 3];

  private kmX(lng: number): number {
    return (lng - this.shop.longitude) * 111.32 * Math.cos((this.shop.latitude * Math.PI) / 180);
  }

  private kmY(lat: number): number {
    return (lat - this.shop.latitude) * 110.57;
  }

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

  x(lng: number): number {
    return this.size / 2 + this.kmX(lng) * this.scale();
  }

  y(lat: number): number {
    return this.size / 2 - this.kmY(lat) * this.scale();
  }

  linePoints(job: RiderJob): string {
    let text = this.x(this.shop.longitude) + ',' + this.y(this.shop.latitude);
    for (const stop of job.stops) {
      text += ' ' + this.x(stop.longitude) + ',' + this.y(stop.latitude);
    }
    return text;
  }

  isDim(job: RiderJob): boolean {
    return this.highlight !== 0 && this.highlight !== job.rider_no;
  }
}
