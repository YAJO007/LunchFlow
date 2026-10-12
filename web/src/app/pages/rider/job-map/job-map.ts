import { Component, input, signal, OnChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteMap } from '../../../components/route-map/route-map';
import { RiderJob } from '../../../model/route';
import { Api } from '../../../service/api';
import { AppData } from '../../../service/app-data';
import { km } from '../../../utils/format';
import { navigateLink } from '../../../utils/geo';

// หน้าแผนที่นำทางของใบงาน
@Component({
  selector: 'app-job-map',
  imports: [RouterModule, RouteMap],
  templateUrl: './job-map.html',
  styleUrl: './job-map.css',
})
export class JobMap implements OnChanges {
  id = input.required<string>(); // path /rider/map/:id

  job = signal<any>(undefined); // RiderJob
  loading = signal(true);
  error = signal('');

  km = km;
  navigateLink = navigateLink;

  constructor(
    private api: Api,
    public appData: AppData,
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
    } catch (error: any) {
      if (id !== this.id()) return;
      this.job.set(undefined);
      this.error.set(error.message);
    }
    // โหลดพิกัดร้าน (ถ้าไม่ได้ ใช้ค่าเริ่มต้น)
    try {
      this.appData.shop.set(await this.api.getShop());
    } catch (error) {}
    if (id === this.id()) this.loading.set(false);
  }

  j(): RiderJob {
    return this.job() as RiderJob;
  }
}
