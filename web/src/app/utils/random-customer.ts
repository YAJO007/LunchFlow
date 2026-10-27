// รายชื่อสำหรับสุ่ม
const firstnames = [
  'สมชาย', 'สมหญิง', 'วิชัย', 'มาลี', 'ประเสริฐ', 'กมลชนก', 'ธนพล', 'ปวีณา', 'อนุชา', 'ศิริพร',
  'ณัฐวุฒิ', 'พิมพ์ชนก', 'กิตติพัฒน์', 'อรอุมา', 'ภานุวัฒน์', 'สุนิสา', 'ชัยวัฒน์', 'จิราพร', 'ธีรเดช', 'วราภรณ์',
];

const lastnames = [
  'ใจดี', 'รักเรียน', 'มั่นคง', 'ศรีสุข', 'ทองดี', 'บุญมา', 'แสงทอง', 'พรหมมา', 'สุขสวัสดิ์', 'คำภา',
  'ชัยมงคล', 'ศรีวงศ์', 'นามวงศ์', 'ภูมิใจ', 'แก้วมณี', 'จันทร์หอม', 'บุญเรือง', 'สมบัติ', 'วงศ์ใหญ่', 'ทองคำ',
];

const places = [
  'หมู่บ้านดอนนา', 'ซอยท่าขอนยาง', 'หอพักหน้ามอ', 'ถนนมหาสารคาม-ยางตลาด', 'อาคารราชนครินทร์',
  'หอพักในมหาวิทยาลัย', 'คอนโดใกล้ประตูโขง', 'คณะวิทยาการสารสนเทศ', 'อาคารเรียนรวม',
];

// จุดบ้านที่อยู่บนบกจริง (เอามาจากข้อมูลลูกค้าตัวอย่าง)
// จะสุ่มตำแหน่งรอบ ๆ จุดพวกนี้ หมุดจะได้ไม่ตกน้ำ
const homes = [
  { lat: 16.245607, lng: 103.246601 },
  { lat: 16.245941, lng: 103.259627 },
  { lat: 16.246108, lng: 103.25352 },
  { lat: 16.247771, lng: 103.252522 },
  { lat: 16.250063, lng: 103.259923 },
  { lat: 16.243696, lng: 103.24779 },
  { lat: 16.266462, lng: 103.235615 },
  { lat: 16.232239, lng: 103.242701 },
  { lat: 16.225428, lng: 103.256824 },
  { lat: 16.264235, lng: 103.259648 },
  { lat: 16.242431, lng: 103.239208 },
  { lat: 16.269497, lng: 103.243132 },
  { lat: 16.23799, lng: 103.254459 },
  { lat: 16.268768, lng: 103.258081 },
  { lat: 16.260881, lng: 103.243676 },
  { lat: 16.242723, lng: 103.234455 },
  { lat: 16.245886, lng: 103.263411 },
  { lat: 16.228795, lng: 103.23142 },
  { lat: 16.241783, lng: 103.25437 },
  { lat: 16.237059, lng: 103.255292 },
  { lat: 16.236145, lng: 103.227373 },
  { lat: 16.257044, lng: 103.244272 },
  { lat: 16.227734, lng: 103.233106 },
];

// สุ่มเลขจำนวนเต็มตั้งแต่ min ถึง max
function randomNumber(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// สุ่มเลือกของ 1 ชิ้นจากรายการ
function randomItem(list: any[]) {
  let index = randomNumber(0, list.length - 1);
  return list[index];
}

// สุ่มเบอร์โทร 10 หลัก ขึ้นต้นด้วย 08
function randomPhone() {
  let phone = '08';
  for (let i = 0; i < 8; i++) {
    phone = phone + randomNumber(0, 9);
  }
  return phone;
}

// สร้างข้อมูลลูกค้า 1 คนแบบสุ่ม
export function randomCustomer() {
  let home = randomItem(homes);

  // ขยับจากจุดบ้านไปไม่เกินประมาณ 50 เมตร
  let latitude = home.lat + (Math.random() - 0.5) * 0.001;
  let longitude = home.lng + (Math.random() - 0.5) * 0.001;

  let address =
    randomNumber(1, 199) + '/' + randomNumber(1, 30) + ' ' + randomItem(places) +
    ' ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม';

  return {
    firstname: randomItem(firstnames),
    lastname: randomItem(lastnames),
    phone: randomPhone(),
    address: address,
    latitude: latitude,
    longitude: longitude,
  };
}
