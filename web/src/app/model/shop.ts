// ข้อมูลร้านและเงื่อนไขการคิดค่าใช้จ่าย (ตรงกับ API: GET /route/shop)
export interface Shop {
  name: string;
  latitude: number;
  longitude: number;
  pricePerBox: number;
  foodCostPerBox: number;
  riderBaseFee: number;
  riderFeePerKmPerBox: number;
  maxOrdersPerRider: number;
  speedKmPerHour: number;
  minutesPerStop: number;
  departureTime: string;
  deadlineTime: string;
}
