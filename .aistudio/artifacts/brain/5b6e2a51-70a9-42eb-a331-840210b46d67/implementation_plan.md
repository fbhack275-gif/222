# Anik Telecom - Advanced Feature Roadmap & System Expansion

A comprehensive implementation plan outlining high-impact upgrades for **Anik Telecom Mobile Servicing & Parts Shop**, focusing on shop communication automation, thermal POS receipts, warranty verification, and market purchasing workflows.

## User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were skipped. We have prioritized the top 4 most practical and high-value features for mobile servicing and parts shops in Bangladesh, with recommended implementations detailed below.

- **Primary Upgrade 1 (Automated WhatsApp & Customer Notification Hub)**: One-click formatted WhatsApp templates for repair readiness, due reminders, and pre-order arrivals.
- **Primary Upgrade 2 (Thermal POS 58mm/80mm Printer Slip)**: Dual print mode supporting both full cash memo and compact thermal roll printers.
- **Primary Upgrade 3 (Device IMEI & Parts Warranty Tracker)**: Record and check IMEI/Serial numbers with remaining warranty days.
- **Primary Upgrade 4 (Wholesale Market Reorder Sheet)**: Auto-compile out-of-stock items and customer pre-orders into a wholesale procurement list for Stadium Market / Chawkbazar suppliers.

---

## 1. Overview & Core Concept

### What It Delivers
This expansion equips shop operators and technicians with enterprise-grade operational tools designed for real-world retail mobile repair counters:
1. **Instant Customer Communication**: Eliminates phone calling overhead by sending pre-formatted, professional Bangla WhatsApp slips for every stage of service and order.
2. **Hardware Receipt Flexibility**: Seamless printing on standard POS thermal paper (58mm / 80mm roll) or standard printers without messy margins.
3. **Warranty Assurance**: Instant lookup of customer phone repairs and battery/display warranty claims via IMEI or phone number.
4. **Market Purchase Planner**: Generates wholesale market sheets directly from store shortages and customer pre-orders.

### Target Personas
- **Store Owner (Anik / Main Admin)**: Oversees wholesale purchasing, warranty disputes, and profit analytics.
- **Counter Operator (Parvej / Sub Admin)**: Quick cash billing, thermal printing, and customer notification dispatch.
- **Technician**: Updates repair status (`ready`, `testing`, `delivered`) with automatic notification triggers.

---

## 2. System Architecture & Feature Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Anik Telecom Mobile POS & ERP                     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ WhatsApp Hub │             │ Thermal POS  │             │ IMEI Tracker │
│ Notification │             │ 58mm / 80mm  │             │  & Warranty  │
└──────────────┘             └──────────────┘             └──────────────┘
       │                            │                            │
       ├─ Repair Ready Alert        ├─ 58mm Mini Slip            ├─ IMEI Search
       ├─ Due Collection Reminder   ├─ 80mm Wide Slip            ├─ Warranty Days
       └─ Pre-Order Arrival Msg     └─ Full A4 Cash Memo         └─ Claim Record
                                    │
                                    ▼
                             ┌──────────────┐
                             │ Market Sheet │
                             │ Wholesale PO │
                             └──────────────┘
                                    │
                                    ├─ Stadium Market List
                                    └─ Shortage Aggregator
