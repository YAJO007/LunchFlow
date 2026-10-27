import { Injectable, signal } from '@angular/core';
import { DEFAULT_SHOP } from '../config/shop';
import { Rider, RiderPostRequest, RiderPutRequest } from '../model/rider';
import { Shop } from '../model/shop';
import { Api } from './api';
import { Notify } from './notify';

@Injectable({
  providedIn: 'root',
})
export class AppData {
  shop = signal<Shop>(DEFAULT_SHOP);
  riders = signal<Rider[]>([]);

  constructor(
    private api: Api,
    private notify: Notify,
  ) {
    this.loadRiders().catch((error: any) => this.notify.apiError(error));
  }

  async loadRiders() {
    this.riders.set(await this.api.getRiders());
  }

  async addRider(rider: RiderPostRequest) {
    await this.api.addRider(rider);
    await this.loadRiders();
  }

  async updateRider(no: number, rider: RiderPutRequest) {
    await this.api.updateRider(no, rider);
    await this.loadRiders();
  }

  async deleteRider(no: number) {
    await this.api.deleteRider(no);
    await this.loadRiders();
  }

  availableRiders(): Rider[] {
    return this.riders().filter((r) => r.available);
  }

  riderOf(riderNo: number): Rider | undefined {
    return this.availableRiders()[riderNo - 1];
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('owner') === 'owner';
  }

  login(username: string, password: string): boolean {
    if (username === 'owner' && password === '1234') {
      sessionStorage.setItem('owner', username);
      return true;
    }
    return false;
  }

  logout() {
    sessionStorage.removeItem('owner');
  }

  deliveredOf(jobId: number): number[] {
    const saved = localStorage.getItem('delivered-' + jobId);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  }

  saveDelivered(jobId: number, stopNos: number[]) {
    localStorage.setItem('delivered-' + jobId, JSON.stringify(stopNos));
  }
}