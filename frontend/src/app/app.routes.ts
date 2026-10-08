import { Routes } from '@angular/router';
import { Customers } from './pages/customers/customers';
import { Orders } from './pages/orders/orders';
import { RoutePlanning } from './pages/routes/routes';
import { Rider } from './pages/rider/rider';

export const routes: Routes = [
  { path: '', redirectTo: 'routes', pathMatch: 'full' },
  { path: 'customers', component: Customers }, // จัดการลูกค้า
  { path: 'orders', component: Orders }, // จัดการออเดอร์
  { path: 'routes', component: RoutePlanning }, // จัดเส้นทางจัดส่ง
  { path: 'rider', component: Rider }, // ใบงานไรเดอร์ (เปิดบนมือถือ)
  { path: '**', redirectTo: 'routes' },
];
