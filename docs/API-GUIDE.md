# คู่มือการใช้งาน Web API ระบบ LunchFlow

## 1. ข้อมูลทั่วไป

Web API นี้ใช้สำหรับจัดการข้อมูลลูกค้า รายการสั่งซื้อ และการจัดเส้นทางส่งอาหารของไรเดอร์ ร้านข้าวกล่องเดลิเวอรี ส่งด่วนมื้อเที่ยง มีทั้งหมด 20 เส้น

| รายการ | ค่า |
|---|---|
| URL บน Render | https://lunchflow-u723.onrender.com |
| URL ในเครื่อง | http://localhost:3000 |
| รูปแบบข้อมูล | JSON |
| Header สำหรับ POST / PUT | Content-Type: application/json |

หมายเหตุ: Render แบบไม่เสียค่าใช้จ่ายจะหยุดทำงานเมื่อไม่มีการใช้งาน การเรียกครั้งแรกอาจใช้เวลาประมาณ 1 นาที

### 1.1 Status Code

| Code | ความหมาย |
|---|---|
| 200 | ทำงานสำเร็จ |
| 201 | เพิ่มข้อมูลสำเร็จ |
| 400 | ข้อมูลที่ส่งมาไม่ครบหรือไม่ถูกต้อง |
| 404 | ไม่พบข้อมูลตาม id ที่ระบุ |
| 500 | เกิดข้อผิดพลาดที่เซิร์ฟเวอร์หรือฐานข้อมูล |

กรณีเกิดข้อผิดพลาด ระบบจะส่งข้อความกลับในรูปแบบ

```
{ "error": "ข้อความแจ้งข้อผิดพลาด" }
```

### 1.2 รายการ API ทั้งหมด

| ลำดับ | Method | Path | คำอธิบาย |
|---|---|---|---|
| 1 | GET | /customer | แสดงลูกค้าทั้งหมด |
| 2 | GET | /customer/:id | แสดงลูกค้าตาม id |
| 3 | GET | /customer/search | ค้นหาลูกค้าจากชื่อหรือนามสกุล |
| 4 | GET | /customer/nearby | ค้นหาลูกค้าในระยะ 1 กิโลเมตร |
| 5 | POST | /customer | เพิ่มลูกค้า |
| 6 | PUT | /customer/:id | แก้ไขข้อมูลลูกค้า |
| 7 | DELETE | /customer/:id | ลบลูกค้า |
| 8 | GET | /order | แสดงรายการสั่งซื้อทั้งหมด |
| 9 | GET | /order/:id | แสดงรายการสั่งซื้อตาม id |
| 10 | GET | /order/nearby | ค้นหารายการสั่งซื้อในระยะ 2 กิโลเมตร |
| 11 | POST | /order/simulate | จำลองรายการสั่งซื้อ 20-30 รายการ |
| 12 | POST | /order | เพิ่มรายการสั่งซื้อ |
| 13 | PUT | /order/:id | แก้ไขจำนวนกล่อง |
| 14 | DELETE | /order/:id | ลบรายการสั่งซื้อ |
| 15 | DELETE | /order | ลบรายการสั่งซื้อทั้งหมด |
| 16 | GET | /route/shop | แสดงข้อมูลร้านและเงื่อนไขการคิดค่าใช้จ่าย |
| 17 | POST | /route/calculate | คำนวณเส้นทางจัดส่ง |
| 18 | POST | /route/confirm | ยืนยันแผนและสร้างใบงานไรเดอร์ |
| 19 | GET | /route/latest | แสดงแผนจัดส่งล่าสุด |
| 20 | GET | /job/:id | แสดงใบงานไรเดอร์ตามเลขใบงาน |

## 2. API ลูกค้า (Customer)

ข้อมูลลูกค้าประกอบด้วย

| Field | ชนิด | คำอธิบาย |
|---|---|---|
| id | number | รหัสลูกค้า (ระบบสร้างให้) |
| firstname | string | ชื่อ |
| lastname | string | นามสกุล |
| phone | string | เบอร์โทรศัพท์ |
| address | string | ที่อยู่ |
| latitude | number | ละติจูดของบ้าน |
| longitude | number | ลองจิจูดของบ้าน |

