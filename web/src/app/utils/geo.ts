// ฟังก์ชันช่วยคำนวณระยะทางจากพิกัด และสร้างลิงก์ Google Maps

// คำนวณระยะทางเส้นตรงระหว่าง 2 พิกัด (สูตร Haversine) ได้ผลเป็นกิโลเมตร
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // รัศมีโลก (กม.)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ลิงก์เปิดตำแหน่งเดียวใน Google Maps
export function mapLink(lat: number, lng: number): string {
  return 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
}

// ลิงก์นำทางจากตำแหน่งปัจจุบันไปยังจุดหมาย
export function navigateLink(lat: number, lng: number): string {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=driving';
}
