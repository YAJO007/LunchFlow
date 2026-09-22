export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  zone: string;
  lat: number;
  lng: number;
};

export type OrderStatus = 'pending' | 'assigned' | 'delivered';

export type Order = {
  id: string;
  customerId: string;
  boxes: number;
  menu: string;
  note: string;
  payment: 'paid' | 'cash';
  status: OrderStatus;
  createdAt: string;
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  color: string;
};

export type Trip = {
  id: string;
  code: string;
  riderId: string;
  orderIds: string[];
  distanceKm: number;
  etaMinutes: number;
  status: 'ready' | 'on-route' | 'completed';
  createdAt: string;
};

export type Store = {
  customers: Customer[];
  orders: Order[];
  riders: Rider[];
  trips: Trip[];
};
