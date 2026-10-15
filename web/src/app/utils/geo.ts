// ลิงก์นำทาง Google Maps จากตำแหน่งปัจจุบันไปยังจุดหมาย
export function navigateLink(lat: number, lng: number): string {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
}
