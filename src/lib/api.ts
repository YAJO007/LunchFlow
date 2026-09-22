import type { Customer, Order, Store, Trip } from '../types.ts';

type NewCustomer = Omit<Customer, 'id'>;
type NewOrder = Pick<Order, 'customerId' | 'boxes' | 'menu' | 'note' | 'payment'>;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }));
    throw new Error(payload.message);
  }

  return response.status === 204 ? undefined as T : response.json();
}

function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export const api = {
  getState: () => request<Store>('/api/state'),
  addCustomer: (customer: NewCustomer) => send<Customer>('/api/customers', 'POST', customer),
  deleteCustomer: (id: string) => send<void>(`/api/customers/${id}`, 'DELETE'),
  addOrder: (order: NewOrder) => send<Order>('/api/orders', 'POST', order),
  deleteOrder: (id: string) => send<void>(`/api/orders/${id}`, 'DELETE'),
  dispatch: () => send<Trip[]>('/api/dispatch', 'POST'),
  startTrip: (id: string) => send<Trip>(`/api/trips/${id}/start`, 'PATCH'),
  deliverOrder: (tripId: string, orderId: string) =>
    send<{ trip: Trip; order: Order }>(`/api/trips/${tripId}/deliver/${orderId}`, 'PATCH')
};
