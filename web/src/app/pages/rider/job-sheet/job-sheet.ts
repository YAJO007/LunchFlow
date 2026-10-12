import { Component, input, signal, OnChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RiderJob, RouteStop } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { km, money } from '../../../utils/format';
import { navigateLink } from '../../../utils/geo';

// หน้าใบงานไรเดอร์: จำนวนกล่อง ลำดับจุดส่ง เบอร์โทร และบันทึกส่งสำเร็จ
@Component({
  selector: 'app-job-sheet',
  imports: [RouterModule],
  templateUrl: './job-sheet.html',
  styleUrl: './job-sheet.css',
})
export class JobSheet implements OnChanges {
  // รับเลขใบงานจาก path /rider/job/:id (ตามบทเรียน 04)
  id = input.required<string>();

  job = signal<any>(undefined); // RiderJob
  loading = signal(true);
  error = signal('');
  delivered = signal<number[]>([]); // stop_no ที่ส่งแล้ว

  km = km;
  money = money;
  navigateLink = navigateLink;

  constructor(
    private api: Api,
    private appData: AppData,
  ) {}

  ngOnChanges() {
    this.load();
  }

  async load() {
    const id = this.id();
    this.loading.set(true);
    try {
      if (!/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        throw new Error('เลขใบงานต้องเป็นจำนวนเต็มบวก');
      }
      const job = await this.api.getJob(Number(id));
      if (id !== this.id()) return;
      this.job.set(job);
      this.error.set('');
      this.delivered.set(this.appData.deliveredOf(job.id!).filter((no) => job.stops.some((s) => s.stop_no === no)));
      this.saveRecent(String(job.id));
    } catch (error: any) {
      if (id !== this.id()) return;
      this.job.set(undefined);
      this.error.set(error.message);
    }
    this.loading.set(false);
  }

  // จำเลขใบงานที่เคยเปิดไว้ (สูงสุด 5 ใบ)
  saveRecent(no: string) {
    let list = this.appData.recentJobs();
    list = [no, ...list.filter((x) => x !== no)].slice(0, 5);
    localStorage.setItem('recentJobs', JSON.stringify(list));
  }

  j(): RiderJob {
    return this.job() as RiderJob;
  }

  isDelivered(stop: RouteStop): boolean {
    return this.delivered().includes(stop.stop_no);
  }

  // กดส่งแล้ว / ยกเลิก
  toggleDelivered(stop: RouteStop) {
    let list = this.delivered();
    if (this.isDelivered(stop)) {
      list = list.filter((no) => no !== stop.stop_no);
    } else {
      list = [...list, stop.stop_no];
    }
    this.delivered.set(list);
    this.appData.saveDelivered(this.j().id!, list);
  }

  // จุดถัดไปที่ยังไม่ได้ส่ง
  nextStop(): RouteStop | undefined {
    return this.j().stops.find((s) => !this.isDelivered(s));
  }

  deliveredBox(): number {
    let sum = 0;
    for (const s of this.j().stops) {
      if (this.isDelivered(s)) {
        sum += s.quantity;
      }
    }
    return sum;
  }

  progress(): number {
    return this.j().stops.length === 0 ? 0 : (this.delivered().length / this.j().stops.length) * 100;
  }
}
