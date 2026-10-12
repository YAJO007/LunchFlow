// ฟังก์ชันช่วยจัดรูปแบบตัวเลขให้อ่านง่าย

// เงินบาท เช่น 1234.5 => "1,234.50"
export function money(value: number): string {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// จำนวนเต็มมีคอมมา เช่น 3185 => "3,185"
export function int(value: number): string {
  return Number(value || 0).toLocaleString('th-TH');
}

// ระยะทาง เช่น 2.456 => "2.46"
export function km(value: number): string {
  return Number(value || 0).toFixed(2);
}

// วันเวลาแบบไทย เช่น "12 ต.ค. 69 11:30"
export function dateTime(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// แปลง "11:30" เป็นจำนวนนาที เพื่อเอาไปเทียบเวลา
export function toMinutes(time: string): number {
  const parts = time.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}
