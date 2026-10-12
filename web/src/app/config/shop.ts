import { Shop } from '../model/shop';

export const DEFAULT_SHOP: Shop = {
  name: 'ข้าวกล่องเดลิเวอรี ส่งด่วนมื้อเที่ยง',
  latitude: 16.2459,
  longitude: 103.2525,
  pricePerBox: 65,
  foodCostPerBox: 40,
  riderBaseFee: 15,
  riderFeePerKmPerBox: 2,
  maxOrdersPerRider: 3,
  speedKmPerHour: 30,
  minutesPerStop: 2,
  departureTime: '11:30',
  deadlineTime: '12:30',
};

export const SERVICE_RADIUS_KM = 3;
