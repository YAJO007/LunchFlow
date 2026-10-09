import { AfterViewInit, Component, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Api } from '../../services/api';
import { RiderJob } from '../../models';
import { addShopMarker, createMap, drawJob, fitToLayer } from '../../utils/map';

@Component({
  selector: 'app-rider',
  imports: [FormsModule],
  templateUrl: './rider.html',
})
export class Rider implements AfterViewInit {

  jobFromUrl = input<string | undefined>(undefined, { alias: 'job' });

  jobNumber = model('');
  job = signal<RiderJob | null>(null);
  errorMessage = signal('');
  loading = signal(false);

  private map!: L.Map;
  private layer = L.featureGroup();

  constructor(private api: Api) {}

  ngAfterViewInit() {
    this.map = createMap('rider-map');
    this.layer.addTo(this.map);
    addShopMarker(this.layer);

    const fromUrl = this.jobFromUrl();
    if (fromUrl) {
      this.jobNumber.set(fromUrl);
      this.findJob();
    }
  }

  async findJob() {
    this.errorMessage.set('');
    if (!this.jobNumber()) {
      this.errorMessage.set('กรุณากรอกเลขใบงาน');
      return;
    }
    this.loading.set(true);
    try {
      const job = await this.api.getJob(Number(this.jobNumber()));
      this.job.set(job);
      this.layer.clearLayers();
      addShopMarker(this.layer);
      drawJob(this.layer, job);
      fitToLayer(this.map, this.layer);
    } catch (error) {
      this.job.set(null);
      this.errorMessage.set('ไม่พบใบงานเลขนี้ กรุณาตรวจสอบอีกครั้ง');
    }
    this.loading.set(false);
  }
}
