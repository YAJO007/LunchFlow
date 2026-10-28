import { RiderJob } from '../model/route';
export function money(value: number): string {
  return Number(value).toFixed(2);
}

export function km(value: number): string {
  return Number(value).toFixed(2);
}

// ชื่อไรเดอร์ (ไม่กรอก = "ไรเดอร์ 1")
export function riderName(job: RiderJob): string {
  if (job.rider_name) {
    return job.rider_name;
  }
  return 'ไรเดอร์ ' + job.rider_no;
}

export function dateTime(value: string | undefined): string {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('th-TH');
}
