// ฟังก์ชันช่วยจัดรูปแบบตัวเลขให้อ่านง่าย

// เงินบาท เช่น 1234.5 => "1234.50"
export function money(value: number): string {
  return Number(value).toFixed(2);
}

// ระยะทาง เช่น 2.456 => "2.46"
export function km(value: number): string {
  return Number(value).toFixed(2);
}

// วันเวลาแบบไทย
export function dateTime(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('th-TH');
}
