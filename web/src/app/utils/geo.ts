export function navigateLink(lat: number, lng: number): string {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
}

// ระยะเส้นตรง (กม.) สูตรเดียวกับ API
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  let earthRadiusKm = 6371;
  let dLat = ((lat2 - lat1) * Math.PI) / 180;
  let dLng = ((lng2 - lng1) * Math.PI) / 180;
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
