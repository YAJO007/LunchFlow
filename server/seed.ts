import type { Store } from '../src/types.ts';

export function createSeedStore(): Store {
  const createdAt = new Date().toISOString();
  return {
    customers: [
      { id: 'c1', name: 'อรทัย แก้วกาญจน์', phone: '081-248-6190', address: 'หอพักเดอะกรีน ชั้น 2 ห้อง 204', zone: 'กังสดาล', lat: 16.4712, lng: 102.8231 },
      { id: 'c2', name: 'ธนกร พันธ์ดี', phone: '089-364-0271', address: 'คณะวิทยาศาสตร์ อาคาร SC.08', zone: 'มหาวิทยาลัย', lat: 16.4754, lng: 102.8258 },
      { id: 'c3', name: 'กมลชนก วงศ์คำ', phone: '095-674-3108', address: 'ร้านกาแฟ Common Ground', zone: 'หลังมอ', lat: 16.4681, lng: 102.8194 },
      { id: 'c4', name: 'ณัฐวุฒิ ศรีสุข', phone: '086-572-4410', address: 'ตลาด 62 บล็อก B', zone: 'โนนม่วง', lat: 16.4871, lng: 102.8302 },
      { id: 'c5', name: 'พิมพ์ชนก แสงจันทร์', phone: '092-815-9034', address: 'คณะบริหารธุรกิจ ห้องประชุม 3', zone: 'มหาวิทยาลัย', lat: 16.4741, lng: 102.8212 },
      { id: 'c6', name: 'ศุภชัย มั่นคง', phone: '098-407-2236', address: 'หมู่บ้านศรีฐาน บ้านเลขที่ 88/12', zone: 'ศรีฐาน', lat: 16.4558, lng: 102.8108 }
    ],
    orders: [
      { id: 'ORD-2401', customerId: 'c1', boxes: 2, menu: 'ข้าวกะเพราไก่', note: 'ไม่ใส่พริก', payment: 'paid', status: 'pending', createdAt },
      { id: 'ORD-2402', customerId: 'c2', boxes: 3, menu: 'ข้าวหมูกระเทียม', note: 'รับหน้าอาคาร', payment: 'cash', status: 'pending', createdAt },
      { id: 'ORD-2403', customerId: 'c3', boxes: 1, menu: 'ข้าวไก่ทอด', note: '', payment: 'paid', status: 'pending', createdAt },
      { id: 'ORD-2404', customerId: 'c4', boxes: 2, menu: 'ข้าวกะเพราหมู', note: 'โทรก่อนถึง', payment: 'cash', status: 'pending', createdAt },
      { id: 'ORD-2405', customerId: 'c5', boxes: 3, menu: 'ข้าวผัด', note: 'เพิ่มช้อน 3 ชุด', payment: 'paid', status: 'pending', createdAt },
      { id: 'ORD-2406', customerId: 'c6', boxes: 2, menu: 'ข้าวไก่กระเทียม', note: '', payment: 'paid', status: 'pending', createdAt }
    ],
    riders: [
      { id: 'r1', name: 'นนท์', phone: '089-110-2233', color: '#d94f37' },
      { id: 'r2', name: 'เบส', phone: '086-221-3344', color: '#147d70' },
      { id: 'r3', name: 'มายด์', phone: '095-332-4455', color: '#315ca8' }
    ],
    trips: []
  };
}
