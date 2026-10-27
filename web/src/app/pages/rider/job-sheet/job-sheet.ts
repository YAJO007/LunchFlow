import { Component, input, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { RiderJob, RouteStop } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { km } from '../../../utils/format';
import { navigateLink } from '../../../utils/geo';

@Component({
  selector: 'app-job-sheet',
  imports: [RouterModule, RouteMap],
  templateUrl: './job-sheet.html',
  styleUrl: './job-sheet.css',
})
export class JobSheet implements OnInit {
  id = input.required<string>();

  job = signal<RiderJob | undefined>(undefined);
  error = signal('');
  delivered = signal<number[]>([]);

  km = km;
  navigateLink = navigateLink;

  constructor(
    private api: Api,
    public appData: AppData,
  ) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const job = await this.api.getJob(Number(this.id()));
      this.job.set(job);
      this.delivered.set(this.appData.deliveredOf(job.id!));
    } catch (error: any) {
      this.error.set('ไม่พบใบงานนี้ หรือเชื่อมต่อ API ไม่ได้');
    }
  }

  isDelivered(stop: RouteStop): boolean {
    return this.delivered().includes(stop.stop_no);
  }

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
