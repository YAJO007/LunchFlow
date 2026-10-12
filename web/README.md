# LunchFlow Web (หน้าเว็บ Angular)

> ภาพรวมทั้งโปรเจกต์ วิธีติดตั้ง และวิธี deploy แบบละเอียด ดูที่ [README หลัก](../README.md)

หน้าเว็บของ **ระบบจัดเส้นทางและแบ่งงานไรเดอร์ ร้านข้าวกล่องมื้อเที่ยง** (ใกล้ มหาวิทยาลัยมหาสารคาม)
ต่อกับ Web API ในโฟลเดอร์หลักของ repo นี้ (20 เส้น ตาม [คู่มือ API](../docs/API-GUIDE.md))

| ส่วน | ใช้อะไร |
|---|---|
| Frontend | Angular 22 (Standalone Component) + Tailwind CSS 4 + daisyUI 5 |
| ธีม | Neo-Brutalism ม่วง-ขาว (daisyUI theme `brutal` + Tailwind `shadow-brutal`: ขอบดำหนา เงาทึบ) |
| ไอคอน / ฟอนต์ | Google Material Symbols + Noto Sans Thai + Space Grotesk (ตัวเลข) จาก Google Fonts |
| เรียก API | `fetch` + `async/await` (แบบบทเรียน 12-CORS) |
| เก็บข้อมูลฝั่งเครื่อง | Service, `localStorage`, `sessionStorage` (บทเรียน 05-Data Sharing) |

---

## 1. วิธีรัน

ต้องมี Node.js 22.22.3 ขึ้นไป (หรือ 24.15+) ไม่ต้องลง Angular CLI แยก เพราะติดตั้งมากับ `npm install` แล้ว

```sh
cd web
npm install
npm start          # = ng serve -o  แล้วเปิด http://localhost:4200
```

บน Windows ดับเบิลคลิก `start.bat` ได้เลย (ติดตั้งแพ็กเกจให้ครั้งแรก แล้วเปิดเว็บ)

build สำหรับ deploy

```sh
npm run build      # ผลลัพธ์อยู่ที่ dist/lunchflow-web/browser
```

