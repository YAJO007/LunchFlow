import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createId, createTrips } from './route-planner.ts';
import { readStore, saveStore } from './store.ts';
import { InputError, parseCustomer, parseOrder } from './validation.ts';
import type { Customer, Order } from '../src/types.ts';

const app = express();
const port = Number(process.env.PORT || 4173);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.get('/api/state', async (_request, response) => response.json(await readStore()));

app.post('/api/customers', async (request, response) => {
  const store = await readStore();
  const customer: Customer = { id: createId('CUS'), ...parseCustomer(request.body) };
  store.customers.push(customer);
  await saveStore(store);
  response.status(201).json(customer);
});

app.delete('/api/customers/:id', async (request, response) => {
  const store = await readStore();
  if (store.orders.some((order) => order.customerId === request.params.id)) {
    response.status(409).json({ message: 'ลูกค้ารายนี้มีออเดอร์อยู่ จึงยังลบไม่ได้' });
    return;
  }
  store.customers = store.customers.filter((customer) => customer.id !== request.params.id);
  await saveStore(store);
  response.status(204).end();
});

app.post('/api/orders', async (request, response) => {
  const store = await readStore();
  const input = parseOrder(request.body);
  if (!store.customers.some((customer) => customer.id === input.customerId)) {
    throw new InputError('ไม่พบลูกค้าที่เลือก');
  }
  const order: Order = {
    id: `ORD-${String(Date.now()).slice(-6)}`,
    ...input,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  store.orders.unshift(order);
  await saveStore(store);
  response.status(201).json(order);
});

app.delete('/api/orders/:id', async (request, response) => {
  const store = await readStore();
  const order = store.orders.find((item) => item.id === request.params.id);
  if (!order || order.status !== 'pending') {
    response.status(409).json({ message: 'ลบได้เฉพาะออเดอร์ที่ยังไม่ได้จัดรอบส่ง' });
    return;
  }
  store.orders = store.orders.filter((item) => item.id !== request.params.id);
  await saveStore(store);
  response.status(204).end();
});

app.post('/api/dispatch', async (_request, response) => {
  const store = await readStore();
  const trips = createTrips(store);
  if (!trips.length) {
    response.status(409).json({ message: 'ไม่มีออเดอร์ใหม่สำหรับจัดรอบส่ง' });
    return;
  }
  const assigned = new Set(trips.flatMap((trip) => trip.orderIds));
  store.orders.forEach((order) => {
    if (assigned.has(order.id)) order.status = 'assigned';
  });
  store.trips.push(...trips);
  await saveStore(store);
  response.status(201).json(trips);
});

app.patch('/api/trips/:tripId/start', async (request, response) => {
  const store = await readStore();
  const trip = store.trips.find((item) => item.id === request.params.tripId);
  if (!trip) return response.status(404).json({ message: 'ไม่พบรอบส่ง' });
  trip.status = 'on-route';
  await saveStore(store);
  response.json(trip);
});

app.patch('/api/trips/:tripId/deliver/:orderId', async (request, response) => {
  const store = await readStore();
  const trip = store.trips.find((item) => item.id === request.params.tripId);
  const order = store.orders.find((item) => item.id === request.params.orderId);
  if (!trip || !order || !trip.orderIds.includes(order.id)) {
    return response.status(404).json({ message: 'ไม่พบจุดส่งในรอบนี้' });
  }
  order.status = 'delivered';
  if (trip.orderIds.every((id) => store.orders.find((item) => item.id === id)?.status === 'delivered')) {
    trip.status = 'completed';
  } else if (trip.status === 'ready') {
    trip.status = 'on-route';
  }
  await saveStore(store);
  response.json({ trip, order });
});

const distPath = resolve(process.cwd(), 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((request, response, next) => {
    if (request.method === 'GET' && !request.path.startsWith('/api')) {
      response.sendFile(resolve(distPath, 'index.html'));
      return;
    }
    next();
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const isInputError = error instanceof InputError;
  const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดภายในระบบ';
  response.status(isInputError ? 400 : 500).json({ message });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`LunchRoute API ready at http://127.0.0.1:${port}`);
});
