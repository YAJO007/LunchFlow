import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTrips } from './route-planner.ts';
import { createSeedStore } from './seed.ts';

describe('route planner', () => {
  it('assigns every pending order exactly once', () => {
    const store = createSeedStore();
    const trips = createTrips(store);
    const assignedOrderIds = trips.flatMap((trip) => trip.orderIds);
    const pendingOrderIds = store.orders.map((order) => order.id);

    assert.deepEqual([...assignedOrderIds].sort(), [...pendingOrderIds].sort());
    assert.equal(new Set(assignedOrderIds).size, assignedOrderIds.length);
  });

  it('limits each rider trip to three delivery stops', () => {
    const trips = createTrips(createSeedStore());
    assert.ok(trips.every((trip) => trip.orderIds.length <= 3));
  });

  it('does not create trips when there are no pending orders', () => {
    const store = createSeedStore();
    store.orders.forEach((order) => order.status = 'delivered');
    assert.deepEqual(createTrips(store), []);
  });
});
