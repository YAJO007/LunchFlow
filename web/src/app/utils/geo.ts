export function navigateLink(lat: number, lng: number): string {
  return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
}
