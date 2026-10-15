import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Owner } from './pages/owner/owner';
import { Dashboard } from './pages/owner/dashboard/dashboard';
import { Customers } from './pages/owner/customers/customers';
import { Orders } from './pages/owner/orders/orders';
import { Riders } from './pages/owner/riders/riders';
import { RoutePlanning } from './pages/owner/route-planning/route-planning';
import { Report } from './pages/owner/report/report';
import { Rider } from './pages/rider/rider';
import { RiderLogin } from './pages/rider/rider-login/rider-login';
import { JobSheet } from './pages/rider/job-sheet/job-sheet';
import { Pagenotfound } from './pages/pagenotfound/pagenotfound';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  {
    path: 'owner',
    component: Owner,
    children: [
      { path: '', component: Dashboard },
      { path: 'customers', component: Customers },
      { path: 'orders', component: Orders },
      { path: 'riders', component: Riders },
      { path: 'routes', component: RoutePlanning },
      { path: 'report', component: Report },
    ],
  },
  {
    path: 'rider',
    component: Rider,
    children: [
      { path: '', component: RiderLogin },
      { path: 'job/:id', component: JobSheet },
    ],
  },
  { path: '**', component: Pagenotfound },
];
