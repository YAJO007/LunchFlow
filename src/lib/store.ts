import type { Customer, Order, Rider, Store } from '../types.ts';

export const findCustomer = (store: Store, customerId: string): Customer | undefined =>
  store.customers.find((customer) => customer.id === customerId);

export const customerForOrder = (store: Store, order: Order): Customer | undefined =>
  findCustomer(store, order.customerId);

export const findOrder = (store: Store, orderId: string): Order | undefined =>
  store.orders.find((order) => order.id === orderId);

export const findRider = (store: Store, riderId: string): Rider | undefined =>
  store.riders.find((rider) => rider.id === riderId);