### 2.1 GET /customer

แสดงข้อมูลลูกค้าทั้งหมด

ตัวอย่างการเรียก

```
GET http://localhost:3000/customer
```

ผลลัพธ์ (200)

```
[
  {
    "id": 1,
    "firstname": "สมชาย",
    "lastname": "ใจดี",
    "phone": "0897514212",
    "address": "136/1 หมู่บ้านดอนนา ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม",
    "latitude": 16.245607,
    "longitude": 103.246601
  }
]
```

### 2.2 GET /customer/:id

แสดงข้อมูลลูกค้า 1 คนตาม id

ตัวอย่างการเรียก

```
GET http://localhost:3000/customer/2
```

ผลลัพธ์ (200) ข้อมูลลูกค้า 1 คนในรูปแบบ object

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่พบลูกค้า | 404 { "error": "Customer not found" } |

### 2.3 GET /customer/search

ค้นหาลูกค้าจากส่วนหนึ่งของชื่อ และ/หรือ นามสกุล

| Query | จำเป็น | คำอธิบาย |
|---|---|---|
| firstname | ไม่ | ส่วนหนึ่งของชื่อ |
| lastname | ไม่ | ส่วนหนึ่งของนามสกุล |

ตัวอย่างการเรียก

```
GET http://localhost:3000/customer/search?firstname=สม
GET http://localhost:3000/customer/search?lastname=ใจ
GET http://localhost:3000/customer/search?firstname=สม&lastname=ใจ
```

ผลลัพธ์ (200) รายการลูกค้าที่ตรงกับเงื่อนไข ถ้าไม่พบจะได้ []

### 2.4 GET /customer/nearby

ค้นหาลูกค้าที่บ้านอยู่ห่างจากพิกัดที่กำหนดไม่เกิน 1 กิโลเมตร

| Query | จำเป็น | คำอธิบาย |
|---|---|---|
| lat | ใช่ | ละติจูดของจุดศูนย์กลาง |
| lng | ใช่ | ลองจิจูดของจุดศูนย์กลาง |

ตัวอย่างการเรียก

```
GET http://localhost:3000/customer/nearby?lat=16.2459&lng=103.2525
```

ผลลัพธ์ (200) ข้อมูลลูกค้าเหมือนข้อ 2.1 และมี field distance_km (ระยะห่างเป็นกิโลเมตร) เพิ่มเข้ามา

```
[
  { "id": 1, "firstname": "สมชาย", "lastname": "ใจดี", ..., "distance_km": 0.631 }
]
```

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่ส่ง lat หรือ lng หรือไม่ใช่ตัวเลข | 400 { "error": "Please send lat and lng" } |

### 2.5 POST /customer

เพิ่มลูกค้าใหม่ ต้องส่งข้อมูลครบทุก field ยกเว้น id

ตัวอย่างการเรียก

```
POST http://localhost:3000/customer
```

Body

```
{
  "firstname": "ทดสอบ",
  "lastname": "ระบบ",
  "phone": "0812345678",
  "address": "หอพักหน้ามหาวิทยาลัย ต.ขามเรียง",
  "latitude": 16.2461,
  "longitude": 103.2519
}
```

ผลลัพธ์ (201)

```
{ "affected_row": 1, "last_id": 31 }
```

affected_row คือจำนวนแถวที่เพิ่ม และ last_id คือ id ของลูกค้าที่เพิ่มใหม่

| กรณี | ผลลัพธ์ |
|---|---|
| ส่งข้อมูลไม่ครบ | 400 { "error": "Please send all customer fields" } |

### 2.6 PUT /customer/:id

แก้ไขข้อมูลลูกค้า สามารถส่งเฉพาะ field ที่ต้องการแก้ไขได้ field ที่ไม่ได้ส่งจะใช้ค่าเดิม

ตัวอย่างการเรียก

```
PUT http://localhost:3000/customer/31
```

Body

```
{ "phone": "0899999999" }
```

ผลลัพธ์ (200)

```
{ "affected_row": 1 }
```

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่พบลูกค้า | 404 { "error": "Customer not found" } |

