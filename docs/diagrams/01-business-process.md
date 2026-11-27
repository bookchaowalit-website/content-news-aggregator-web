# 01 — Business process (As-Is / To-Be)

content-news-aggregator-web (News Desk, news-aggregator.bookchaowalit.com) คือเดโมโต๊ะอ่านข่าวที่ทำงานในเบราว์เซอร์ บนเรื่องตัวอย่าง 5 เรื่องที่เขียนไว้ในโค้ด (ไม่ใช่ข่าวจริงและไม่มี feed): ผู้เยี่ยมชมกรองตามหมวด ค้นหา เปิดเรื่อง และทำเครื่องหมายอ่านแล้ว/บันทึกไว้ใน `localStorage` ของตัวเอง

Last reviewed: 2026-11-28 · commit `844f081`

## As-Is (จากโค้ดวันนี้)

```mermaid
flowchart LR
  AUTHOR["owner/AI แก้ SEED ใน lib/news.ts"] --> CI["CI: lint, typecheck, tests, build, security scan"]
  CI --> DEPLOY["Vercel production (CLI; push main ไม่ deploy [ต้องยืนยัน])"]
  VISITOR["ผู้เยี่ยมชม"] --> DESK["หน้า / (โต๊ะอ่าน)"]
  DEPLOY --> DESK
  DESK --> FILTER["กรองหมวด + ค้นหา (ในเบราว์เซอร์; เก็บใน URL hash หลังหยุดพิมพ์ 300 ms)"]
  DESK --> STORY["/stories/id: why-read-it note"]
  STORY --> MARK["mark read / saved"]
  MARK --> STORE["localStorage news-desk-v2 (เฉพาะ boolean ของ id ที่รู้จัก)"]
  STORE -->|"ข้อมูลเสีย"| IGN["ละทิ้ง ใช้ SEED เดิม"]
  STORE -->|"storage ถูกบล็อก"| SESSION["จำได้เฉพาะตอนเปิดหน้านี้"]
  STORE --> DESK
  DESK -->|error| SENTRY["Sentry (ถ้ามี DSN, ตัดข้อมูลส่วนตัว)"]
  CLIENT["MCP client"] --> MCP["POST /api/mcp: list_stories, get_story, search_stories (read-only, sample: true)"]
  MCP -->|"tool/id/beat/method ไม่รู้จัก"| ERR["JSON-RPC error"]
```

Sources: `lib/news.ts`, `lib/desk-hash.ts`, `app/page.tsx`, `app/stories/[id]/page.tsx`, `app/api/mcp/route.ts`, `lib/sentry.ts`, `.github/workflows/ci.yml`, `README.md`, `PRODUCT.md`

หมายเหตุ: `PRODUCT.md` (2026-10-23) ระบุว่า Vercel Git link ชี้รีโปเก่า จึงไม่ deploy จาก push main; สถานะปัจจุบัน [ต้องยืนยัน]. เครื่องหมาย read/saved ไม่ถูกส่งไป server และ MCP ไม่เห็นค่านี้

## To-Be

ไม่มี To-Be ที่เขียนไว้ (`PRODUCT.md` ระบุว่าไม่มี RSS/AI scoring/dedup และไม่ได้กำหนดเป็นเป้าหมาย)

## Gap

| ID | As-Is → To-Be | Status | Owner | Evidence |
|---|---|---|---|---|
| G1 | ไม่มี To-Be ของกระบวนการ → owner กำหนดว่าจะต่อ feed จริง (RSS ฯลฯ) หรือคงเป็นเดโมตัวอย่าง | decide | owner | ไม่มีใน `PRODUCT.md` / `specs/` |
| G2 | push main ไม่ deploy (Vercel Git link ชี้รีโปเก่า) → ผูก Vercel Git | decide | owner | `PRODUCT.md` §Live URL and deploy state (D9) |

## Open questions

- ข้อจำกัดด้านการเลื่อนหน้า/การคืนค่า filter ตอนกด Back อยู่ใน `PRODUCT.md` §Known limits ยังไม่มีแผนแก้ที่เขียนไว้