### Deploy (Render Static Site)
| ช่อง | ค่า |
|---|---|
| Root Directory | `web` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist/lunchflow-web/browser` |
| Redirects/Rewrites | Source `/*` → Destination `/index.html` → Action **Rewrite** (ไม่ตั้งจะรีเฟรชหน้า `/owner` แล้วได้ 404) |

ฐานข้อมูลต้องมีตาราง `delivery_plan`, `delivery_job`, `delivery_stop` แล้ว (รัน `npm run setup-db` ที่โฟลเดอร์หลัก) ไม่อย่างนั้นยืนยันแผนและเปิดใบงานจะได้ error 500

### เลือก Web API ที่จะใช้
- ค่าเริ่มต้นใช้ API บน Render: `https://lunchflow-u723.onrender.com` (เรียกครั้งแรกอาจรอประมาณ 1 นาที)
- ถ้ารัน API ในเครื่อง (`npm run dev` ที่โฟลเดอร์หลัก พอร์ต 3000) ให้ไปที่หน้า **ภาพรวม** เลื่อนลงล่างสุด กดปุ่ม **localhost**
  ค่าที่เลือกจะถูกจำไว้ใน `localStorage`
- แก้ค่าเริ่มต้นได้ที่ `src/app/config/api.ts`

### บัญชีทดลองของเจ้าของร้าน
| ชื่อผู้ใช้ | รหัสผ่าน |
|---|---|
| `owner` | `1234` |

---

## 2. หน้าจอทั้งหมด

| URL | หน้า | ใช้ API |
|---|---|---|
| `/` | หน้าแรก เลือกเจ้าของร้าน / ไรเดอร์ | – |
| `/login` | เข้าสู่ระบบเจ้าของร้าน | – (เก็บใน sessionStorage) |
| `/owner` | ภาพรวม: ตัวเลขสรุป ขั้นตอนเตรียมรอบส่ง แผนล่าสุด ตั้งค่า API | `GET /customer`, `GET /order`, `GET /route/latest` |
| `/owner/customers` | ลูกค้า: แสดง ค้นหาชื่อ/นามสกุล ใกล้ร้าน 1 กม. เพิ่ม แก้ไข ลบ + แผนที่บ้านลูกค้า | `GET /customer`, `/customer/search`, `/customer/nearby`, `POST/PUT/DELETE /customer` |
| `/owner/orders` | ออเดอร์: จำลอง 20-30 รายการ เพิ่ม แก้จำนวนกล่อง ลบ ล้างทั้งหมด กรองในระยะ 2 กม. ตรวจข้อมูลผิด | `GET /order`, `/order/nearby`, `POST /order/simulate`, `POST/PUT/DELETE /order` |
| `/owner/riders` | ไรเดอร์และสถานะพร้อมรับงาน | – (เก็บใน localStorage) |
| `/owner/routes` | **จัดเส้นทาง**: คำนวณ ดูแผนอื่น เปรียบเทียบกับแผนก่อนหน้า แผนที่แยกสี ยืนยันแผน | `GET /route/shop`, `POST /route/calculate`, `POST /route/confirm`, `GET /route/latest` |
| `/owner/report` | รายงานต้นทุน-กำไร รายไรเดอร์ + พิมพ์รายงาน | `GET /route/latest` |
| `/rider` | ไรเดอร์กรอกเลขใบงาน (หรือเปิดลิงก์ `/rider?job=1001`) | – |
| `/rider/job/:id` | ใบงาน: จำนวนกล่อง ลำดับจุดส่ง โทร นำทาง กด "ส่งแล้ว" | `GET /job/:id` |
| `/rider/map/:id` | แผนที่นำทางของใบงาน + เปิด Google Maps | `GET /job/:id` |
| อื่น ๆ | หน้า 404 | – |

ครบทั้ง 20 เส้น API ในคู่มือ (`GET /customer/:id` และ `GET /order/:id` มีฟังก์ชันอยู่ใน `service/api.ts`)

### ลำดับการใช้งาน (ทดสอบตามนี้ได้เลย)
1. เข้า `/login` ด้วย `owner / 1234`
2. หน้า **ออเดอร์** → กด **ล้างทั้งหมด** แล้ว **สุ่มออเดอร์** 25 รายการ
3. หน้า **จัดเส้นทาง** → **คำนวณเส้นทาง** → ลอง **คำนวณใหม่ (แผนถัดไป)** จะเห็นตาราง "เทียบกับแผนก่อนหน้า"
4. กด **ยืนยันแผนและสร้างใบงาน** → ได้เลขใบงาน เช่น 1001, 1002, ...
5. เปิด `/rider` บนมือถือ (หรือเครื่องอื่น) กรอกเลข 1001 → เห็นจุดส่งเรียงเหมือนที่เจ้าของร้านยืนยัน
6. หน้า **รายงานกำไร** ดูต้นทุน กำไร และค่าไรเดอร์รายคน

---

## 3. ตรงกับขอบเขตโครงงานยังไง

| ขอบเขต | ทำที่ไหน |
|---|---|
| เพิ่ม แก้ไข ค้นหา ลบลูกค้า พร้อมพิกัด | `/owner/customers` (ตรวจเบอร์โทร พิกัด ระยะจากร้านก่อนบันทึก) |
| เพิ่ม แก้ไข ยกเลิกออเดอร์ 1-3 กล่อง | `/owner/orders` |
| แสดงไรเดอร์และสถานะพร้อมรับงาน | `/owner/riders` |
| ตรวจข้อมูลก่อนคำนวณ (พิกัด จำนวนกล่อง) | ป้าย "ตรวจสอบ" ในหน้าออเดอร์ + การ์ดตรวจข้อมูลในหน้าจัดเส้นทาง |
| แบ่งออเดอร์ไรเดอร์ละไม่เกิน 3 / จัดลำดับจุดส่ง / ระยะ เวลา ค่าใช้จ่าย | `/owner/routes` (คำนวณที่ API) |
| แจ้งออเดอร์ที่จัดไม่ได้เมื่อไรเดอร์ไม่พอ | แถบแดง "ไรเดอร์ไม่พอ" + ปิดปุ่มยืนยัน |
| แจ้งความเสี่ยงส่งเสร็จหลัง 12:30 | แถบเหลือง "เสี่ยงส่งไม่ทัน" + ป้ายต่อใบงาน |
| คำนวณใหม่และเปรียบเทียบแผน | ปุ่ม "คำนวณใหม่" + ตารางเทียบ (สีเขียว = ดีขึ้น, แดง = แย่ลง) |
| แผนร่าง → ตรวจ → ยืนยัน | ป้าย "แผนร่าง" (จำไว้ใน sessionStorage) จนกว่าจะกดยืนยัน แผนที่ใช้งานจริงไม่เปลี่ยน |
| การเงิน 65 / 40 / 15 / 2 บาท | การ์ดต้นทุนในหน้าจัดเส้นทาง + `/owner/report` |
| ใบงาน ค้นหาด้วยเลขใบงานบนมือถือ โทร เปิดแผนที่ บันทึกส่งสำเร็จ | `/rider`, `/rider/job/:id`, `/rider/map/:id` |

> **ข้อจำกัด** ระยะทางเป็นเส้นตรงจากพิกัด (ไม่ใช่ระยะตามถนน) เวลาและค่าใช้จ่ายเป็นค่าประมาณสำหรับวางแผน
> รายชื่อไรเดอร์ และสถานะ "ส่งแล้ว" เก็บใน `localStorage` ของเครื่องนั้น เพราะ API ยังไม่มีตารางสำหรับเรื่องนี้

---

## 4. โครงสร้างไฟล์

```
src/
├── index.html                 data-theme="brutal"
├── styles.css                 Google Fonts + Tailwind + daisyUI + ธีม Neo-Brutalism ม่วง-ขาว
└── app/
    ├── app.ts / app.html      router-outlet + ข้อความแจ้งเตือน (toast)
    ├── app.routes.ts          เส้นทางทั้งหมด (Nested routes + 404)
    ├── app.config.ts          provideRouter(routes, withComponentInputBinding())
    ├── config/
    │   ├── api.ts             URL ของ Web API
    │   └── shop.ts            ค่าเริ่มต้นของร้าน + รัศมี 3 กม.
    ├── model/                 interface ตรงกับ JSON ของ API (customer, order, route, shop, rider)
    ├── service/
    │   ├── api.ts             เรียก API ทุกเส้นด้วย fetch
    │   ├── app-data.ts        ข้อมูลใช้ร่วมกัน: ร้าน ไรเดอร์ login สถานะส่ง แผนร่าง
    │   └── notify.ts          ข้อความแจ้งเตือนมุมจอ
    ├── utils/
    │   ├── geo.ts             คำนวณระยะทาง (Haversine) + ลิงก์ Google Maps
    │   └── format.ts          จัดรูปแบบเงิน ระยะ วันที่
    ├── components/
    │   ├── brand/             โลโก้
    │   └── route-map/         แผนที่เส้นทาง SVG (@Input jobs, points, highlight)
    └── pages/
        ├── home/  login/  pagenotfound/
        ├── owner/             layout + dashboard, customers, orders, riders, route-planning, report
        └── rider/             layout + rider-login, job-sheet, job-map
```

---

## 5. เขียนตามบทเรียนตรงไหนบ้าง

| บทเรียน | ใช้ในงานนี้ |
|---|---|
| 01-Create Angular Project | `ng new` เลือก Tailwind, SSR = No |
| 02-Angular Components | `ng g c pages/... --skip-tests`, import component แล้วเรียกด้วย selector เช่น `<app-route-map>` `<app-brand>` |
| 03-External Components | daisyUI (`navbar`, `card`, `btn`, `input`, `select`, `modal`, `toast`, `table`, `badge`, `toggle`) + ทำธีมสีเอง |
| 04-Data binding | `{{ }}`, `[src]` `[href]`, `(click)`, `[(ngModel)]` + `FormsModule`, ส่ง `#input` เข้าฟังก์ชัน เช่น `search(fn, ln)` `open(jobNo)` `changeQuantity(o, q)`, `@Input()` |
| 05-Display and Styling | `@if / @else`, `@for ... track`, `@empty`, Google Fonts ใน `styles.css`, CSS แยกของแต่ละ component |
| 01-Angular Router | `app.routes.ts`, `<router-outlet>`, `routerLink`, `RouterModule` |
| 02-Layout and Nested Routes | `owner` และ `rider` มี `children` + `router-outlet` ของตัวเอง, wildcard `**` → หน้า 404 |
| 03-Navigation Programmatically | `constructor(private router: Router)` + `this.router.navigate(['/rider/job', no])` |
| 04-Dynamic path and query params | `withComponentInputBinding()`, path param `id = input.required<string>()` (`/rider/job/:id`), query param `job = input<string>()` (`/rider?job=1001`) |
| 05-Data Sharing | Service (`ng g s service/app-data --skip-tests`), `sessionStorage` (login, แผนร่าง), `localStorage` (ไรเดอร์, สถานะส่ง, URL API, ใบงานที่เคยเปิด) |
| TS: JSON and Class / Array | `class Menu`, `class Toast`, `JSON.parse / JSON.stringify`, `filter` `map` `find` |
| NodeJS: Model / 12-CORS | `interface` ใน `model/` (แบบ QuickType), เรียก API ด้วย `fetch` + `async/await` + `try/catch` |

### จุดที่ต้องเพิ่มจากบทเรียนเล็กน้อย (มีเหตุผล)
- **ใช้ `signal()` แทน `model()` สำหรับข้อมูลในหน้า**
  หน้าที่เปิดผ่าน Router + `withComponentInputBinding()` จะถูก Router ใส่ค่าให้ input ทุกตัว ถ้าไม่มีใน URL จะกลายเป็น `undefined`
  และ `model()` ก็นับเป็น input ด้วย ค่าที่ตั้งไว้จึงหาย ส่วน `signal()` (ตัวเดียวกับ `title = signal(...)` ใน app.ts) ไม่โดนล้าง
  ใช้งานเหมือนกันทุกอย่าง: อ่าน `x()` เปลี่ยน `x.set(...)` และใช้กับ `[(ngModel)]="x"` ได้
- **`ngOnChanges()`** ใน `rider-login`, `job-sheet` และ `job-map` ทำงานหลัง Angular ใส่ค่า `input()` จาก URL ให้แล้ว และทำงานอีกครั้งเมื่อเลขใบงานใน URL เปลี่ยน (ตรวจว่าเป็นตัวเลขก่อนเปิดใบงาน)
- **แผนที่เป็น SVG** วาดด้วย `@for` + `[attr.cx]` `[attr.points]` (property binding แบบ attribute) แทนการติดตั้งไลบรารีแผนที่
  และมีปุ่มเปิด Google Maps สำหรับเส้นทางจริง
- **`@source inline(...)`** ใน `styles.css` บอก Tailwind ให้สร้างคลาสที่เขียนแบบ `[class.ชื่อคลาส]="..."` ไว้เสมอ