### 2.7 DELETE /customer/:id

ลบลูกค้าตาม id รายการสั่งซื้อของลูกค้าคนนี้จะถูกลบไปด้วย

ตัวอย่างการเรียก

```
DELETE http://localhost:3000/customer/31
```

ผลลัพธ์ (200)

```
{ "affected_row": 1 }
```

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่พบลูกค้า | 404 { "error": "Customer not found" } |

## 3. API รายการสั่งซื้อ (Order)

ข้อมูลรายการสั่งซื้อที่ได้จาก API แบบ GET จะมีข้อมูลของลูกค้าที่สั่งรวมมาด้วย

| Field | ชนิด | คำอธิบาย |
|---|---|---|
| id | number | รหัสรายการสั่งซื้อ |
| customer_id | number | รหัสลูกค้าที่สั่ง |
| quantity | number | จำนวนกล่อง (1-3) |
| order_date | string | วันเวลาที่สั่ง |
| firstname - longitude | - | ข้อมูลลูกค้าที่สั่ง (เหมือนหัวข้อ 2) |

ตัวอย่างข้อมูล

```
{
  "id": 1,
  "customer_id": 14,
  "quantity": 2,
  "order_date": "2026-10-08T04:12:00.000Z",
  "firstname": "อรอุมา",
  "lastname": "ภูมิใจ",
  "phone": "0859148448",
  "address": "97/19 หอพักในมหาวิทยาลัย ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม",
  "latitude": 16.24643,
  "longitude": 103.250214
}
```

### 3.1 GET /order

แสดงรายการสั่งซื้อทั้งหมด เรียงตาม id

```
GET http://localhost:3000/order
```

ผลลัพธ์ (200) รายการสั่งซื้อทั้งหมดในรูปแบบ array

### 3.2 GET /order/:id

แสดงรายการสั่งซื้อ 1 รายการตาม id

```
GET http://localhost:3000/order/1
```

ผลลัพธ์ (200) รายการสั่งซื้อ 1 รายการ

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่พบรายการสั่งซื้อ | 404 { "error": "Order not found" } |

### 3.3 GET /order/nearby

ค้นหารายการสั่งซื้อที่บ้านลูกค้าอยู่ห่างจากพิกัดที่กำหนดไม่เกิน 2 กิโลเมตร

| Query | จำเป็น | คำอธิบาย |
|---|---|---|
| lat | ใช่ | ละติจูดของจุดศูนย์กลาง |
| lng | ใช่ | ลองจิจูดของจุดศูนย์กลาง |

```
GET http://localhost:3000/order/nearby?lat=16.2459&lng=103.2525
```

ผลลัพธ์ (200) รายการสั่งซื้อเหมือนข้อ 3.1 และมี field distance_km เพิ่มเข้ามา

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่ส่ง lat หรือ lng | 400 { "error": "Please send lat and lng" } |

### 3.4 POST /order/simulate

จำลองรายการสั่งซื้อ 20-30 รายการ โดยสุ่มลูกค้าจากข้อมูลลูกค้าในระบบ และสุ่มจำนวนกล่อง 1-3 กล่องต่อรายการ รายการที่สร้างจะเพิ่มต่อจากรายการเดิม

| Body | จำเป็น | คำอธิบาย |
|---|---|---|
| amount | ไม่ | จำนวนรายการที่ต้องการ (20-30) ถ้าไม่ส่ง ระบบจะสุ่มให้ |

```
POST http://localhost:3000/order/simulate
```

Body

```
{ "amount": 25 }
```

ผลลัพธ์ (201)

```
{ "created_order": 25, "total_box": 49 }
```

created_order คือจำนวนรายการที่สร้าง และ total_box คือจำนวนกล่องรวม

| กรณี | ผลลัพธ์ |
|---|---|
| amount ไม่อยู่ในช่วง 20-30 | 400 { "error": "amount must be 20 - 30" } |
| ยังไม่มีลูกค้าในระบบ | 400 { "error": "Please add customers first" } |

### 3.5 POST /order

เพิ่มรายการสั่งซื้อ

