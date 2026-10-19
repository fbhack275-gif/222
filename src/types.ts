export interface InventoryItem {
  id: string;
  category: string;
  brand: string;
  name: string;
  models: string[];
  stock: number;
  price: number; // Buy price (ক্রয়মূল্য)
  sellingPrice: number; // Sell price (বিক্রয়মূল্য)
  sku?: string;
  warranty?: string;
  shopName?: string;
  updatedAt?: string;
  _fbKey?: string;
}

export interface DueHistoryItem {
  id?: string;
  date: string;
  type?: 'due' | 'payment'; // 'due' (বাকি বৃদ্ধি) or 'payment' (টাকা জমা)
  amount: number;
  note?: string;
  seller?: string;
}

export interface CustomerDue {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  totalAmount: number; // All dues accumulated
  paidAmount: number; // All payments accumulated
  seller?: string;
  date: string;
  history?: DueHistoryItem[];
  updatedAt?: string;
  _fbKey?: string;
}

export interface SupplierDue {
  id: string;
  name: string;
  market?: string; // e.g. Motaleb Plaza, Sundarban Square
  phone?: string;
  note?: string;
  totalAmount: number;
  paidAmount: number;
  date: string;
  history?: DueHistoryItem[];
  updatedAt?: string;
  _fbKey?: string;
}

export interface SaleRecord {
  id: string;
  itemId?: string;
  name: string;
  qty: number;
  buy: number;
  sell: number;
  seller: string;
  date: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  customer?: string;
  phone?: string;
  isBaki?: boolean;
  warranty?: string;
  isOutsidePurchase?: boolean;
  cashPurchaseId?: string;
  _fbKey?: string;
}

export interface CashPurchaseRecord {
  id: string;
  itemName: string;
  itemId?: string;
  category?: string;
  brand?: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  sellingPrice?: number;
  supplierName?: string;
  customerName?: string;
  type: 'instant_sell' | 'restock';
  isSold?: boolean;
  saleId?: string;
  note?: string;
  seller: string;
  date: string;
  _fbKey?: string;
}

export interface ServiceRecord {
  id: string;
  type: string;
  desc: string;
  cost: number;
  paid: number;
  seller: string;
  date: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  _fbKey?: string;
}

export interface RepairJob {
  id: string;
  tokenNo: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  problem: string;
  estimatedCost: number;
  advancePaid: number;
  status: 'pending' | 'ready' | 'delivered';
  date: string;
  deliveryDate?: string;
  seller: string;
  _fbKey?: string;
}

export interface ShopExpense {
  id: string;
  category: string;
  note: string;
  amount: number;
  date: string;
  seller: string;
  _fbKey?: string;
}

export interface ProductPreOrder {
  id: string;
  type: 'customer_order' | 'shop_demand'; // 'customer_order' (কাস্টমার অগ্রিম বায়না সহ অর্ডার) vs 'shop_demand' (দোকানের জন্য স্টক চাহিদা)
  itemName: string; // পণ্যের নাম / পার্টস
  category?: string; // ক্যাটাগরি
  brand?: string; // ব্র্যান্ড
  modelOrCode?: string; // মডেল বা কোড
  qty: number; // পরিমাণ
  purpose: string; // কি কাজের জন্য অর্ডার দেওয়া হয়েছে (যেমন: ডিসপ্লে পরিবর্তন, সার্ভিসিং, ব্যাটারি বদল ইত্যাদি)
  customerName?: string; // কাস্টমারের নাম
  customerPhone?: string; // মোবাইল নম্বর
  estimatedPrice: number; // মোট বা আনুমানিক দাম
  advancePaid: number; // অগ্রিম / বায়না জমা টাকা
  dueAmount: number; // বাকি টাকা
  advancePaymentMethod?: string; // নগদ ক্যাশ, বিকাশ, নগদ (Nagad), রকেট ইত্যাদি
  advanceHistory?: {
    date: string;
    amount: number;
    method: string;
    note?: string;
  }[];
  status: 'pending' | 'arrived' | 'delivered' | 'cancelled'; // স্ট্যাটাস: আনতে হবে, এসেছে/রেডি, ডেলিভারি সম্পন্ন, বাতিল
  orderDate: string; // অর্ডার নেওয়ার তারিখ
  expectedDate?: string; // সম্ভাব্য ডেলিভারির তারিখ
  deliveredDate?: string; // ডেলিভারি দেওয়ার তারিখ
  note?: string; // অতিরিক্ত বিশেষ তথ্য
  seller: string; // অপারেটর
  _fbKey?: string;
}

export type UserRole = 'main_admin' | 'sub_admin' | 'guest';

export interface ReceiptData {
  title: string;
  type: 'sale' | 'service' | 'due_payment' | 'repair_token' | 'preorder_token';
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    name: string;
    qty?: number;
    rate?: number;
    amount: number;
  }[];
  subtotal: number;
  paid: number;
  due: number;
  seller: string;
  note?: string;
}

export interface AppUser {
  id: string;
  name: string;
  role: 'main_admin' | 'sub_admin';
  pin: string;
  phone?: string;
  shopName?: string;
  createdAt: string;
  isDefault?: boolean;
  _fbKey?: string;
}

export const DEFAULT_APP_USERS: AppUser[] = [
  {
    id: 'user_admin_anik',
    name: 'Anik',
    role: 'main_admin',
    pin: '778570',
    phone: '01700000000',
    shopName: 'Anik Telecom',
    createdAt: '2026-01-01',
    isDefault: true
  },
  {
    id: 'user_sub_parvej',
    name: 'Parvej',
    role: 'sub_admin',
    pin: '8797',
    phone: '01800000000',
    shopName: 'Anik Telecom',
    createdAt: '2026-01-01',
    isDefault: false
  }
];

export interface ShopSettings {
  shopName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  altPhone?: string;
  address: string;
  receiptFooterNote: string;
  defaultPaperSize: '58mm' | '80mm' | 'a4';
  autoPrintReceipt: boolean;
  showShopQrOnReceipt: boolean;
  showCostCodeOnReceipt: boolean;
  soundAlertsEnabled: boolean;
  lowStockThreshold: number;
  currencySymbol: string;
  defaultWarrantyNote: string;
  bkashNumber?: string;
  nagadNumber?: string;
  compactInventoryView?: boolean;
  publicCatalogMode?: boolean;
  hideStockCountForPublic?: boolean;
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: 'Anik Telecom',
  tagline: 'মোবাইল সার্ভিসিং ও পার্টস শপ',
  ownerName: 'মোঃ অনিক হোসেন',
  phone: '01700000000',
  altPhone: '01800000000',
  address: 'তালুকদার মার্কেট, কাঁচাবাজার মোড়',
  receiptFooterNote: 'ধন্যবাদ, আবার আসবেন! বিক্রিত পণ্য উপযুক্ত কারণ ছাড়া ফেরত নেওয়া হয় না। ডিসপ্লে সোল্ডারিং/ফিটিং এর পর কোনো গ্যারান্টি থাকবে না।',
  defaultPaperSize: '80mm',
  autoPrintReceipt: false,
  showShopQrOnReceipt: true,
  showCostCodeOnReceipt: false,
  soundAlertsEnabled: true,
  lowStockThreshold: 2,
  currencySymbol: '৳',
  defaultWarrantyNote: '৭ দিনের ডিসপ্লে চেকিং গ্যারান্টি (ফিটিং ছাড়া)',
  bkashNumber: '01700000000',
  nagadNumber: '01700000000',
  compactInventoryView: false,
  publicCatalogMode: true,
  hideStockCountForPublic: true
};
