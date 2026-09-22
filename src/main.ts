import './styles.css';
import { api } from './lib/api.ts';
import { customerForOrder } from './lib/store.ts';
import { mountIcons } from './ui/icons.ts';
import type { Page, Store } from './types.ts';
import { customersView } from './views/customers.ts';
import { dashboardView } from './views/dashboard.ts';
import { appLayout } from './views/layout.ts';
import { customerModal, orderModal } from './views/modals.ts';
import { ordersView } from './views/orders.ts';
import { riderView } from './views/rider.ts';
import { routesView } from './views/routes.ts';
import { orderTable } from './views/shared.ts';

const emptyStore = (): Store => ({ customers: [], orders: [], riders: [], trips: [] });

class LunchRouteApp {
  private store = emptyStore();
  private page: Page = 'dashboard';
  private selectedTripId = '';
  private toastTimer = 0;

  constructor(private readonly root: HTMLDivElement) {
    this.root.addEventListener('click', (event) => void this.handleClick(event));
    this.root.addEventListener('submit', (event) => void this.handleSubmit(event));
    this.root.addEventListener('input', (event) => this.handleInput(event));
  }

  async start(): Promise<void> {
    this.renderLoading();
    try {
      await this.refresh();
      this.render();
    } catch {
      this.renderConnectionError();
    }
  }

  private async refresh(): Promise<void> {
    this.store = await api.getState();
    this.selectedTripId ||= this.store.trips.find((trip) => trip.status !== 'completed')?.id
      ?? this.store.trips[0]?.id
      ?? '';
  }

  private render(): void {
    this.root.innerHTML = appLayout(this.page, this.currentView());
    mountIcons();
  }

  private currentView(): string {
    const views: Record<Page, () => string> = {
      dashboard: () => dashboardView(this.store),
      orders: () => ordersView(this.store),
      customers: () => customersView(this.store),
      routes: () => routesView(this.store),
      rider: () => riderView(this.store, this.selectedTripId)
    };
    return views[this.page]();
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    const target = event.target as Element;
    const pageButton = target.closest<HTMLElement>('[data-page]');

    if (pageButton) {
      this.page = pageButton.dataset.page as Page;
      this.selectedTripId = pageButton.dataset.trip ?? this.selectedTripId;
      this.render();
      return;
    }

    if (target.closest('[data-menu]')) {
      this.root.querySelector('#sidebar')?.classList.toggle('open');
      return;
    }

    if (target.closest('[data-new-order]')) return this.openModal(orderModal(this.store));
    if (target.closest('[data-new-customer]')) return this.openModal(customerModal());
    if (target.closest('[data-close]')) return this.closeModal();

    const tripSelector = target.closest<HTMLElement>('[data-select-trip]');
    if (tripSelector) {
      this.selectedTripId = tripSelector.dataset.selectTrip!;
      this.render();
      return;
    }

    if (target.closest('[data-dispatch]')) {
      await this.runAction(() => api.dispatch(), 'จัดรอบส่งและมอบหมายไรเดอร์แล้ว');
      return;
    }

    const startButton = target.closest<HTMLElement>('[data-start-trip]');
    if (startButton) {
      await this.runAction(() => api.startTrip(startButton.dataset.startTrip!), 'เริ่มรอบส่งแล้ว');
      return;
    }

    const deliveryButton = target.closest<HTMLElement>('[data-deliver]');
    if (deliveryButton) {
      await this.runAction(
        () => api.deliverOrder(deliveryButton.dataset.tripId!, deliveryButton.dataset.deliver!),
        'บันทึกว่าส่งสำเร็จแล้ว'
      );
      return;
    }

    const deleteOrderButton = target.closest<HTMLElement>('[data-delete-order]');
    if (deleteOrderButton) {
      await this.runAction(() => api.deleteOrder(deleteOrderButton.dataset.deleteOrder!), 'ลบออเดอร์แล้ว');
      return;
    }

    const deleteCustomerButton = target.closest<HTMLElement>('[data-delete-customer]');
    if (deleteCustomerButton) {
      await this.runAction(() => api.deleteCustomer(deleteCustomerButton.dataset.deleteCustomer!), 'ลบข้อมูลลูกค้าแล้ว');
    }
  }

  private async handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const values = Object.fromEntries(new FormData(form));

    if (form.id === 'order-form') {
      this.closeModal();
      await this.runAction(() => api.addOrder({
        customerId: String(values.customerId),
        boxes: Number(values.boxes),
        menu: String(values.menu),
        note: String(values.note ?? ''),
        payment: values.payment === 'cash' ? 'cash' : 'paid'
      }), 'เพิ่มออเดอร์แล้ว');
    }

    if (form.id === 'customer-form') {
      this.closeModal();
      await this.runAction(() => api.addCustomer({
        name: String(values.name),
        phone: String(values.phone),
        address: String(values.address),
        zone: String(values.zone),
        lat: Number(values.lat),
        lng: Number(values.lng)
      }), 'เพิ่มลูกค้าแล้ว');
    }
  }

  private handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.id !== 'order-search') return;

    const query = input.value.trim().toLowerCase();
    const matchingOrders = this.store.orders.filter((order) => {
      const customer = customerForOrder(this.store, order);
      return `${order.id} ${customer?.name} ${order.menu}`.toLowerCase().includes(query);
    });

    const table = this.root.querySelector('#order-table');
    if (table) table.innerHTML = orderTable(this.store, matchingOrders);
    mountIcons();
  }

  private async runAction(task: () => Promise<unknown>, successMessage: string): Promise<void> {
    try {
      await task();
      await this.refresh();
      this.render();
      this.showToast(successMessage);
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด', true);
    }
  }

  private openModal(content: string): void {
    const modalRoot = this.root.querySelector('#modal-root');
    if (modalRoot) modalRoot.innerHTML = content;
    mountIcons();
  }

  private closeModal(): void {
    const modalRoot = this.root.querySelector('#modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  }

  private showToast(message: string, isError = false): void {
    const toast = this.root.querySelector<HTMLDivElement>('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${isError ? 'error' : ''}`;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.className = 'toast', 2800);
  }

  private renderLoading(): void {
    this.root.innerHTML = '<div class="boot"><div class="brand-mark">LR</div><p>กำลังเปิดระบบจัดส่ง...</p></div>';
  }

  private renderConnectionError(): void {
    this.root.innerHTML = '<div class="boot error-screen"><div class="brand-mark">LR</div><h1>เชื่อมต่อระบบไม่ได้</h1><p>ตรวจสอบว่า API ทำงานอยู่ แล้วรีเฟรชหน้าอีกครั้ง</p></div>';
  }
}

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('App root was not found');

void new LunchRouteApp(root).start();
