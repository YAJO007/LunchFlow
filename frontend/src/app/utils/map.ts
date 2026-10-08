// ฟังก์ชันช่วยวาดแผนที่ด้วย Leaflet (https://leafletjs.com)
// แต่ละหน้าเรียกใช้ฟังก์ชันพวกนี้ จะได้ไม่ต้องเขียนโค้ดแผนที่ซ้ำ
import * as L from 'leaflet';
import { RiderJob } from '../models';

// พิกัดร้าน (มหาวิทยาลัยมหาสารคาม) ตรงกับ config/shop.ts ฝั่ง Backend
export const SHOP_LAT = 16.2459;
export const SHOP_LNG = 103.2525;

// สร้างแผนที่ในกล่อง <div id="..."> แล้วตั้งจุดกลางที่ร้าน
export function createMap(elementId: string): L.Map {
  const map = L.map(elementId).setView([SHOP_LAT, SHOP_LNG], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  return map;
}

// หมุดร้าน
export function addShopMarker(layer: L.LayerGroup) {
  const icon = L.divIcon({ className: 'map-shop', html: '🏪', iconSize: [28, 28] });
  L.marker([SHOP_LAT, SHOP_LNG], { icon: icon }).bindTooltip('ร้านข้าวกล่อง').addTo(layer);
}

// หมุดวงกลมมีตัวเลข/ตัวอักษรข้างใน
export function addPin(
  layer: L.LayerGroup,
  lat: number,
  lng: number,
  color: string,
  label: string,
  popupText: string,
): L.Marker {
  const icon = L.divIcon({
    className: '',
    html: '<div class="map-pin" style="background:' + color + '">' + label + '</div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
  return L.marker([lat, lng], { icon: icon }).bindPopup(popupText).addTo(layer);
}

// วาดเส้นทางของไรเดอร์ 1 คน: ร้าน -> จุดที่ 1 -> จุดที่ 2 -> ...
export function drawJob(layer: L.LayerGroup, job: RiderJob) {
  const points: L.LatLngExpression[] = [[SHOP_LAT, SHOP_LNG]];
  for (const stop of job.stops) {
    points.push([stop.latitude, stop.longitude]);
  }
  L.polyline(points, { color: job.color, weight: 5, opacity: 0.85 })
    .bindTooltip('ไรเดอร์คนที่ ' + job.rider_no)
    .addTo(layer);

  for (const stop of job.stops) {
    addPin(
      layer,
      stop.latitude,
      stop.longitude,
      job.color,
      String(stop.stop_no),
      '<b>ไรเดอร์ ' + job.rider_no + ' • จุดที่ ' + stop.stop_no + '</b><br>' +
        stop.customer_name + ' (' + stop.quantity + ' กล่อง)<br>ถึงประมาณ ' + stop.arrival_time,
    );
  }
}

// ซูมแผนที่ให้เห็นทุกจุดในเลเยอร์
export function fitToLayer(map: L.Map, layer: L.FeatureGroup) {
  const bounds = layer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}