| Body | จำเป็น | คำอธิบาย |
|---|---|---|
| customer_id | ใช่ | รหัสลูกค้า |
| quantity | ใช่ | จำนวนกล่อง (1-3) |

```
POST http://localhost:3000/order
```

Body

```
{ "customer_id": 1, "quantity": 2 }
```

ผลลัพธ์ (201)

```
{ "affected_row": 1, "last_id": 47 }
```

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่ส่ง customer_id หรือ quantity ไม่อยู่ในช่วง 1-3 | 400 { "error": "Please send customer_id and quantity (1-3)" } |
| ไม่พบลูกค้า | 404 { "error": "Customer not found" } |

### 3.6 PUT /order/:id

แก้ไขจำนวนกล่องของรายการสั่งซื้อ

```
PUT http://localhost:3000/order/1
```

Body

```
{ "quantity": 3 }
```

ผลลัพธ์ (200)

```
{ "affected_row": 1 }
```

| กรณี | ผลลัพธ์ |
|---|---|
| quantity ไม่อยู่ในช่วง 1-3 | 400 { "error": "quantity must be 1-3" } |
| ไม่พบรายการสั่งซื้อ | 404 { "error": "Order not found" } |

### 3.7 DELETE /order/:id

ลบรายการสั่งซื้อ 1 รายการ

```
DELETE http://localhost:3000/order/1
```

ผลลัพธ์ (200)

```
{ "affected_row": 1 }
```

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่พบรายการสั่งซื้อ | 404 { "error": "Order not found" } |

### 3.8 DELETE /order

ลบรายการสั่งซื้อทั้งหมด ใบงานไรเดอร์ที่ยืนยันแล้วจะไม่ถูกลบ เนื่องจากเก็บข้อมูลลูกค้าไว้ในตารางใบงานแยกต่างหาก

```
DELETE http://localhost:3000/order
```

ผลลัพธ์ (200)

```
{ "affected_row": 43 }
```

affected_row คือจำนวนรายการที่ถูกลบ

## 4. API จัดเส้นทางและใบงาน (Route / Job)

### 4.1 GET /route/shop

แสดงข้อมูลร้านและเงื่อนไขที่ใช้คำนวณค่าใช้จ่าย ค่าเหล่านี้กำหนดไว้ในไฟล์ config/shop.ts

```
GET http://localhost:3000/route/shop
```

ผลลัพธ์ (200)

```
{
  "name": "ข้าวกล่องเดลิเวอรี ส่งด่วนมื้อเที่ยง",
  "latitude": 16.2459,
  "longitude": 103.2525,
  "pricePerBox": 65,
  "foodCostPerBox": 40,
  "riderBaseFee": 15,
  "riderFeePerKmPerBox": 2,
  "maxOrdersPerRider": 3,
  "speedKmPerHour": 30,
  "minutesPerStop": 2,
  "departureTime": "11:30",
  "deadlineTime": "12:30"
}
```

| Field | คำอธิบาย |
|---|---|
| pricePerBox | ราคาขายต่อกล่อง (บาท) |
| foodCostPerBox | ต้นทุนอาหารต่อกล่อง (บาท) |
| riderBaseFee | ค่าเรียกไรเดอร์ต่อรอบ (บาท) |
| riderFeePerKmPerBox | ค่าส่งต่อกิโลเมตรต่อกล่อง (บาท) |
| maxOrdersPerRider | จำนวนรายการสูงสุดที่ไรเดอร์ 1 คนรับได้ |
| speedKmPerHour | ความเร็วเฉลี่ยของไรเดอร์ (กม./ชม.) |
| minutesPerStop | เวลาส่งของต่อจุด (นาที) |
| departureTime | เวลาออกจากร้าน |
| deadlineTime | เวลาที่ต้องส่งถึงลูกค้า |

สูตรค่าไรเดอร์ 1 คน = 15 + (2 x จำนวนกล่อง x ระยะทาง) เช่น รับ 6 กล่อง ระยะทาง 2 กิโลเมตร ค่าส่งเท่ากับ 15 + (2 x 6 x 2) = 39 บาท

### 4.2 POST /route/calculate

