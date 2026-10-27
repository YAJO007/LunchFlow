import { Component, inject, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { RiderJob } from '../../../model/route';
import { RouteApi } from '../../../services/api/route-api';
import { AppData } from '../../../service/app-data';
import { km, riderName } from '../../../utils/format';
import { navigateLink } from '../../../utils/geo';

@Component({
  selector: 'app-job-sheet',
  imports: [RouterModule, RouteMap],
  templateUrl: './job-sheet.html',
  styleUrl: './job-sheet.css',
})
export class JobSheet {
  routeApi = inject(RouteApi);

  id = input.required<string>();

  job = signal<RiderJob | undefined>(undefined);
  error = signal('');

  km = km;
  riderName = riderName;
  navigateLink = navigateLink;

  constructor(
    public appData: AppData,
  ) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const job = await this.routeApi.getJob(Number(this.id()));
      this.job.set(job);
    } catch (error: any) {
      this.error.set('ไม่พบใบงานนี้ หรือเชื่อมต่อ API ไม่ได้');
    }
  }
}
