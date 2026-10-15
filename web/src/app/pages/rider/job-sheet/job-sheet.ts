import { Component, input, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { RiderJob, RouteStop } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { km } from '../../../utils/format';
import { navigateLink } from '../../../utils/geo';

// หน้าใบงานไรเดอร์: จำนวนกล่อง ลำดับจุดส่ง เบอร์โทร นำทาง และบันทึกส่งสำเร็จ
@Component({
  selector: 'app-job-sheet',
  imports: [RouterModule, RouteMap],
  templateUrl: './job-sheet.html',
  styleUrl: './job-sheet.css',
})
export class JobSheet implements OnInit {
  // รับเลขใบงานจาก path /rider/job/:id (ตามบทเรียน 04-Dynamic path and query params)
  id = input.required<string>();

  job = signal<RiderJob | undefined>(undefined);
  error = signal('');
  delivered = signal<number[]>([]); // เลขจุดส่งที่ส่งแล้ว

  km = km;
  navigateLink = navigateLink;

  constructor(
    private api: Api,
    public appData: AppData,
  ) {}

  // ngOnInit ทำงานหลังจาก Angular ใส่ค่า id จาก URL ให้แล้ว
  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const job = await this.api.getJob(Number(this.id()));
      this.job.set(job);
      this.delivered.set(this.appData.deliveredOf(job.id!));
    } catch (error: any) {
      this.error.set(error.message);
    }
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
    this.appData.saveDelivered(this.job()!.id!, list);
  }
}
