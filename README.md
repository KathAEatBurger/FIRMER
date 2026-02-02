# Log Management System

ระบบจัดการและตรวจสอบ Log (Frontend) พัฒนาด้วย **React** และ **Ant Design**
รองรับการ Export ไฟล์ Excel/PDF และมีระบบจัดการสิทธิ์ (Admin/User)

---

## 1. สิ่งที่ต้องมี (Prerequisites)
ก่อนเริ่มรันโปรเจกต์ ต้องแน่ใจว่าเครื่องคอมพิวเตอร์ติดตั้ง:

* **Node.js** (แนะนำเวอร์ชัน **v22.22.0** )
    * [ดาวน์โหลด Node.js ที่นี่](https://nodejs.org/)
* **Editor**: Visual Studio Code (VS Code)

## 2. การติดตั้ง (Installation)

1.  **Clone** หรือ **Download** โปรเจกต์ลงมาที่เครื่อง
2.  เปิด **Terminal** (ใน VS Code กด `Ctrl` + `~`) แล้วเข้าไปที่โฟลเดอร์โปรเจกต์
3.  ติดตั้ง Library ที่จำเป็นด้วยคำสั่ง:

```bash
npm install
```
หมายเหตุ: หากยังไม่ได้สร้างไฟล์ package.json หรือต้องการลง Library แยกรายตัว ให้ใช้คำสั่งนี้:

```
npm install antd @ant-design/icons dayjs xlsx jspdf jspdf-autotable
```

## 3. การเตรียมไฟล์ข้อมูล (Mock Data)
เพื่อให้ระบบทำงานได้ ตรวจสอบให้แน่ใจว่ามีไฟล์ JSON อยู่ในโฟลเดอร์ src/ ดังนี้:

src/

internQuest.user.json   <-- ข้อมูล User

internQuest.log.json    <-- ข้อมูล Log

## 4. การรันโปรเจกต์ (Run Project)
ใช้คำสั่งผ่าน Terminal ของ VS Code:

กรณีใช้ Vite (แนะนำ):

Bash
npm run dev
เมื่อรันสำเร็จ ระบบจะแสดง Link ใน Terminal:

ให้กด Ctrl + Click ที่ Link http://localhost:5173 เพื่อเปิด Browser

(หรือ http://localhost:3000 หากใช้ Create React App)
