import { Routes } from '@angular/router';
import { Customers } from './pages/customers/customers';
import { Orders } from './pages/orders/orders';
import { RoutePlanning } from './pages/routes/routes';
import { Rider } from './pages/rider/rider';

export const routes: Routes = [
  { path: '', redirectTo: 'routes', pathMatch: 'full' },
  { path: 'customers', component: Customers },
  { path: 'orders', component: Orders },
  { path: 'routes', component: RoutePlanning },
  { path: 'rider', component: Rider },
  { path: '**', redirectTo: 'routes' },
];