คำนวณเส้นทางจัดส่งจากรายการสั่งซื้อทั้งหมดในระบบ โดยแบ่งรายการให้ไรเดอร์คนละไม่เกิน 3 รายการ จัดลำดับจุดส่งให้ระยะทางสั้นที่สุด และคำนวณค่าส่ง กำไร และเวลาที่ใช้ ผลลัพธ์ยังไม่ถูกบันทึกลงฐานข้อมูล

ระบบคำนวณไว้หลายแผน แผนที่ 0 คือแผนที่ดีที่สุด (ส่งทันเวลาและค่าส่งต่ำที่สุด) ถ้าต้องการดูแผนอื่นให้ส่ง option เพิ่มขึ้นทีละ 1 เมื่อเกินจำนวนแผนทั้งหมดจะกลับไปที่แผนแรก

| Body | จำเป็น | คำอธิบาย |
|---|---|---|
| option | ไม่ | ลำดับแผน 0, 1, 2, ... (ค่าเริ่มต้น 0) |

```
POST http://localhost:3000/route/calculate
```

Body

```
{ "option": 0 }
```

ผลลัพธ์ (200) (แสดงบางส่วน)

```
{
  "option": 0,
  "total_options": 5,
  "plan": {
    "strategy": "กวาดรอบร้าน (เริ่มตำแหน่งที่ 1)",
    "rider_count": 9,
    "total_order": 25,
    "total_box": 49,
    "total_distance_km": 20.53,
    "delivery_cost": 390.31,
    "revenue": 3185,
    "food_cost": 1960,
    "profit": 834.69,
    "departure_time": "11:30",
    "deadline_time": "12:30",
    "last_arrival_time": "11:43",
    "all_on_time": true,
    "jobs": [
      {
        "rider_no": 1,
        "color": "#e11d48",
        "total_box": 5,
        "distance_km": 3.74,
        "duration_min": 12,
        "cost": 52.44,
        "finish_time": "11:42",
        "on_time": true,
        "map_url": "https://www.google.com/maps/dir/?api=1&...",
        "stops": [
          {
            "stop_no": 1,
            "order_id": 25,
            "customer_name": "ธีรเดช วงศ์ใหญ่",
            "phone": "08xxxxxxxx",
            "address": "...",
            "latitude": 16.24,
            "longitude": 103.25,
            "quantity": 1,
            "distance_from_prev_km": 1.91,
            "arrival_time": "11:34"
          }
        ]
      }
    ]
  }
}
```

| Field | คำอธิบาย |
|---|---|
| option, total_options | ลำดับแผนที่แสดง และจำนวนแผนทั้งหมด |
| plan.strategy | วิธีที่ใช้แบ่งกลุ่มรายการสั่งซื้อ |
| plan.rider_count | จำนวนไรเดอร์ที่ใช้ |
| plan.total_distance_km | ระยะทางรวมของไรเดอร์ทุกคน |
| plan.delivery_cost | ค่าไรเดอร์รวม |
| plan.revenue | ยอดขาย (จำนวนกล่อง x 65) |
| plan.food_cost | ต้นทุนอาหาร (จำนวนกล่อง x 40) |
| plan.profit | กำไร = ยอดขาย - ต้นทุนอาหาร - ค่าไรเดอร์ |
| plan.last_arrival_time | เวลาที่ส่งถึงลูกค้าคนสุดท้าย |
| plan.all_on_time | true เมื่อส่งถึงลูกค้าทุกคนก่อน 12:30 |
| jobs | ใบงานของไรเดอร์แต่ละคน |
| jobs.color | สีเส้นทางบนแผนที่ |
| jobs.cost | ค่าไรเดอร์ของคนนั้น |
| jobs.map_url | ลิงก์ Google Maps สำหรับนำทาง |
| jobs.stops | จุดส่งเรียงตามลำดับ |
| stops.arrival_time | เวลาที่คาดว่าจะถึงจุดส่ง |

| กรณี | ผลลัพธ์ |
|---|---|
| option ติดลบ ไม่ใช่จำนวนเต็ม หรือไม่ใช่ตัวเลข | 400 { "error": "option must be 0, 1, 2, ..." } |
| ยังไม่มีรายการสั่งซื้อ | 400 { "error": "No orders. Please add or simulate orders first" } |

