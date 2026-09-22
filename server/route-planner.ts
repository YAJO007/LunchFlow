import type { Customer, Order, Store, Trip } from '../src/types.ts';

const SHOP: Pick<Customer, 'lat' | 'lng'> = { lat: 16.4732, lng: 102.8217 };
const MAX_STOPS_PER_TRIP = 3;
const RIDER_SPEED_KM_PER_HOUR = 24;
const MINUTES_PER_STOP = 5;

export function createTrips(store: Store): Trip[] {
  if (!store.riders.length) throw new Error('ต้องมีข้อมูลไรเดอร์อย่างน้อย 1 คน');

  const pendingOrders = store.orders.filter((order) => order.status === 'pending');
  const groups = groupOrdersByNearestStop(store, pendingOrders);

  return groups.map((orders, index) => {
    const distanceKm = calculateRouteDistance(store, orders);
    return {
      id: createId('TRIP'),
      code: `LR-${String(store.trips.length + index + 1).padStart(3, '0')}`,
      riderId: store.riders[index % store.riders.length].id,
      orderIds: orders.map((order) => order.id),
      distanceKm: roundToOneDecimal(distanceKm),
      etaMinutes: calculateEta(distanceKm, orders.length),
      status: 'ready',
      createdAt: new Date().toISOString()
    };
  });
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function groupOrdersByNearestStop(store: Store, orders: Order[]): Order[][] {
  const remaining = [...orders];
  const groups: Order[][] = [];

  while (remaining.length) {
    const group: Order[] = [];
    let currentLocation = SHOP;

    while (group.length < MAX_STOPS_PER_TRIP && remaining.length) {
      remaining.sort((left, right) => {
        const leftCustomer = requiredCustomer(store, left.customerId);
        const rightCustomer = requiredCustomer(store, right.customerId);
        return distanceBetween(currentLocation, leftCustomer) - distanceBetween(currentLocation, rightCustomer);
      });

      const nextOrder = remaining.shift()!;
      group.push(nextOrder);
      currentLocation = requiredCustomer(store, nextOrder.customerId);
    }

    groups.push(group);
  }

  return groups;
}

function calculateRouteDistance(store: Store, orders: Order[]): number {
  let distanceKm = 0;
  let currentLocation = SHOP;

  for (const order of orders) {
    const customer = requiredCustomer(store, order.customerId);
    distanceKm += distanceBetween(currentLocation, customer);
    currentLocation = customer;
  }

  return distanceKm;
}

function requiredCustomer(store: Store, customerId: string): Customer {
  const customer = store.customers.find((item) => item.id === customerId);
  if (!customer) throw new Error(`ไม่พบลูกค้า ${customerId}`);
  return customer;
}

function distanceBetween(a: Pick<Customer, 'lat' | 'lng'>, b: Pick<Customer, 'lat' | 'lng'>): number {
  const latitudeKm = (a.lat - b.lat) * 111;
  const longitudeKm = (a.lng - b.lng) * 106;
  return Math.hypot(latitudeKm, longitudeKm);
}

function calculateEta(distanceKm: number, stopCount: number): number {
  const travelMinutes = (distanceKm / RIDER_SPEED_KM_PER_HOUR) * 60;
  return Math.max(12, Math.ceil(travelMinutes + stopCount * MINUTES_PER_STOP));
}

const roundToOneDecimal = (value: number) => Number(value.toFixed(1));
