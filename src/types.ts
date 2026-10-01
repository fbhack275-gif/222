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
  isBaki?: boolean;
  warranty?: string;
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

export type UserRole = 'main_admin' | 'sub_admin' | 'guest';

export interface ReceiptData {
  title: string;
  type: 'sale' | 'service' | 'due_payment' | 'repair_token';
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