ข้อจำกัด: ระยะทางคำนวณเป็นเส้นตรงระหว่างพิกัด ไม่ใช่ระยะทางตามถนน และนับถึงจุดส่งสุดท้ายโดยไม่รวมระยะเดินทางกลับร้าน

### 4.3 POST /route/confirm

ยืนยันแผนจัดส่ง ระบบจะบันทึกแผนลงฐานข้อมูลและสร้างเลขใบงานให้ไรเดอร์แต่ละคน ให้ส่ง option เดียวกับแผนที่เลือกจากข้อ 4.2

```
POST http://localhost:3000/route/confirm
```

Body

```
{ "option": 0 }
```

ผลลัพธ์ (201) ข้อมูลแผนเหมือน plan ในข้อ 4.2 โดยเพิ่ม id ของแผน และ id ของใบงานแต่ละใบ (เลขใบงานเริ่มที่ 1001)

```
{
  "id": 3,
  "created_at": "2026-10-09T04:30:00.000Z",
  "strategy": "กวาดรอบร้าน (เริ่มตำแหน่งที่ 1)",
  "profit": 834.69,
  ...
  "jobs": [
    { "id": 1001, "rider_no": 1, "color": "#e11d48", ..., "stops": [...] },
    { "id": 1002, "rider_no": 2, "color": "#16a34a", ..., "stops": [...] }
  ]
}
```

| กรณี | ผลลัพธ์ |
|---|---|
| option ไม่ถูกต้อง | 400 { "error": "option must be 0, 1, 2, ..." } |
| ยังไม่มีรายการสั่งซื้อ | 400 { "error": "No orders. Please add or simulate orders first" } |

### 4.4 GET /route/latest

แสดงแผนจัดส่งล่าสุดที่ยืนยันแล้ว ใช้สำหรับดูเลขใบงานย้อนหลัง

```
GET http://localhost:3000/route/latest
```

ผลลัพธ์ (200) รูปแบบเดียวกับข้อ 4.3

| กรณี | ผลลัพธ์ |
|---|---|
| ยังไม่มีแผนที่ยืนยัน | 404 { "error": "No confirmed plan yet" } |

### 4.5 GET /job/:id

แสดงใบงานของไรเดอร์ตามเลขใบงาน ใช้ในหน้าใบงานไรเดอร์บนมือถือ

```
GET http://localhost:3000/job/1001
```

ผลลัพธ์ (200)

```
{
  "id": 1001,
  "plan_id": 3,
  "rider_no": 1,
  "color": "#e11d48",
  "total_box": 5,
  "distance_km": 3.74,
  "duration_min": 12,
  "cost": 52.44,
  "finish_time": "11:42",
  "on_time": true,
  "map_url": "https://www.google.com/maps/dir/?api=1&...",
  "created_at": "2026-10-09T04:30:00.000Z",
  "departure_time": "11:30",
  "deadline_time": "12:30",
  "stops": [
    { "stop_no": 1, "customer_name": "ธีรเดช วงศ์ใหญ่", "quantity": 1, "arrival_time": "11:34", ... },
    { "stop_no": 2, "customer_name": "...", "quantity": 2, "arrival_time": "11:38", ... }
  ]
}
```

total_box คือจำนวนกล่องที่ไรเดอร์ต้องนำไปส่ง stops คือจุดส่งเรียงตามลำดับ และ map_url ใช้เปิดแผนที่นำทาง

| กรณี | ผลลัพธ์ |
|---|---|
| ไม่พบใบงาน | 404 { "error": "Job not found" } |

## 5. การทดสอบด้วย Postman

1. Import ไฟล์ postman/lunchbox-api.postman_collection.json
2. แก้ตัวแปร baseUrl เป็น http://localhost:3000 หรือ https://lunchflow-u723.onrender.com
3. สำหรับ POST และ PUT ให้เลือก Body แบบ raw และเลือกชนิดเป็น JSON
4. ลำดับการทดสอบที่แนะนำ: DELETE /order, POST /order/simulate, POST /route/calculate, POST /route/confirm, GET /job/1001
