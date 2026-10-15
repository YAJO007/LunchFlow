# LunchFlow Web (หน้าเว็บ Angular)

ภาพรวมทั้งโปรเจกต์ วิธีติดตั้ง และวิธี deploy ดูที่ [README หลัก](../README.md)

ใช้ Angular 22 + Tailwind CSS + daisyUI เรียก Web API ด้วย `fetch`

## วิธีรัน

```sh
cd web
npm install
npm start          # เปิด http://localhost:4200
```

บน Windows ดับเบิลคลิก `start.bat` ได้เลย

- ที่อยู่ Web API ตั้งไว้ใน `src/app/config/api.ts` (ค่าเริ่มต้นคือ API บน Render)
- บัญชีเจ้าของร้าน: `owner` / `1234`

## หน้าจอทั้งหมด

| URL | หน้า | ใช้ API |
|---|---|---|
| `/` | หน้าแรก เลือกเจ้าของร้าน / ไรเดอร์ | - |
| `/login` | เข้าสู่ระบบเจ้าของร้าน | - |
| `/owner` | ภาพรวม | `GET /customer`, `GET /order`, `GET /route/latest` |
| `/owner/customers` | ลูกค้า: แสดง ค้นหา ใกล้ร้าน 1 กม. เพิ่ม แก้ไข ลบ + แผนที่ | `/customer`, `/customer/search`, `/customer/nearby` |
| `/owner/orders` | ออเดอร์: สุ่ม 20-30 เพิ่ม แก้จำนวนกล่อง ลบ ล้างทั้งหมด ในระยะ 2 กม. | `/order`, `/order/simulate`, `/order/nearby` |
| `/owner/riders` | ไรเดอร์และสถานะพร้อมรับงาน (เก็บใน localStorage) | - |
| `/owner/routes` | จัดเส้นทาง: คำนวณ คำนวณใหม่ เทียบแผน ยืนยัน | `/route/calculate`, `/route/confirm` |
| `/owner/report` | กำไรของแผนล่าสุด | `GET /route/latest` |
| `/rider` | ไรเดอร์กรอกเลขใบงาน | - |
| `/rider/job/:id` | ใบงาน: กล่อง ลำดับจุดส่ง โทร นำทาง ส่งแล้ว | `GET /job/:id` |
| อื่น ๆ | หน้า 404 | - |

## โครงสร้างไฟล์

```
src/app/
├── app.routes.ts        เส้นทางทั้งหมด (Nested routes + 404)
├── config/              ที่อยู่ API และค่าเริ่มต้นของร้าน
├── model/               interface ตรงกับ JSON ของ API
├── service/
│   ├── api.ts           เรียก API ทุกเส้นด้วย fetch
│   ├── app-data.ts      ข้อมูลที่ใช้ร่วมกัน (ร้าน ไรเดอร์ login สถานะส่ง)
│   └── notify.ts        ข้อความแจ้งเตือนมุมจอ
├── utils/               จัดรูปแบบตัวเลข + ลิงก์ Google Maps
├── components/route-map แผนที่เส้นทาง (วาดด้วย SVG)
└── pages/
    ├── home/  login/  pagenotfound/
    ├── owner/           layout + dashboard, customers, orders, riders, route-planning, report
    └── rider/           layout + rider-login, job-sheet
```

## ใช้อะไรจากบทเรียนบ้าง

| บทเรียน | ใช้ตรงไหน |
|---|---|
| 02-Angular Components | สร้างหน้าด้วย `ng g c`, ใช้ `<app-route-map>` |
| 03-External Components | daisyUI: `btn`, `card`, `table`, `input`, `select`, `toast`, `alert`, `stats` |
| 04-Data binding | `{{ }}`, `(click)`, `[(ngModel)]`, `[href]`, ส่ง `#input` เข้าฟังก์ชัน, `@Input()` |
| 05-Display and Styling | `@if`, `@for`, Google Fonts |
| 01-Angular Router | `app.routes.ts`, `routerLink`, `<router-outlet>` |
| 02-Layout and Nested Routes | `owner` และ `rider` มี `children`, หน้า 404 ด้วย `**` |
| 03-Navigation Programmatically | `this.router.navigate(...)` |
| 04-Dynamic path and query params | `/rider/job/:id` รับด้วย `input.required()` |
| 05-Data Sharing | Service, `localStorage`, `sessionStorage` |
| 12-CORS | เรียก API ด้วย `fetch` + `async/await` |

ส่วนที่บทเรียนไม่มีแต่โจทย์ต้องใช้:
- `ngOnInit()` ในหน้าใบงาน เพื่อโหลดใบงานหลังจากได้เลขใบงานจาก URL แล้ว
- แผนที่วาดด้วย `<svg>` + `@for` (ไม่ได้ลงไลบรารีแผนที่เพิ่ม) และปุ่มนำทางเป็นลิงก์ Google Maps ธรรมดา
- `signal()` เก็บข้อมูลในหน้า แทน `model()` เพราะเมื่อเปิด `withComponentInputBinding()` ค่าใน `model()` จะถูก Router ล้าง
