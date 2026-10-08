import * as L from 'leaflet';
import { RiderJob } from '../models';

export const SHOP_LAT = 16.2459;
export const SHOP_LNG = 103.2525;

export function createMap(elementId: string): L.Map {
  const map = L.map(elementId).setView([SHOP_LAT, SHOP_LNG], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  return map;
}

export function addShopMarker(layer: L.LayerGroup) {
  const icon = L.divIcon({ className: 'map-shop', html: '🏪', iconSize: [28, 28] });
  L.marker([SHOP_LAT, SHOP_LNG], { icon: icon }).bindTooltip('ร้านข้าวกล่อง').addTo(layer);
}

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

export function fitToLayer(map: L.Map, layer: L.FeatureGroup) {
  const bounds = layer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}