```

---

## 3. Detailed Proposed Feature Modules

### Module A: Automated WhatsApp & Communication Hub
- **Repair Completion Notice**:
  When a repair job status is marked as `ready` ("মেরামত সম্পন্ন"), a 1-tap WhatsApp button sends a polite message:
  ```
  *অনিক টেলিকম - সার্ভিস নোটিফিকেশন*
  সম্মানিত গ্রাহক, আপনার ফোনটি (মডেল: Vivo Y20) মেরামত সম্পন্ন হয়েছে।
  মোট বিল: ৳১,২০০ | জমা: ৳৫০০ | অবশিষ্ট বাকি: ৳৭০০
  দোকান থেকে ফোনটি সংগ্রহ করার জন্য অনুরোধ করা হচ্ছে।
  ```
- **Due Payment Reminder**:
  A dedicated reminder button in the Dues Ledger that generates a polite due settlement request with shop bKash/Nagad number.
- **Pre-Order Arrival Notice**:
  When a pre-ordered display or battery arrives in store (`arrived`), notify the customer to collect the part with their token number.

### Module B: Thermal POS Slip Print Engine (58mm / 80mm)
- **Compact Roll Layout**:
  Optimized black-and-white high-contrast thermal layout without color ink waste.
- **Print Mode Selector**:
  Modal print options: `থার্মাল পিওএস স্লিপ (৫৮ মিমি)` vs `স্ট্যান্ডার্ড ক্যাশ মেমো (এ৪/হাফ পেজ)`.
- **Receipt Details**:
  Shop header, transaction time, operator name, items list with unit price, advance paid, remaining balance, and QR code for digital tracking.

### Module C: IMEI & Battery/Display Warranty Tracker
- **Sales & Service IMEI Input**:
  Optional IMEI / Serial number field when selling items (Displays, Batteries, Chargers, Phones) or completing repairs.
- **1-Second Warranty Checker**:
  Search bar in Tools menu: enter 15-digit IMEI or phone number to see purchase date, warranty period (e.g., 3 months / 6 months), remaining active days, and previous repair notes.
- **Warranty Claim Settlement**:
  Log replacement or repair under warranty with 1-click status update.

### Module D: Wholesale Market Buying Sheet (পাইকারি ক্রয়ের ফর্দ)
- **Automatic Shortage Aggregation**:
  Combines:
  1. Low stock items (< 3 units) and out-of-stock items (0 units).
  2. Pending customer pre-orders awaiting wholesale purchase.
- **Supplier-Wise Grouping**:
  Group items by supplier or category (Display, Battery, Tools, IC, Accessories).
- **Printable / Copyable Market List**:
  Formatted for WhatsApp to send directly to wholesale market suppliers (চকবাজার / মোতালিব প্লাজা / স্টেডিয়াম মার্কেট).

---

## 4. Visual & UX Design Strategy

- **Theme Consistency**: Seamless integration with the existing slate dark aesthetic (`bg-slate-950`, cyan/amber accents).
- **Zero Distraction**: Notifications and print options open in clean, focused modal dialogs without cluttering the main inventory grid.
- **Responsive & Touch-Friendly**: Big touch targets for mobile and tablet operation behind the counter.
- **Thermal Print CSS**: Isolated `@media print` rules ensuring clean cut margins and crisp typography on POS printers.

---

## 5. Phased Implementation Roadmap

### Phase 1: Communication Automation & Thermal Printing
- Build the WhatsApp quick notification triggers across Repair Jobs, Customer Dues, and Pre-Orders.
- Add thermal receipt rendering (58mm/80mm) to `ReceiptModal.tsx` and `CashMemoStudioModal.tsx`.

### Phase 2: IMEI & Warranty Management
- Add optional IMEI/Serial tracking to `SaleRecord` and `RepairJob` in `types.ts`.
- Create `WarrantyTrackerModal.tsx` accessible from the top tools menu.

### Phase 3: Wholesale Market Reorder Generator
- Enhance `ReorderModal.tsx` with combined pre-order demands and direct export capabilities for wholesale market purchases.

---

## 6. Verification & Quality Assurance

- **Print Testing**: Test thermal slip rendering at 58mm and 80mm CSS widths across Google Chrome / Android print dialogs.
- **WhatsApp Web Links**: Verify URI encoding for Bengali characters and phone number formatting (`+880` prefix handling).
- **Firebase Sync**: Validate that any new fields (IMEI, warranty expiry) sanitize safely through `sanitizeForFirebase`.
- **Performance**: Zero lag on inventory searches and POS cart operations.
