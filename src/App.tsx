import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ref, 
  onValue, 
  set, 
  update, 
  remove 
} from 'firebase/database';
import { rtdb } from './firebase';
import { 
  InventoryItem, 
  CustomerDue, 
  SupplierDue,
  SaleRecord, 
  ServiceRecord, 
  RepairJob,
  ShopExpense,
  CashPurchaseRecord,
  ProductPreOrder,
  UserRole, 
  ReceiptData,
  DueHistoryItem,
  ShopSettings,
  DEFAULT_SHOP_SETTINGS
} from './types';
import { HighlightText, isMatch } from './utils/highlight';
import { toCostCode } from './utils/costCode';
import { sanitizeForFirebase } from './utils/firebaseSanitize';
import { ReceiptModal } from './components/ReceiptModal';
import { AddDueModal } from './components/AddDueModal';
import { CollectPaymentModal } from './components/CollectPaymentModal';
import { CustomerLedgerModal } from './components/CustomerLedgerModal';
import { ReorderModal } from './components/ReorderModal';
import { RepairJobModal } from './components/RepairJobModal';
import { ExpenseModal } from './components/ExpenseModal';
import { ShopCalculatorModal } from './components/ShopCalculatorModal';
import { CashDrawerModal } from './components/CashDrawerModal';
import { SupplierLedgerModal } from './components/SupplierLedgerModal';
import { ProfitCalculatorModal } from './components/ProfitCalculatorModal';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { PosCartModal, CartItem } from './components/PosCartModal';
import { DailySummaryModal } from './components/DailySummaryModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { MessageHubModal } from './components/MessageHubModal';
import { CustomerQrModal } from './components/CustomerQrModal';
import { CashMemoStudioModal } from './components/CashMemoStudioModal';
import { InlineBarcodeScanner } from './components/InlineBarcodeScanner';
import { PreOrdersView } from './components/PreOrdersView';
import { PreOrderModal } from './components/PreOrderModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfessionalCategoryBar } from './components/ProfessionalCategoryBar';
import { MobilePartsView } from './components/MobilePartsView';
import { HomeHubView } from './components/HomeHubView';
import { isMobilePartItem, getCategoryDisplay, CATEGORY_DEFINITIONS } from './utils/categoryHelpers';
import { sendWhatsAppMessage } from './utils/whatsapp';
import { exportToCSV } from './utils/csvExport';
import {
  playCashRegisterSound,
  sendBrowserSaleNotification,
  requestNotificationPermission,
  isNotificationSupported
} from './utils/audioNotification';
import {
  Home,
  Boxes,
  Wrench,
  BookOpen,
  BarChart3,
  Search,
  Plus,
  Eye,
  EyeOff,
  Phone,
  Printer,
  Share2,
  Trash2,
  Edit,
  DollarSign,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ShoppingBag,
  Calculator,
  Smartphone,
  FileText,
  Check,
  Percent,
  Building2,
  SlidersHorizontal,
  ArrowUpDown,
  Menu,
  X,
  Wallet,
  ShoppingCart,
  ScanBarcode,
  MessageSquare,
  FileSpreadsheet,
  QrCode,
  RefreshCw,
  ClipboardList,
  PackagePlus,
  History,
  Volume2,
  VolumeX,
  Bell,
  Settings
} from 'lucide-react';

const MAIN_ADMIN_PIN = "778570";
const SUB_ADMIN_PIN = "8797";

const defaultCategories = [
  'Display', 
  'Battery', 
  'Charger', 
  'Sub Charging Board', 
  'Screen Protector', 
  'Cable', 
  'Earphones', 
  'Airbuds', 
  'Back Shell'
];

const defaultBrands = [
  'Oppo', 
  'Vivo', 
  'Samsung', 
  'Realme', 
  'Redmi', 
  'Infinix', 
  'Tecno', 
  'itel', 
  'Apple', 
  'Xiaomi'
];

export default function App() {
  // Auth & Roles - Main Admin: Anik (pass: 778570), Sub Admin: Parvej (pass: 8797)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const savedV2 = localStorage.getItem('anik_auth_role_v2') as UserRole | null;
    if (savedV2 === 'main_admin' || savedV2 === 'sub_admin' || savedV2 === 'guest') {
      return savedV2;
    }
    return 'guest';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedLoginUser, setSelectedLoginUser] = useState<'Anik' | 'Parvej'>('Anik');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isMainAdmin = userRole === 'main_admin';
  const isSubAdmin = userRole === 'sub_admin';
  const isAdminLoggedIn = userRole === 'main_admin' || userRole === 'sub_admin';

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Local Storage resilient helpers
  const loadInitialLocal = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
        if (parsed && typeof parsed === 'object') return parsed as unknown as T;
      }
    } catch {}
    return fallback;
  };

  const saveLocal = <T,>(key: string, data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  // App State from Firebase + Local Storage Resilient Cache
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadInitialLocal('anik_pos_inventory_v1', []));
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => loadInitialLocal('anik_pos_sales_v1', []));
  const [servicesData, setServicesData] = useState<ServiceRecord[]>(() => loadInitialLocal('anik_pos_services_v1', []));
  const [repairJobs, setRepairJobs] = useState<RepairJob[]>(() => loadInitialLocal('anik_pos_repairs_v1', []));
  const [shopExpenses, setShopExpenses] = useState<ShopExpense[]>(() => loadInitialLocal('anik_pos_expenses_v1', []));
  const [cashPurchases, setCashPurchases] = useState<CashPurchaseRecord[]>(() => loadInitialLocal('anik_pos_cash_purchases_v1', []));
  const [duesData, setDuesData] = useState<CustomerDue[]>(() => loadInitialLocal('anik_pos_dues_v1', []));
  const [supplierDues, setSupplierDues] = useState<SupplierDue[]>(() => loadInitialLocal('anik_pos_suppliers_v1', []));
  const [productPreOrders, setProductPreOrders] = useState<ProductPreOrder[]>(() => loadInitialLocal('anik_pos_preorders_v1', []));
  const [sellers, setSellers] = useState<string[]>(['MD Anik Hossain']);
  const [activeSeller, setActiveSeller] = useState<string>(() => {
    return localStorage.getItem('gsm_active_seller_v16') || 'MD Anik Hossain';
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // UI Tabs & Views
  const [activeTab, setActiveTab] = useState<'home' | 'inventory' | 'mobile_parts' | 'services' | 'dues' | 'dashboard' | 'preorders'>('home');
  const [categoryScope, setCategoryScope] = useState<'all' | 'parts' | 'accessories'>('parts');
  const [showValuationCard, setShowValuationCard] = useState(false);
  const [serviceSubTab, setServiceSubTab] = useState<'repairs' | 'digital' | 'expenses'>('repairs');
  const [inventoryViewMode, setInventoryViewMode] = useState<'folders' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  // Recent Searches in Local State & Storage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    return loadInitialLocal<string[]>('anik_pos_recent_searches_v1', [
      'Y20',
      'Y17',
      'A50',
      'Universal',
      'Realme C21',
      'Battery'
    ]);
  });
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'stock_high' | 'stock_low' | 'price_high' | 'price_low'>('default');

  // Privacy & Buying Price Protection
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('anik_privacy_mode') !== 'false';
  });
  const [revealedCardsMap, setRevealedCardsMap] = useState<Record<string, boolean>>({});
  const [expandedModelsMap, setExpandedModelsMap] = useState<Record<string, boolean>>({});

  // Live Sale Notification & Sound State
  const [latestSaleAlert, setLatestSaleAlert] = useState<{
    id: string;
    name: string;
    qty: number;
    total: number;
    seller: string;
    time: string;
    isBaki?: boolean;
  } | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('anik_sound_enabled') !== 'false';
  });
  const [isBrowserNotificationEnabled, setIsBrowserNotificationEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const isInitialSalesLoad = useRef(true);
  const knownSaleIds = useRef<Set<string>>(new Set());

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isItemInlineScannerOpen, setIsItemInlineScannerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState<{
    category: string;
    brand: string;
    name: string;
    models: string;
    stock: string | number;
    price: string | number;
    sellingPrice: string | number;
    sku: string;
  }>({
    category: '',
    brand: '',
    name: '',
    models: '',
    stock: '1',
    price: '',
    sellingPrice: '',
    sku: ''
  });

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState<InventoryItem | null>(null);
  const [sellQty, setSellQty] = useState<string | number>('1');
  const [sellPrice, setSellPrice] = useState<string | number>('');
  const [sellIsBaki, setSellIsBaki] = useState(false);
  const [sellCustomerName, setSellCustomerName] = useState('');
  const [sellCustomerPhone, setSellCustomerPhone] = useState('');
  const [sellPaidNow, setSellPaidNow] = useState<string | number>('');
  const [sellWarranty, setSellWarranty] = useState('কোনো ওয়ারেন্টি নেই');

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [serviceFormData, setServiceFormData] = useState<{
    type: string;
    desc: string;
    cost: string | number;
    paid: string | number;
    customerName: string;
    customerPhone: string;
    isBaki: boolean;
    date?: string;
  }>({
    type: 'Recharge/Flexiload',
    desc: '',
    cost: '',
    paid: '',
    customerName: '',
    customerPhone: '',
    isBaki: false,
    date: ''
  });

  // Repair & Expense & Reorder & Calculator & Cash Drawer & Supplier Modals
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [editingRepairJob, setEditingRepairJob] = useState<RepairJob | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ShopExpense | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isPreOrderModalOpen, setIsPreOrderModalOpen] = useState(false);
  const [editingPreOrder, setEditingPreOrder] = useState<ProductPreOrder | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProfitCalcOpen, setIsProfitCalcOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New POS Cart & Researched Options Modals
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isMessageHubOpen, setIsMessageHubOpen] = useState(false);
  const [isCashMemoStudioOpen, setIsCashMemoStudioOpen] = useState(false);
  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    return loadInitialLocal<ShopSettings>('anik_pos_shop_settings_v1', DEFAULT_SHOP_SETTINGS);
  });

  // Customer WhatsApp & Contact QR Code
  const [isCustomerQrOpen, setIsCustomerQrOpen] = useState(false);
  const [qrCustomerData, setQrCustomerData] = useState<{ name: string; phone: string; due: number }>({
    name: '',
    phone: '',
    due: 0
  });

  const handleOpenCustomerQr = (name: string, phone: string, due: number = 0) => {
    setQrCustomerData({ name, phone, due });
    setIsCustomerQrOpen(true);
  };

  // Baki Khata Modals
  const [isAddDueModalOpen, setIsAddDueModalOpen] = useState(false);
  const [duePreselectedCustomer, setDuePreselectedCustomer] = useState<CustomerDue | null>(null);
  const [collectingCustomer, setCollectingCustomer] = useState<CustomerDue | null>(null);
  const [viewingLedgerCustomer, setViewingLedgerCustomer] = useState<CustomerDue | null>(null);
  const [dueSearchQuery, setDueSearchQuery] = useState('');
  const [dueFilterStatus, setDueFilterStatus] = useState<'all' | 'pending' | 'cleared'>('all');

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Seller Modal
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');

  // Dashboard Filters
  const [timeFilter, setTimeFilter] = useState<'today' | '7' | '30' | 'all'>('today');

  // Reinvestment / Outside Purchase Form State (বিক্রির টাকায় পুনরায় মাল কেনা ও বাহিরের পার্টস বিক্রি)
  const [reinvestMode, setReinvestMode] = useState<'instant_sell' | 'restock'>('instant_sell');
  const [reinvestItemName, setReinvestItemName] = useState('');
  const [reinvestSelectedItemId, setReinvestSelectedItemId] = useState('');
  const [reinvestQty, setReinvestQty] = useState<string>('1');
  const [reinvestBuyPrice, setReinvestBuyPrice] = useState<string>('');
  const [reinvestSellPrice, setReinvestSellPrice] = useState<string>('');
  const [reinvestSupplier, setReinvestSupplier] = useState('');
  const [reinvestCustomer, setReinvestCustomer] = useState('');
  const [sellingPurchaseId, setSellingPurchaseId] = useState<string | null>(null);
  const [sellingPurchaseRate, setSellingPurchaseRate] = useState<string>('');

  // Trigger Sale Notification (Web Audio Sound + Browser Notification + In-App Live Alert)
  const triggerSaleNotification = (saleData: {
    id: string;
    name: string;
    qty: number;
    total: number;
    seller: string;
    isBaki?: boolean;
  }) => {
    // Play cash register chime if sound is enabled
    if (isSoundEnabled) {
      playCashRegisterSound();
    }

    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setLatestSaleAlert({
      ...saleData,
      time: nowStr
    });

    // Send native browser notification
    const bakiText = saleData.isBaki ? ' (বাকি বিক্রি)' : ' (নগদ বিক্রি)';
    sendBrowserSaleNotification(
      `🎉 নতুন বিক্রি সম্পন্ন! ৳${saleData.total.toLocaleString()}`,
      `পণ্য: ${saleData.name} (${saleData.qty} পিস)\nবিক্রেতা: ${saleData.seller}${bakiText}`
    );

    // Auto dismiss in-app alert after 6.5s
    setTimeout(() => {
      setLatestSaleAlert(prev => (prev?.id === saleData.id ? null : prev));
    }, 6500);
  };

  // Toggle Sound Preference
  const toggleSoundPreference = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    localStorage.setItem('anik_sound_enabled', String(next));
    if (next) {
      playCashRegisterSound();
      showToast('বিক্রি নোটিফিকেশন সাউন্ড অন করা হয়েছে 🔔', 'success');
    } else {
      showToast('নোটিফিকেশন সাউন্ড মিউট করা হয়েছে 🔕', 'info');
    }
  };

  // Enable Browser System Notifications
  const handleEnableBrowserNotifications = async () => {
    if (!isNotificationSupported()) {
      showToast('আপনার ব্রাউজার পুশ নোটিফিকেশন সাপোর্ট করে না', 'error');
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      setIsBrowserNotificationEnabled(true);
      sendBrowserSaleNotification('Anik Telecom নোটিফিকেশন সক্রিয়! ✅', 'এখন থেকে যেকোনো বিক্রি হলে সাথে সাথে নোটিফিকেশন পাবেন।');
      showToast('ব্রাউজার নোটিফিকেশন সফলভাবে অন করা হয়েছে! 🔔', 'success');
    } else {
      showToast('নোটিফিকেশন পারমিশন পাওয়া যায়নি। ব্রাউজার সেটিংসে অনুমতি দিন।', 'error');
    }
  };

  // 1. Firebase Listeners + Local Storage Sync
  useEffect(() => {
    const invRef = ref(rtdb, 'inventory');
    const unsubInv = onValue(invRef, snapshot => {
      setIsFirebaseConnected(true);
      const val = snapshot.val();
      if (val) {
        const fbList: InventoryItem[] = Object.entries(val)
          .map(([fbKey, itemData]: [string, any]) => {
            const raw = itemData || {};
            const effectiveId = String(raw.id || fbKey);
            return {
              id: effectiveId,
              _fbKey: fbKey,
              name: String(raw.name || '').trim(),
              brand: String(raw.brand || 'General').trim(),
              category: String(raw.category || 'Display').trim(),
              models: Array.isArray(raw.models)
                ? raw.models.filter(Boolean)
                : typeof raw.models === 'string'
                ? raw.models.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean)
                : [],
              stock: typeof raw.stock === 'number' ? raw.stock : parseInt(String(raw.stock)) || 0,
              price: typeof raw.price === 'number' ? raw.price : parseFloat(String(raw.price)) || 0,
              sellingPrice: typeof raw.sellingPrice === 'number' ? raw.sellingPrice : parseFloat(String(raw.sellingPrice)) || 0,
              sku: String(raw.sku || '').trim(),
              updatedAt: raw.updatedAt || new Date().toLocaleDateString('en-GB')
            };
          })
          .filter(item => Boolean(item.name || item.sku));

        setInventory(prev => {
          const itemMap = new Map<string, InventoryItem>();
          
          // Index remote items by their unique key (_fbKey or id)
          fbList.forEach(item => {
            const key = item._fbKey || item.id;
            itemMap.set(key, item);
            if (item.id && !itemMap.has(item.id)) {
              itemMap.set(item.id, item);
            }
          });

          // Preserve any item in current session if not yet confirmed by remote snapshot
          prev.forEach(p => {
            const key = p._fbKey || p.id;
            if (!itemMap.has(key) && (!p.id || !itemMap.has(p.id))) {
              itemMap.set(key, p);
              const k = String(key).replace(/[.#$[\]/]/g, '_');
              set(ref(rtdb, 'inventory/' + k), sanitizeForFirebase(p)).catch(() => {});
            }
          });

          // Ensure strictly unique items by their unique id / _fbKey
          const seen = new Set<string>();
          const merged: InventoryItem[] = [];
          for (const item of itemMap.values()) {
            const uniqueKey = item._fbKey || item.id;
            if (!seen.has(uniqueKey) && (!item.id || !seen.has(item.id))) {
              seen.add(uniqueKey);
              if (item.id) seen.add(item.id);
              merged.push(item);
            }
          }

          saveLocal('anik_pos_inventory_v1', merged);
          return merged;
        });
      } else {
        const local = loadInitialLocal<InventoryItem[]>('anik_pos_inventory_v1', []);
        if (local.length > 0) {
          setInventory(local);
          local.forEach(item => {
            const k = String(item._fbKey || item.id).replace(/[.#$[\]/]/g, '_');
            set(ref(rtdb, 'inventory/' + k), sanitizeForFirebase(item)).catch(() => {});
          });
        } else {
          setInventory([]);
        }
      }
    }, error => {
      console.warn('Firebase inventory listener error:', error);
      setIsFirebaseConnected(false);
      const local = loadInitialLocal<InventoryItem[]>('anik_pos_inventory_v1', []);
      if (local.length > 0) setInventory(local);
    });

    const salesRef = ref(rtdb, 'salesHistory');
    const unsubSales = onValue(salesRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: SaleRecord[] = Object.entries(val).map(([fbKey, saleData]: [string, any]) => ({
          ...(saleData || {}),
          id: saleData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();

        // Check if new sales arrived (from other devices/sellers or counter)
        if (!isInitialSalesLoad.current && list.length > 0) {
          const newSales = list.filter(s => !knownSaleIds.current.has(s.id));
          if (newSales.length > 0) {
            // Trigger notification for the latest incoming sale
            const newest = newSales[newSales.length - 1];
            const lineTotal = (newest.qty || 1) * (newest.sell || 0);
            triggerSaleNotification({
              id: newest.id,
              name: newest.name,
              qty: newest.qty || 1,
              total: lineTotal,
              seller: newest.seller || 'অপারেটর',
              isBaki: newest.isBaki
            });
          }
        }

        list.forEach(s => knownSaleIds.current.add(s.id));
        isInitialSalesLoad.current = false;

        setSalesHistory(reversed);
        saveLocal('anik_pos_sales_v1', reversed);
      } else {
        isInitialSalesLoad.current = false;
        const local = loadInitialLocal<SaleRecord[]>('anik_pos_sales_v1', []);
        if (local.length > 0) {
          local.forEach(s => knownSaleIds.current.add(s.id));
          setSalesHistory(local);
        }
      }
    });

    const servRef = ref(rtdb, 'servicesData');
    const unsubServ = onValue(servRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: ServiceRecord[] = Object.entries(val).map(([fbKey, srvData]: [string, any]) => ({
          ...(srvData || {}),
          id: srvData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setServicesData(reversed);
        saveLocal('anik_pos_services_v1', reversed);
      } else {
        const local = loadInitialLocal<ServiceRecord[]>('anik_pos_services_v1', []);
        if (local.length > 0) setServicesData(local);
      }
    });

    const repairRef = ref(rtdb, 'repairJobs');
    const unsubRepair = onValue(repairRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: RepairJob[] = Object.entries(val).map(([fbKey, jobData]: [string, any]) => ({
          ...(jobData || {}),
          id: jobData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setRepairJobs(reversed);
        saveLocal('anik_pos_repairs_v1', reversed);
      } else {
        const local = loadInitialLocal<RepairJob[]>('anik_pos_repairs_v1', []);
        if (local.length > 0) setRepairJobs(local);
      }
    });

    const expenseRef = ref(rtdb, 'shopExpenses');
    const unsubExpense = onValue(expenseRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: ShopExpense[] = Object.entries(val).map(([fbKey, expData]: [string, any]) => ({
          ...(expData || {}),
          id: expData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setShopExpenses(reversed);
        saveLocal('anik_pos_expenses_v1', reversed);
      } else {
        const local = loadInitialLocal<ShopExpense[]>('anik_pos_expenses_v1', []);
        if (local.length > 0) setShopExpenses(local);
      }
    });

    const cashPurchasesRef = ref(rtdb, 'cashPurchases');
    const unsubCashPurchases = onValue(cashPurchasesRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: CashPurchaseRecord[] = Object.entries(val).map(([fbKey, cpData]: [string, any]) => ({
          ...(cpData || {}),
          id: cpData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setCashPurchases(reversed);
        saveLocal('anik_pos_cash_purchases_v1', reversed);
      } else {
        const local = loadInitialLocal<CashPurchaseRecord[]>('anik_pos_cash_purchases_v1', []);
        if (local.length > 0) setCashPurchases(local);
      }
    });

    const duesRef = ref(rtdb, 'duesData');
    const unsubDues = onValue(duesRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: CustomerDue[] = Object.entries(val).map(([fbKey, dueData]: [string, any]) => ({
          ...(dueData || {}),
          id: dueData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setDuesData(reversed);
        saveLocal('anik_pos_dues_v1', reversed);
      } else {
        const local = loadInitialLocal<CustomerDue[]>('anik_pos_dues_v1', []);
        if (local.length > 0) setDuesData(local);
      }
    });

    const suppRef = ref(rtdb, 'supplierDues');
    const unsubSupp = onValue(suppRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: SupplierDue[] = Object.entries(val).map(([fbKey, suppData]: [string, any]) => ({
          ...(suppData || {}),
          id: suppData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setSupplierDues(reversed);
        saveLocal('anik_pos_suppliers_v1', reversed);
      } else {
        const local = loadInitialLocal<SupplierDue[]>('anik_pos_suppliers_v1', []);
        if (local.length > 0) setSupplierDues(local);
      }
    });

    const sellersRef = ref(rtdb, 'sellers');
    const unsubSellers = onValue(sellersRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        setSellers(Object.values(val) as string[]);
      } else {
        set(sellersRef, ['MD Anik Hossain']);
      }
    });

    const preordersRef = ref(rtdb, 'productPreOrders');
    const unsubPreorders = onValue(preordersRef, snapshot => {
      const val = snapshot.val();
      if (val) {
        const list: ProductPreOrder[] = Object.entries(val).map(([fbKey, poData]: [string, any]) => ({
          ...(poData || {}),
          id: poData?.id || fbKey,
          _fbKey: fbKey
        }));
        const reversed = list.reverse();
        setProductPreOrders(reversed);
        saveLocal('anik_pos_preorders_v1', reversed);
      } else {
        const local = loadInitialLocal<ProductPreOrder[]>('anik_pos_preorders_v1', []);
        if (local.length > 0) setProductPreOrders(local);
      }
    });

    const settingsRef = ref(rtdb, 'shopSettings');
    const unsubSettings = onValue(settingsRef, snapshot => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        setShopSettings(prev => {
          const merged = { ...prev, ...val };
          saveLocal('anik_pos_shop_settings_v1', merged);
          return merged;
        });
      }
    });

    return () => {
      unsubInv();
      unsubSales();
      unsubServ();
      unsubRepair();
      unsubExpense();
      unsubCashPurchases();
      unsubDues();
      unsubSupp();
      unsubSellers();
      unsubPreorders();
      unsubSettings();
    };
  }, []);

  // Save active seller
  const handleSellerChange = (name: string) => {
    setActiveSeller(name);
    localStorage.setItem('gsm_active_seller_v16', name);
  };

  // Update Shop Settings (Local + Firebase Sync)
  const handleUpdateShopSettings = (newSettings: ShopSettings) => {
    setShopSettings(newSettings);
    saveLocal('anik_pos_shop_settings_v1', newSettings);
    set(ref(rtdb, 'shopSettings'), sanitizeForFirebase(newSettings)).catch(() => {});
    if (newSettings.soundAlertsEnabled !== isSoundEnabled) {
      setIsSoundEnabled(newSettings.soundAlertsEnabled);
      localStorage.setItem('anik_sound_enabled', String(newSettings.soundAlertsEnabled));
    }
    showToast('দোকান সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে! ✅', 'success');
  };

  // Auth Handling
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = enteredPin.trim();

    if (cleanPass === MAIN_ADMIN_PIN) {
      setUserRole('main_admin');
      localStorage.setItem('anik_auth_role_v2', 'main_admin');
      localStorage.setItem('anik_user_role', 'main_admin');
      handleSellerChange('Anik');
      setIsLoginModalOpen(false);
      setEnteredPin('');
      setLoginError(false);
      showToast('স্বাগতম Anik (Main Admin)! পূর্ণ নিয়ন্ত্রণ ও সব এক্সেস চালু হয়েছে 👑', 'success');
    } else if (cleanPass === SUB_ADMIN_PIN) {
      setUserRole('sub_admin');
      localStorage.setItem('anik_auth_role_v2', 'sub_admin');
      localStorage.setItem('anik_user_role', 'sub_admin');
      handleSellerChange('Parvej');
      setIsPrivacyMode(true);
      localStorage.setItem('anik_privacy_mode', 'true');
      setRevealedCardsMap({});
      if (activeTab === 'dashboard' || activeTab === 'services') {
        setActiveTab('inventory');
      }
      setIsLoginModalOpen(false);
      setEnteredPin('');
      setLoginError(false);
      showToast('স্বাগতম Parvej (Sub Admin)! সেল এন্ট্রি, স্টক এন্ট্রি ও বাকি এন্ট্রি চালু হয়েছে 🛡️', 'info');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    localStorage.setItem('anik_auth_role_v2', 'guest');
    localStorage.setItem('anik_user_role', 'guest');
    setIsPrivacyMode(true);
    setRevealedCardsMap({});
    setActiveTab('inventory');
    setIsLoginModalOpen(true);
    showToast('লগআউট সম্পন্ন হয়েছে। পুনরায় লগইন করুন।', 'info');
  };

  // Privacy & Buying Price Protection:
  const togglePrivacyMode = () => {
    if (userRole !== 'main_admin') {
      showToast('শুধুমাত্র Main Admin (Anik) কেনা দাম দেখতে পারবেন!', 'error');
      return;
    }
    const nextVal = !isPrivacyMode;
    setIsPrivacyMode(nextVal);
    localStorage.setItem('anik_privacy_mode', String(nextVal));
    setRevealedCardsMap({});
  };

  const isCardPriceVisible = (uniqueKey: string) => {
    if (isPrivacyMode) {
      // In customer/privacy mode, prices are hidden by default unless explicitly peeked
      return !!revealedCardsMap[uniqueKey];
    } else {
      // In owner mode, prices are visible by default unless explicitly hidden
      return !revealedCardsMap[uniqueKey];
    }
  };

  const toggleSingleCardBuyPrice = (uniqueKey: string) => {
    setRevealedCardsMap(prev => {
      const isCurrentlyVisible = isPrivacyMode ? !!prev[uniqueKey] : !prev[uniqueKey];
      return {
        ...prev,
        [uniqueKey]: !isCurrentlyVisible
      };
    });
  };

  // Supplier Handlers
  const handleSaveSupplier = (supplier: SupplierDue) => {
    setSupplierDues(prev => {
      const idx = prev.findIndex(s => s.id === supplier.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = supplier;
        return next;
      }
      return [supplier, ...prev];
    });
    set(ref(rtdb, 'supplierDues/' + supplier.id), sanitizeForFirebase(supplier));
    showToast(`'${supplier.name}'-এর মহাজন হিসাব আপডেট হয়েছে! ✅`, 'success');
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSupplierDues(prev => prev.filter(s => s.id !== supplierId));
    remove(ref(rtdb, 'supplierDues/' + supplierId));
    showToast('মহাজন প্রোফাইল মুছে ফেলা হয়েছে', 'info');
  };

  // Stock & Inventory Calculations
  const stockSummary = useMemo(() => {
    let totalItemsCount = inventory.length;
    let totalUnits = 0;
    let totalBuyVal = 0;
    let totalRetailVal = 0;
    let lowStockCount = 0;
    const lowStockItems: InventoryItem[] = [];

    inventory.forEach(item => {
      const qty = item.stock || 0;
      totalUnits += qty;
      totalBuyVal += qty * (item.price || 0);
      totalRetailVal += qty * (item.sellingPrice || 0);
      if (qty < 3) {
        lowStockCount++;
        lowStockItems.push(item);
      }
    });

    const potentialProfit = totalRetailVal - totalBuyVal;

    return {
      totalItemsCount,
      totalUnits,
      totalBuyVal,
      totalRetailVal,
      potentialProfit,
      lowStockCount,
      lowStockItems
    };
  }, [inventory]);

  // Filtered Inventory with Smart Model Match, SKU, Category Scope and Sorting
  const filteredInventory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let list = inventory.filter(item => {
      // Category Scope Filter (আলাদা অপশন: শুধু মোবাইল পার্টস vs এক্সেসরিজ vs সব)
      if (categoryScope === 'parts' && !isMobilePartItem(item)) return false;
      if (categoryScope === 'accessories' && isMobilePartItem(item)) return false;

      // Stock Status Filter
      if (stockStatusFilter === 'in_stock' && (item.stock || 0) <= 0) return false;
      if (stockStatusFilter === 'low_stock' && ((item.stock || 0) <= 0 || (item.stock || 0) >= 3)) return false;
      if (stockStatusFilter === 'out_of_stock' && (item.stock || 0) > 0) return false;

      if (filterLowStockOnly && (item.stock || 0) >= 3) {
        return false;
      }

      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      if (selectedBrand && item.brand !== selectedBrand) {
        return false;
      }

      if (!q) return true;

      const nameMatch = isMatch(item.name, q);
      const brandMatch = isMatch(item.brand, q);
      const categoryMatch = isMatch(item.category, q);
      const skuMatch = item.sku && isMatch(item.sku, q);
      const modelMatch = Array.isArray(item.models) && item.models.some(m => isMatch(m, q));

      return nameMatch || brandMatch || categoryMatch || skuMatch || modelMatch;
    });

    // Sorting
    if (sortBy === 'stock_high') {
      list = [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0));
    } else if (sortBy === 'stock_low') {
      list = [...list].sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else if (sortBy === 'price_high') {
      list = [...list].sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
    } else if (sortBy === 'price_low') {
      list = [...list].sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
    }

    return list;
  }, [inventory, searchQuery, filterLowStockOnly, selectedCategory, selectedBrand, stockStatusFilter, sortBy, categoryScope]);

  // Mobile Parts & Category Breakdown counts
  const mobilePartsCount = useMemo(() => {
    return inventory.filter(item => isMobilePartItem(item)).length;
  }, [inventory]);

  const accessoriesCount = useMemo(() => {
    return inventory.filter(item => !isMobilePartItem(item)).length;
  }, [inventory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach(item => {
      const c = item.category || 'Other';
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  // Categories & Brands list
  const availableCategories = useMemo(() => {
    return Array.from(new Set([...defaultCategories, ...inventory.map(i => i.category).filter(Boolean)]));
  }, [inventory]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set([...defaultBrands, ...inventory.map(i => i.brand).filter(Boolean)]));
  }, [inventory]);

  // Click outside listener for Search Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recent Searches Handlers
  const handleAddRecentSearch = (query: string) => {
    const clean = query.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      saveLocal('anik_pos_recent_searches_v1', updated);
      return updated;
    });
  };

  const handleSelectRecentSearch = (term: string) => {
    setSearchQuery(term);
    handleAddRecentSearch(term);
    setIsSearchDropdownOpen(false);
  };

  const handleRemoveRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
      saveLocal('anik_pos_recent_searches_v1', updated);
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentSearches([]);
    saveLocal('anik_pos_recent_searches_v1', []);
  };

  // Popular models from inventory for 1-click quick search suggestions
  const popularInventoryModels = useMemo(() => {
    const modelSet = new Set<string>();
    inventory.forEach(item => {
      if (Array.isArray(item.models)) {
        item.models.forEach(m => {
          const trimmed = (m || '').trim();
          if (trimmed && trimmed.length >= 2 && modelSet.size < 8) {
            modelSet.add(trimmed);
          }
        });
      }
    });
    if (modelSet.size === 0) {
      ['Y20', 'Y17', 'A50', 'Universal', 'Realme C21', 'Note 8'].forEach(m => modelSet.add(m));
    }
    return Array.from(modelSet);
  }, [inventory]);

  // Dues Summary
  const duesSummary = useMemo(() => {
    let totalDue = 0;
    let totalPaid = 0;
    let debtorCount = 0;

    duesData.forEach(d => {
      const pending = (d.totalAmount || 0) - (d.paidAmount || 0);
      if (pending > 0) {
        debtorCount++;
        totalDue += pending;
      }
      totalPaid += d.paidAmount || 0;
    });

    return { totalDue, totalPaid, debtorCount };
  }, [duesData]);

  // Filtered Dues
  const filteredDues = useMemo(() => {
    const q = dueSearchQuery.toLowerCase().trim();

    return duesData.filter(d => {
      const pending = (d.totalAmount || 0) - (d.paidAmount || 0);

      if (dueFilterStatus === 'pending' && pending <= 0) return false;
      if (dueFilterStatus === 'cleared' && pending > 0) return false;

      if (!q) return true;

      const nameMatch = isMatch(d.name, q);
      const phoneMatch = d.phone && d.phone.includes(q);
      const noteMatch = isMatch(d.note, q);

      return nameMatch || phoneMatch || noteMatch;
    });
  }, [duesData, dueSearchQuery, dueFilterStatus]);

  // Date Parsing for Dashboard
  const isWithinDays = (dateStr: string, days: 'today' | '7' | '30' | 'all') => {
    if (days === 'all') return true;
    if (!dateStr) return false;

    const parts = dateStr.split('/');
    let target: Date;
    if (parts.length === 3) {
      target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      target = new Date(dateStr);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - target.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days === 'today') return diffDays === 0;
    return diffDays >= 0 && diffDays < parseInt(days);
  };

  // Dashboard Metrics
  const dashboardMetrics = useMemo(() => {
    let revenue = 0;
    let grossProfit = 0;
    let soldUnits = 0;
    let totalExpenseAmount = 0;
    let totalSalesAmount = 0;
    let totalSalesCashAmount = 0;
    let totalSalesCost = 0;
    let totalSalesProfit = 0;
    let totalServiceIncome = 0;
    let totalServiceProfit = 0;

    const filteredSales = salesHistory.filter(s => isWithinDays(s.date, timeFilter));
    const filteredServices = servicesData.filter(s => isWithinDays(s.date, timeFilter));
    const filteredExpenses = shopExpenses.filter(e => isWithinDays(e.date, timeFilter));
    const filteredCashPurchases = cashPurchases.filter(cp => isWithinDays(cp.date, timeFilter));

    filteredSales.forEach(s => {
      const q = s.qty || 1;
      const sell = s.sell || 0;
      const buy = s.buy || 0;
      const itemRev = q * sell;
      const itemCost = q * buy;
      const itemProf = itemRev - itemCost;
      revenue += itemRev;
      totalSalesAmount += itemRev;
      if (!s.isBaki) {
        totalSalesCashAmount += itemRev;
      }
      totalSalesCost += itemCost;
      totalSalesProfit += itemProf;
      grossProfit += itemProf;
      soldUnits += q;
    });

    filteredServices.forEach(s => {
      const paid = s.paid || 0;
      const cost = s.cost || 0;
      revenue += paid;
      totalServiceIncome += paid;
      totalServiceProfit += paid - cost;
      grossProfit += paid - cost;
      soldUnits += 1;
    });

    filteredExpenses.forEach(e => {
      totalExpenseAmount += e.amount || 0;
    });

    let totalCashReinvested = 0;
    let instantOutsideCost = 0;
    let restockCashCost = 0;
    filteredCashPurchases.forEach(cp => {
      const c = cp.totalCost || 0;
      totalCashReinvested += c;
      if (cp.type === 'instant_sell') {
        instantOutsideCost += c;
      } else {
        restockCashCost += c;
      }
    });

    let periodDueCollected = 0;
    duesData.forEach(d => {
      if (d.history) {
        d.history.forEach(h => {
          if (h.type === 'payment' && isWithinDays(h.date, timeFilter)) {
            periodDueCollected += h.amount || 0;
          }
        });
      }
    });

    const netTrueProfit = grossProfit - totalExpenseAmount;
    const totalCashInHandBeforeSpend = totalSalesCashAmount + totalServiceIncome + periodDueCollected;
    const netCashRemainingInHand = totalCashInHandBeforeSpend - totalCashReinvested - totalExpenseAmount;

    return {
      revenue,
      grossProfit,
      netTrueProfit,
      totalExpenseAmount,
      soldUnits,
      totalSalesAmount,
      totalSalesCashAmount,
      totalSalesCost,
      totalSalesProfit,
      totalServiceIncome,
      totalServiceProfit,
      totalCashReinvested,
      instantOutsideCost,
      restockCashCost,
      periodDueCollected,
      totalCashInHandBeforeSpend,
      netCashRemainingInHand,
      filteredSales,
      filteredServices,
      filteredExpenses,
      filteredCashPurchases
    };
  }, [salesHistory, servicesData, shopExpenses, cashPurchases, duesData, timeFilter]);

  // Today's Executive Pulse Summary for Professional Home Hub
  const todaySummary = useMemo(() => {
    let todaySalesRev = 0;
    let todaySalesCost = 0;
    let todaySalesUnits = 0;
    let todaySalesCount = 0;
    const todaySalesList: SaleRecord[] = [];

    salesHistory.forEach(s => {
      if (isWithinDays(s.date, 'today')) {
        const q = s.qty || 1;
        const sell = s.sell || 0;
        const buy = s.buy || 0;
        todaySalesRev += q * sell;
        todaySalesCost += q * buy;
        todaySalesUnits += q;
        todaySalesCount += 1;
        todaySalesList.push(s);
      }
    });

    let todayServiceRev = 0;
    let todayServiceCost = 0;
    servicesData.forEach(s => {
      if (isWithinDays(s.date, 'today')) {
        todayServiceRev += s.paid || 0;
        todayServiceCost += s.cost || 0;
      }
    });

    let todayExpenseAmount = 0;
    shopExpenses.forEach(e => {
      if (isWithinDays(e.date, 'today')) {
        todayExpenseAmount += e.amount || 0;
      }
    });

    const todayGrossProfit = (todaySalesRev - todaySalesCost) + (todayServiceRev - todayServiceCost);
    const todayNetProfit = todayGrossProfit - todayExpenseAmount;

    return {
      todaySalesRev,
      todaySalesCost,
      todaySalesUnits,
      todaySalesCount,
      todaySalesList: [...todaySalesList].reverse(),
      todayServiceRev,
      todayGrossProfit,
      todayNetProfit,
      todayExpenseAmount
    };
  }, [salesHistory, servicesData, shopExpenses]);

  // Fast Receipt Reprint from Home Feed
  const handleReprintSaleReceipt = (sale: SaleRecord) => {
    const q = sale.qty || 1;
    const unitPrice = sale.sell || 0;
    const total = q * unitPrice;
    setReceiptData({
      title: 'ক্যাশ মেমো / বিক্রয় রসিদ (POS)',
      type: 'sale',
      date: sale.date || new Date().toLocaleDateString('en-GB'),
      customerName: sale.customerName || sale.customer || undefined,
      customerPhone: sale.customerPhone || sale.phone || undefined,
      items: [{
        name: sale.name,
        qty: q,
        rate: unitPrice,
        amount: total
      }],
      subtotal: total,
      paid: total,
      due: 0,
      seller: sale.seller || activeSeller,
      note: sale.isBaki ? 'বাকি বিক্রয়' : undefined
    });
  };

  // Fast WhatsApp Share from Home Feed
  const handleShareSaleWhatsApp = (sale: SaleRecord) => {
    const phone = sale.customerPhone || sale.phone || '';
    const q = sale.qty || 1;
    const total = q * (sale.sell || 0);
    const msg = `*${shopSettings.shopName || 'ANIK TELECOM'}*\nতারিখ: ${sale.date}\nপণ্য: ${sale.name}\nপরিমাণ: ${q} টি\nমূল্য: ৳${total}\nবিক্রেতা: ${sale.seller || activeSeller}\n\nআমাদের সেবা গ্রহণ করার জন্য আন্তরিক ধন্যবাদ!`;
    sendWhatsAppMessage(phone, msg);
  };

  // Save Cash Purchase / Reinvestment (বিক্রির টাকায় পুনরায় মাল কেনা বা বাহির থেকে এনে তাৎক্ষণিক বিক্রি)
  const handleSaveCashPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(1, parseInt(reinvestQty) || 1);
    const unitCost = parseFloat(reinvestBuyPrice) || 0;
    const sellRate = parseFloat(reinvestSellPrice) || 0;

    const matchedInv = reinvestSelectedItemId
      ? inventory.find(i => i.id === reinvestSelectedItemId)
      : undefined;
    const finalItemName = reinvestItemName.trim() || matchedInv?.name || '';

    if (!finalItemName) {
      showToast('অনুগ্রহ করে মালের নাম বা মডেল লিখুন!', 'error');
      return;
    }
    if (unitCost <= 0) {
      showToast('অনুগ্রহ করে কেনা দাম (কত টাকা দিয়ে কিনেছেন) লিখুন!', 'error');
      return;
    }
    if (reinvestMode === 'instant_sell' && sellRate <= 0) {
      showToast('কাস্টমারের কাছে কত টাকায় বিক্রি/ফিটিং করেছেন তা লিখুন!', 'error');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-GB');
    const cpId = 'cp_' + Date.now();
    const totalCost = qty * unitCost;

    if (reinvestMode === 'instant_sell') {
      const saleId = 'sale_' + Date.now();
      const newSale: SaleRecord = {
        id: saleId,
        itemId: matchedInv?.id || 'outside_part',
        name: `${finalItemName} (বাহির থেকে কেনা)`,
        qty,
        buy: unitCost,
        sell: sellRate,
        seller: activeSeller,
        date: todayStr,
        customerName: reinvestCustomer.trim() || undefined,
        isBaki: false,
        isOutsidePurchase: true,
        cashPurchaseId: cpId
      };

      const newCp: CashPurchaseRecord = {
        id: cpId,
        itemName: finalItemName,
        itemId: matchedInv?.id,
        qty,
        unitCost,
        totalCost,
        sellingPrice: sellRate,
        supplierName: reinvestSupplier.trim() || 'অন্য দোকান / মার্কেট',
        customerName: reinvestCustomer.trim() || undefined,
        type: 'instant_sell',
        isSold: true,
        saleId,
        seller: activeSeller,
        date: todayStr
      };

      setSalesHistory(prev => {
        const next = [newSale, ...prev];
        saveLocal('anik_pos_sales_v1', next);
        return next;
      });
      set(ref(rtdb, 'salesHistory/' + saleId), sanitizeForFirebase(newSale)).catch(() => {});

      setCashPurchases(prev => {
        const next = [newCp, ...prev];
        saveLocal('anik_pos_cash_purchases_v1', next);
        return next;
      });
      set(ref(rtdb, 'cashPurchases/' + cpId), sanitizeForFirebase(newCp)).catch(() => {});

      const profit = qty * (sellRate - unitCost);
      showToast(
        `✅ '${finalItemName}' ৳${totalCost} দিয়ে কিনে ৳${qty * sellRate}-এ বিক্রি সম্পন্ন! লাভ: ৳${profit}`,
        'success'
      );

      setReinvestItemName('');
      setReinvestSelectedItemId('');
      setReinvestQty('1');
      setReinvestBuyPrice('');
      setReinvestSellPrice('');
      setReinvestSupplier('');
      setReinvestCustomer('');
    } else {
      const newCp: CashPurchaseRecord = {
        id: cpId,
        itemName: finalItemName,
        itemId: matchedInv?.id,
        qty,
        unitCost,
        totalCost,
        sellingPrice: sellRate > 0 ? sellRate : matchedInv?.sellingPrice || 0,
        supplierName: reinvestSupplier.trim() || 'মার্কেট / অন্য দোকান',
        type: 'restock',
        isSold: false,
        seller: activeSeller,
        date: todayStr
      };

      setCashPurchases(prev => {
        const next = [newCp, ...prev];
        saveLocal('anik_pos_cash_purchases_v1', next);
        return next;
      });
      set(ref(rtdb, 'cashPurchases/' + cpId), sanitizeForFirebase(newCp)).catch(() => {});

      if (matchedInv) {
        const updatedStock = (matchedInv.stock || 0) + qty;
        const updatedItem: InventoryItem = {
          ...matchedInv,
          stock: updatedStock,
          price: unitCost,
          sellingPrice: sellRate > 0 ? sellRate : matchedInv.sellingPrice,
          updatedAt: todayStr
        };
        setInventory(prev => {
          const next = prev.map(i => i.id === matchedInv.id ? updatedItem : i);
          saveLocal('anik_pos_inventory_v1', next);
          return next;
        });
        const safeKey = String(matchedInv._fbKey || matchedInv.id).replace(/[.#$[\]/]/g, '_');
        set(ref(rtdb, 'inventory/' + safeKey), sanitizeForFirebase(updatedItem)).catch(() => {});
        showToast(
          `✅ বিক্রির ক্যাশ থেকে ৳${totalCost} দিয়ে '${finalItemName}' (${qty} পিস) কেনা হয়েছে ও স্টকে যোগ হয়েছে!`,
          'success'
        );
      } else {
        const newInvId = 'item_' + Date.now();
        const newInvItem: InventoryItem = {
          id: newInvId,
          _fbKey: newInvId,
          name: finalItemName,
          brand: 'General',
          category: 'Display',
          models: [finalItemName],
          stock: qty,
          price: unitCost,
          sellingPrice: sellRate > 0 ? sellRate : unitCost + 300,
          sku: 'ANIK-' + Math.floor(1000 + Math.random() * 9000),
          updatedAt: todayStr
        };
        setInventory(prev => {
          const next = [newInvItem, ...prev];
          saveLocal('anik_pos_inventory_v1', next);
          return next;
        });
        set(ref(rtdb, 'inventory/' + newInvId), sanitizeForFirebase(newInvItem)).catch(() => {});
        showToast(
          `✅ বিক্রির ক্যাশ থেকে ৳${totalCost} দিয়ে '${finalItemName}' কিনে নতুন স্টকে জমা করা হয়েছে!`,
          'success'
        );
      }

      setReinvestItemName('');
      setReinvestSelectedItemId('');
      setReinvestQty('1');
      setReinvestBuyPrice('');
      setReinvestSellPrice('');
      setReinvestSupplier('');
      setReinvestCustomer('');
    }
  };

  const handleConfirmSellFromPurchase = (cp: CashPurchaseRecord) => {
    const sellPriceNum = parseFloat(sellingPurchaseRate);
    if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
      showToast('সঠিক বিক্রয় মূল্য লিখুন!', 'error');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-GB');
    const saleId = 'sale_' + Date.now();
    const newSale: SaleRecord = {
      id: saleId,
      itemId: cp.itemId || 'outside_part',
      name: `${cp.itemName} (পুনরায় কেনা স্টক)`,
      qty: cp.qty,
      buy: cp.unitCost,
      sell: sellPriceNum,
      seller: activeSeller,
      date: todayStr,
      isBaki: false,
      isOutsidePurchase: true,
      cashPurchaseId: cp.id
    };

    setSalesHistory(prev => {
      const next = [newSale, ...prev];
      saveLocal('anik_pos_sales_v1', next);
      return next;
    });
    set(ref(rtdb, 'salesHistory/' + saleId), sanitizeForFirebase(newSale)).catch(() => {});

    knownSaleIds.current.add(saleId);
    triggerSaleNotification({
      id: saleId,
      name: `${cp.itemName} (পুনরায় কেনা স্টক)`,
      qty: cp.qty,
      total: cp.qty * sellPriceNum,
      seller: activeSeller,
      isBaki: false
    });

    const updatedCp: CashPurchaseRecord = {
      ...cp,
      isSold: true,
      sellingPrice: sellPriceNum,
      saleId
    };
    setCashPurchases(prev => {
      const next = prev.map(item => item.id === cp.id ? updatedCp : item);
      saveLocal('anik_pos_cash_purchases_v1', next);
      return next;
    });
    const cpKey = String(cp._fbKey || cp.id).replace(/[.#$[\]/]/g, '_');
    set(ref(rtdb, 'cashPurchases/' + cpKey), sanitizeForFirebase(updatedCp)).catch(() => {});

    if (cp.itemId) {
      const invItem = inventory.find(i => i.id === cp.itemId);
      if (invItem) {
        const rem = Math.max(0, (invItem.stock || 0) - cp.qty);
        const updatedInv = { ...invItem, stock: rem };
        setInventory(prev => {
          const next = prev.map(i => i.id === invItem.id ? updatedInv : i);
          saveLocal('anik_pos_inventory_v1', next);
          return next;
        });
        const invKey = String(invItem._fbKey || invItem.id).replace(/[.#$[\]/]/g, '_');
        update(ref(rtdb, 'inventory/' + invKey), { stock: rem }).catch(() => {});
      }
    }

    setSellingPurchaseId(null);
    setSellingPurchaseRate('');
    const profit = cp.qty * (sellPriceNum - cp.unitCost);
    showToast(`✅ '${cp.itemName}' ৳${cp.qty * sellPriceNum} টাকায় বিক্রি সম্পন্ন! লাভ: ৳${profit}`, 'success');
  };

  const handleDeleteCashPurchase = (cp: CashPurchaseRecord) => {
    if (userRole !== 'main_admin') {
      showToast('শুধুমাত্র Main Admin এই হিসাব ডিলিট করতে পারবেন!', 'error');
      return;
    }
    const cpKey = String(cp._fbKey || cp.id).replace(/[.#$[\]/]/g, '_');
    setCashPurchases(prev => {
      const next = prev.filter(item => item.id !== cp.id);
      saveLocal('anik_pos_cash_purchases_v1', next);
      return next;
    });
    remove(ref(rtdb, 'cashPurchases/' + cpKey)).catch(() => {});
    showToast('পুনরায় মাল ক্রয়ের হিসাব মুছে ফেলা হয়েছে', 'info');
  };

  // Handlers for Repair Jobs & Expenses
  const handleOpenAddRepairJob = () => {
    setEditingRepairJob(null);
    setIsRepairModalOpen(true);
  };

  const handleOpenEditRepairJob = (job: RepairJob) => {
    setEditingRepairJob(job);
    setIsRepairModalOpen(true);
  };

  const handleSaveRepairJob = (jobData: Omit<RepairJob, 'id'>, existingId?: string) => {
    const targetId = existingId || editingRepairJob?.id;
    if (targetId) {
      const safeKey = String(editingRepairJob?._fbKey || targetId).replace(/[.#$[\]/]/g, '_');
      const updatedJob: RepairJob = {
        ...jobData,
        id: targetId,
        _fbKey: safeKey
      };
      setRepairJobs(prev => {
        const next = prev.map(j => (j.id === targetId || j._fbKey === safeKey) ? updatedJob : j);
        saveLocal('anik_pos_repairs_v1', next);
        return next;
      });
      set(ref(rtdb, 'repairJobs/' + safeKey), sanitizeForFirebase(updatedJob)).catch(() => {});
      setEditingRepairJob(null);
      showToast(`জব কার্ড #${updatedJob.tokenNo} (${updatedJob.deviceModel}) এডিট ও আপডেট সম্পন্ন হয়েছে! ✅`, 'success');
      return;
    }

    const jobId = 'repair_' + Date.now();
    const newJob: RepairJob = {
      ...jobData,
      id: jobId,
      _fbKey: jobId
    };
    setRepairJobs(prev => {
      const next = [newJob, ...prev];
      saveLocal('anik_pos_repairs_v1', next);
      return next;
    });
    set(ref(rtdb, 'repairJobs/' + jobId), sanitizeForFirebase(newJob)).catch(() => {});
    showToast(`জব কার্ড #${newJob.tokenNo} (${newJob.deviceModel}) তৈরি হয়েছে! ✅`, 'success');

    // Generate Token Receipt
    setReceiptData({
      title: `সার্ভিসিং জব কার্ড ও টোকেন (${newJob.tokenNo})`,
      type: 'repair_token',
      date: newJob.date,
      customerName: newJob.customerName,
      customerPhone: newJob.customerPhone,
      items: [
        {
          name: `${newJob.deviceModel}: ${newJob.problem}`,
          amount: newJob.estimatedCost
        }
      ],
      subtotal: newJob.estimatedCost,
      paid: newJob.advancePaid,
      due: Math.max(0, newJob.estimatedCost - newJob.advancePaid),
      seller: activeSeller,
      note: `সম্ভাব্য ডেলিভারি: ${newJob.deliveryDate || 'শীঘ্রই'}`
    });
  };

  const handleDeleteRepairJob = (job: RepairJob) => {
    if (confirm(`'${job.deviceModel}' (${job.tokenNo}) জব কার্ডটি কি মুছে ফেলতে চান?`)) {
      const safeKey = String(job._fbKey || job.id).replace(/[.#$[\]/]/g, '_');
      setRepairJobs(prev => {
        const next = prev.filter(j => j.id !== job.id && j._fbKey !== safeKey);
        saveLocal('anik_pos_repairs_v1', next);
        return next;
      });
      remove(ref(rtdb, 'repairJobs/' + safeKey)).catch(() => {});
      showToast(`জব কার্ড (${job.tokenNo}) মুছে ফেলা হয়েছে`, 'info');
    }
  };

  const handleUpdateRepairStatus = (job: RepairJob, newStatus: 'pending' | 'ready' | 'delivered') => {
    const safeKey = String(job._fbKey || job.id).replace(/[.#$[\]/]/g, '_');
    setRepairJobs(prev => {
      const next = prev.map(j => (j.id === job.id || j._fbKey === safeKey) ? { ...j, status: newStatus } : j);
      saveLocal('anik_pos_repairs_v1', next);
      return next;
    });
    update(ref(rtdb, 'repairJobs/' + safeKey), { status: newStatus }).catch(() => {});
    showToast(`স্ট্যাটাস পরিবর্তন: ${newStatus === 'ready' ? 'কাজ শেষ (রেডি)' : newStatus === 'delivered' ? 'ডেলিভারি সম্পন্ন' : 'কাজ চলছে'}`, 'info');
    if (newStatus === 'ready' && job.customerPhone) {
      const remainingDue = Math.max(0, job.estimatedCost - job.advancePaid);
      let msg = `আসসালামু আলাইকুম ${job.customerName} ভাই,\n`;
      msg += `অনিক টেলিকম থেকে জানানো হচ্ছে আপনার ${job.deviceModel} মোবাইলটির রিপেয়ারিং কাজ সম্পন্ন হয়েছে।\n`;
      if (remainingDue > 0) {
        msg += `আপনার অবশিষ্ট বিল: ৳${remainingDue} টাকা।\n`;
      }
      msg += `অনুগ্রহ করে দোকানে এসে আপনার ফোনটি সংগ্রহ করার অনুরোধ রইল।\nধন্যবাদ - অনিক টেলিকম।`;
      sendWhatsAppMessage(job.customerPhone, msg);
    }
  };

  const handleOpenEditExpense = (exp: ShopExpense) => {
    setEditingExpense(exp);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (expData: Omit<ShopExpense, 'id'>, existingId?: string) => {
    const targetId = existingId || editingExpense?.id;
    if (targetId) {
      const safeKey = String(editingExpense?._fbKey || targetId).replace(/[.#$[\]/]/g, '_');
      const updatedExp: ShopExpense = {
        ...expData,
        id: targetId,
        _fbKey: safeKey
      };
      setShopExpenses(prev => {
        const next = prev.map(e => (e.id === targetId || e._fbKey === safeKey) ? updatedExp : e);
        saveLocal('anik_pos_expenses_v1', next);
        return next;
      });
      set(ref(rtdb, 'shopExpenses/' + safeKey), sanitizeForFirebase(updatedExp))
        .then(() => {
          showToast(`৳${updatedExp.amount} টাকার দোকান খরচ (${updatedExp.category}) আপডেট হয়েছে! ✅`, 'success');
        })
        .catch(() => {
          showToast(`৳${updatedExp.amount} টাকার দোকান খরচ আপডেট হয়েছে! ✅`, 'success');
        });
      setEditingExpense(null);
      return;
    }

    const expId = 'exp_' + Date.now();
    const newExp: ShopExpense = {
      ...expData,
      id: expId,
      _fbKey: expId
    };
    setShopExpenses(prev => {
      const next = [newExp, ...prev];
      saveLocal('anik_pos_expenses_v1', next);
      return next;
    });
    set(ref(rtdb, 'shopExpenses/' + expId), sanitizeForFirebase(newExp))
      .then(() => {
        showToast(`৳${newExp.amount} টাকার দোকান খরচ (${newExp.category}) সফলভাবে সেভ হয়েছে! ✅`, 'success');
      })
      .catch(err => {
        console.warn('Firebase expense save error, saved locally:', err);
        showToast(`৳${newExp.amount} টাকার দোকান খরচ লোকাল মেমরিতে সেভ হয়েছে! ✅`, 'success');
      });
  };

  const handleDeleteExpense = (expId: string, expName: string) => {
    if (confirm(`'${expName}' খরচের রেকর্ডটি মুছে ফেলতে চান?`)) {
      setShopExpenses(prev => {
        const next = prev.filter(e => e.id !== expId && e._fbKey !== expId);
        saveLocal('anik_pos_expenses_v1', next);
        return next;
      });
      const safeKey = String(expId).replace(/[.#$[\]/]/g, '_');
      remove(ref(rtdb, 'shopExpenses/' + safeKey)).catch(() => {});
      showToast('খরচের রেকর্ড মুছে ফেলা হয়েছে', 'info');
    }
  };

  // Handlers for Pre-Orders & Product Requisitions
  const handleOpenAddPreOrder = () => {
    setEditingPreOrder(null);
    setIsPreOrderModalOpen(true);
  };

  const handleOpenEditPreOrder = (order: ProductPreOrder) => {
    setEditingPreOrder(order);
    setIsPreOrderModalOpen(true);
  };

  const handleSavePreOrder = (orderData: Omit<ProductPreOrder, 'id'>, existingId?: string) => {
    const targetId = existingId || editingPreOrder?.id;
    if (targetId) {
      const safeKey = String(editingPreOrder?._fbKey || targetId).replace(/[.#$[\]/]/g, '_');
      const updatedOrder: ProductPreOrder = {
        ...orderData,
        id: targetId,
        _fbKey: safeKey
      };
      setProductPreOrders(prev => {
        const next = prev.map(o => (o.id === targetId || o._fbKey === safeKey) ? updatedOrder : o);
        saveLocal('anik_pos_preorders_v1', next);
        return next;
      });
      set(ref(rtdb, 'productPreOrders/' + safeKey), sanitizeForFirebase(updatedOrder)).catch(() => {});
      setEditingPreOrder(null);
      showToast(`'${updatedOrder.itemName}' অর্ডার/চাহিদা আপডেট সম্পন্ন হয়েছে! ✅`, 'success');
      return;
    }

    const orderId = 'preorder_' + Date.now();
    const newOrder: ProductPreOrder = {
      ...orderData,
      id: orderId,
      _fbKey: orderId
    };
    setProductPreOrders(prev => {
      const next = [newOrder, ...prev];
      saveLocal('anik_pos_preorders_v1', next);
      return next;
    });
    set(ref(rtdb, 'productPreOrders/' + orderId), sanitizeForFirebase(newOrder)).catch(() => {});
    showToast(`'${newOrder.itemName}' সফলভাবে তালিকায় যুক্ত করা হয়েছে! ✅`, 'success');

    // If customer order with advance paid, generate advance receipt modal
    if (newOrder.type === 'customer_order' && newOrder.advancePaid > 0) {
      setReceiptData({
        title: 'কাস্টমার প্রি-অর্ডার ও বায়না রসিদ',
        type: 'preorder_token',
        date: newOrder.orderDate,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        items: [
          {
            name: `${newOrder.itemName} ${newOrder.modelOrCode ? `(${newOrder.modelOrCode})` : ''} - [${newOrder.purpose}]`,
            qty: newOrder.qty || 1,
            rate: newOrder.estimatedPrice,
            amount: newOrder.estimatedPrice
          }
        ],
        subtotal: newOrder.estimatedPrice,
        paid: newOrder.advancePaid,
        due: newOrder.dueAmount,
        seller: activeSeller,
        note: `সম্ভাব্য ডেলিভারি: ${newOrder.expectedDate || 'শীঘ্রই'} | কাজের বিবরণ: ${newOrder.purpose}`
      });
    }
  };

  const handleDeletePreOrder = (id: string) => {
    const target = productPreOrders.find(o => o.id === id);
    const safeKey = String(target?._fbKey || id).replace(/[.#$[\]/]/g, '_');
    setProductPreOrders(prev => {
      const next = prev.filter(o => o.id !== id && o._fbKey !== safeKey);
      saveLocal('anik_pos_preorders_v1', next);
      return next;
    });
    remove(ref(rtdb, 'productPreOrders/' + safeKey)).catch(() => {});
    showToast('তালিকা থেকে মুছে ফেলা হয়েছে', 'info');
  };

  const handleUpdatePreOrderStatus = (id: string, status: 'pending' | 'arrived' | 'delivered' | 'cancelled') => {
    const target = productPreOrders.find(o => o.id === id);
    if (!target) return;
    const safeKey = String(target._fbKey || id).replace(/[.#$[\]/]/g, '_');
    const updated: ProductPreOrder = {
      ...target,
      status,
      deliveredDate: status === 'delivered' ? new Date().toLocaleDateString('en-GB') : target.deliveredDate
    };
    setProductPreOrders(prev => {
      const next = prev.map(o => (o.id === id || o._fbKey === safeKey) ? updated : o);
      saveLocal('anik_pos_preorders_v1', next);
      return next;
    });
    set(ref(rtdb, 'productPreOrders/' + safeKey), sanitizeForFirebase(updated)).catch(() => {});
    showToast(`স্ট্যাটাস পরিবর্তন: ${status === 'arrived' ? 'মাল দোকানে এসেছে 🟢' : status === 'delivered' ? 'ডেলিভারি সম্পন্ন 🔵' : 'পেন্ডিং 🟡'}`, 'success');
  };

  const handleAddExtraAdvance = (orderId: string, additionalAmount: number, method: string) => {
    const target = productPreOrders.find(o => o.id === orderId);
    if (!target) return;
    const safeKey = String(target._fbKey || orderId).replace(/[.#$[\]/]/g, '_');
    const newAdvance = (target.advancePaid || 0) + additionalAmount;
    const newDue = Math.max(0, (target.estimatedPrice || 0) - newAdvance);
    const newHistory = [
      ...(target.advanceHistory || []),
      {
        date: new Date().toLocaleDateString('en-GB'),
        amount: additionalAmount,
        method: method || 'নগদ ক্যাশ',
        note: 'অতিরিক্ত বায়না জমা'
      }
    ];
    const updated: ProductPreOrder = {
      ...target,
      advancePaid: newAdvance,
      dueAmount: newDue,
      advancePaymentMethod: method || target.advancePaymentMethod || 'নগদ ক্যাশ',
      advanceHistory: newHistory
    };
    setProductPreOrders(prev => {
      const next = prev.map(o => (o.id === orderId || o._fbKey === safeKey) ? updated : o);
      saveLocal('anik_pos_preorders_v1', next);
      return next;
    });
    set(ref(rtdb, 'productPreOrders/' + safeKey), sanitizeForFirebase(updated)).catch(() => {});
    showToast(`৳${additionalAmount} অতিরিক্ত বায়না জমা হয়েছে! (বাকি: ৳${newDue}) ✅`, 'success');

    // Prompt updated advance receipt slip
    setReceiptData({
      title: 'অতিরিক্ত বায়না জমা রসিদ',
      type: 'preorder_token',
      date: new Date().toLocaleDateString('en-GB'),
      customerName: target.customerName,
      customerPhone: target.customerPhone,
      items: [
        {
          name: `${target.itemName} (অতিরিক্ত বায়না - ${method})`,
          qty: target.qty || 1,
          rate: target.estimatedPrice,
          amount: target.estimatedPrice
        }
      ],
      subtotal: target.estimatedPrice,
      paid: newAdvance,
      due: newDue,
      seller: activeSeller,
      note: `অতিরিক্ত বায়না গ্রহণ: ৳${additionalAmount} (${method}) | মোট জমা: ৳${newAdvance}`
    });
  };

  const handleSettlePreOrderBalance = (orderId: string) => {
    const target = productPreOrders.find(o => o.id === orderId);
    if (!target) return;
    const safeKey = String(target._fbKey || orderId).replace(/[.#$[\]/]/g, '_');
    const due = target.dueAmount || 0;
    const fullAmount = target.estimatedPrice || target.advancePaid;
    const newHistory = [
      ...(target.advanceHistory || []),
      {
        date: new Date().toLocaleDateString('en-GB'),
        amount: due,
        method: 'নগদ ক্যাশ',
        note: 'ডেলিভারি কালেকশন ও পূর্ণ বাকি পরিশোধ'
      }
    ];
    const updated: ProductPreOrder = {
      ...target,
      advancePaid: fullAmount,
      dueAmount: 0,
      status: 'delivered',
      deliveredDate: new Date().toLocaleDateString('en-GB'),
      advanceHistory: newHistory
    };
    setProductPreOrders(prev => {
      const next = prev.map(o => (o.id === orderId || o._fbKey === safeKey) ? updated : o);
      saveLocal('anik_pos_preorders_v1', next);
      return next;
    });
    set(ref(rtdb, 'productPreOrders/' + safeKey), sanitizeForFirebase(updated)).catch(() => {});
    showToast(`'${target.itemName}' এর বাকি ৳${due} আদায় ও ডেলিভারি সম্পন্ন! 🔵`, 'success');

    // Generate final settlement receipt
    setReceiptData({
      title: 'প্রি-অর্ডার ডেলিভারি ও বিক্রয় পরিশোধ রসিদ',
      type: 'preorder_token',
      date: new Date().toLocaleDateString('en-GB'),
      customerName: target.customerName,
      customerPhone: target.customerPhone,
      items: [
        {
          name: `${target.itemName} [ডেলিভারি সম্পন্ন]`,
          qty: target.qty || 1,
          rate: target.estimatedPrice,
          amount: target.estimatedPrice
        }
      ],
      subtotal: target.estimatedPrice,
      paid: fullAmount,
      due: 0,
      seller: activeSeller,
      note: `পূর্বে বায়না: ৳${target.advancePaid} | শেষ জমা: ৳${due} | সম্পূর্ণ পরিশোধিত`
    });
  };

  // Open Edit / Add Item Modal
  const handleOpenAddItem = (prefilledSku?: string | React.MouseEvent) => {
    setEditingItem(null);
    setIsItemInlineScannerOpen(false);
    setItemFormData({
      category: selectedCategory || 'Display',
      brand: selectedBrand || 'Vivo',
      name: '',
      models: '',
      stock: '1',
      price: '',
      sellingPrice: '',
      sku: typeof prefilledSku === 'string' ? prefilledSku : ''
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemInlineScannerOpen(false);
    setItemFormData({
      category: item.category || 'Display',
      brand: item.brand || 'Other',
      name: item.name || '',
      models: Array.isArray(item.models) ? item.models.join(', ') : '',
      stock: item.stock !== undefined && item.stock !== null ? String(item.stock) : '',
      price: item.price ? String(item.price) : '',
      sellingPrice: item.sellingPrice ? String(item.sellingPrice) : '',
      sku: item.sku || ''
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemFormData.name.trim()) {
      showToast('পার্টস বা পণ্যের নাম লিখুন!', 'error');
      return;
    }

    const targetId = editingItem?.id || ('item_' + Date.now());
    const safeFbKey = String(editingItem?._fbKey || targetId).replace(/[.#$[\]/]/g, '_');
    const modelsArr = itemFormData.models
      ? itemFormData.models.split(/[,;\n]+/).map(m => m.trim()).filter(Boolean)
      : [];

    const preservedBuyPrice =
      editingItem && userRole !== 'main_admin'
        ? editingItem.price || 0
        : parseFloat(String(itemFormData.price)) || 0;

    const newItem: InventoryItem = {
      id: targetId,
      _fbKey: safeFbKey,
      category: itemFormData.category.trim() || 'Display',
      brand: itemFormData.brand.trim() || 'General',
      name: itemFormData.name.trim(),
      models: modelsArr,
      stock: parseInt(String(itemFormData.stock)) || 0,
      price: preservedBuyPrice,
      sellingPrice: parseFloat(String(itemFormData.sellingPrice)) || 0,
      sku: itemFormData.sku ? itemFormData.sku.trim() : '',
      updatedAt: new Date().toLocaleDateString('en-GB')
    };

    // Optimistic local update & LocalStorage persistence
    setInventory(prev => {
      const idx = prev.findIndex(i => (editingItem && (i.id === editingItem.id || (editingItem._fbKey && i._fbKey === editingItem._fbKey))) || i.id === targetId || i._fbKey === safeFbKey);
      let next: InventoryItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = newItem;
      } else {
        next = [newItem, ...prev];
      }
      saveLocal('anik_pos_inventory_v1', next);
      return next;
    });

    set(ref(rtdb, 'inventory/' + safeFbKey), sanitizeForFirebase(newItem))
      .then(() => {
        showToast(editingItem ? `'${newItem.name}' সফলভাবে আপডেট হয়েছে! ✅` : `'${newItem.name}' স্টকে যুক্ত হয়েছে! ✅`, 'success');
      })
      .catch(err => {
        console.warn('Firebase error, saved in local cache:', err);
        showToast(editingItem ? `'${newItem.name}' লোকাল মেমরিতে সংরক্ষিত হয়েছে! ✅` : `'${newItem.name}' স্টকে যুক্ত হয়েছে! ✅`, 'success');
      });

    setIsItemModalOpen(false);
  };

  // Direct Save / Update Item (used by BarcodeScannerModal and quick action forms)
  const handleDirectSaveItem = async (itemToSave: InventoryItem): Promise<InventoryItem> => {
    const targetId = itemToSave.id || ('item_' + Date.now());
    const safeFbKey = String(itemToSave._fbKey || targetId).replace(/[.#$[\]/]/g, '_');
    
    const finalItem: InventoryItem = {
      ...itemToSave,
      id: targetId,
      _fbKey: safeFbKey,
      updatedAt: new Date().toLocaleDateString('en-GB')
    };

    setInventory(prev => {
      const idx = prev.findIndex(i => i.id === targetId || (itemToSave._fbKey && i._fbKey === itemToSave._fbKey) || i._fbKey === safeFbKey);
      let next: InventoryItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = finalItem;
      } else {
        next = [finalItem, ...prev];
      }
      saveLocal('anik_pos_inventory_v1', next);
      return next;
    });

    try {
      await set(ref(rtdb, 'inventory/' + safeFbKey), sanitizeForFirebase(finalItem));
      showToast(`'${finalItem.name}' সফলভাবে সেভ ও ফায়ারবেসে সংরক্ষিত হয়েছে! ✅`, 'success');
    } catch (err) {
      console.warn('Firebase error, saved locally:', err);
      showToast(`'${finalItem.name}' লোকাল মেমরিতে সংরক্ষিত হয়েছে! ✅`, 'success');
    }

    return finalItem;
  };

  // Direct Update SKU for an existing item (assign scanned barcode to item)
  const handleUpdateItemSku = async (itemId: string, newSku: string): Promise<InventoryItem | null> => {
    const existing = inventory.find(i => i.id === itemId || i._fbKey === itemId);
    if (!existing) return null;

    const targetKey = String(existing._fbKey || existing.id).replace(/[.#$[\]/]/g, '_');
    const updatedItem: InventoryItem = {
      ...existing,
      id: existing.id || targetKey,
      _fbKey: targetKey,
      sku: newSku.trim(),
      updatedAt: new Date().toLocaleDateString('en-GB')
    };

    setInventory(prev => {
      const next = prev.map(i => (i.id === itemId || i._fbKey === itemId) ? updatedItem : i);
      saveLocal('anik_pos_inventory_v1', next);
      return next;
    });

    try {
      // Save entire item with new SKU to ensure full document persistence in Firebase
      await set(ref(rtdb, 'inventory/' + targetKey), sanitizeForFirebase(updatedItem));
      showToast(`'${existing.name}' এর বারকোড (${newSku}) সফলভাবে সেভ ও ফায়ারবেসে আপডেট হয়েছে! ✅`, 'success');
    } catch (err) {
      console.warn('Firebase sku update error, saved locally:', err);
      showToast(`'${existing.name}' এর বারকোড লোকাল স্টোরেজে সেভ হয়েছে! ✅`, 'success');
    }

    return updatedItem;
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (userRole !== 'main_admin') {
      showToast('শুধুমাত্র Main Admin (Anik) মালামাল ডিলিট করতে পারবেন!', 'error');
      return;
    }
    if (confirm(`'${itemName}' আইটেমটি স্টক থেকে চিরতরে মুছে ফেলতে চান?`)) {
      setInventory(prev => {
        const next = prev.filter(i => i.id !== itemId);
        saveLocal('anik_pos_inventory_v1', next);
        return next;
      });
      const safeKey = String(itemId).replace(/[.#$[\]/]/g, '_');
      remove(ref(rtdb, 'inventory/' + safeKey)).catch(() => {});
      showToast(`'${itemName}' মুছে ফেলা হয়েছে`, 'info');
    }
  };

  // Quick Stock Adjustment (+1, +5)
  const handleQuickStockAdjust = (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);
    setInventory(prev => {
      const next = prev.map(i => i.id === item.id ? { ...i, stock: newStock } : i);
      saveLocal('anik_pos_inventory_v1', next);
      return next;
    });
    const safeKey = String(item._fbKey || item.id).replace(/[.#$[\]/]/g, '_');
    update(ref(rtdb, 'inventory/' + safeKey), { stock: newStock }).catch(() => {});
    showToast(`${item.name}: স্টক ${delta > 0 ? '+' + delta : delta} (${newStock} পিস)`, 'success');
  };

  // Open Sell Modal
  const handleOpenSell = (item: InventoryItem) => {
    if (item.stock <= 0) {
      showToast('এই আইটেমটির স্টক খালি (০ পিস)! বিক্রি করা যাবে না।', 'error');
      return;
    }
    setSellingItem(item);
    setSellQty('1');
    setSellPrice(item.sellingPrice ? String(item.sellingPrice) : '');
    setSellIsBaki(false);
    setSellCustomerName('');
    setSellCustomerPhone('');
    setSellPaidNow('');
    setIsSellModalOpen(true);
  };

  // Cart Handlers
  const handleAddToCart = (item: InventoryItem) => {
    if (item.stock <= 0) {
      showToast(`'${item.name}' আউট অফ স্টক (০ পিস)!`, 'error');
      return;
    }
    setCart(prev => {
      const idx = prev.findIndex(ci => ci.item.id === item.id);
      if (idx >= 0) {
        if (prev[idx].qty >= (item.stock || 1)) {
          showToast(`স্টকে সর্বোচ্চ ${item.stock} টি আছে!`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        showToast(`'${item.name}' কার্টে পরিমাণ বাড়ানো হয়েছে (${updated[idx].qty})! 🛒`, 'success');
        return updated;
      }
      showToast(`'${item.name}' কার্টে যোগ হয়েছে! 🛒`, 'success');
      return [...prev, { item, qty: 1, price: item.sellingPrice || 0 }];
    });
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(ci => {
          if (ci.item.id === itemId) {
            const maxStock = ci.item.stock || 1;
            const newQty = Math.max(1, Math.min(maxStock, ci.qty + delta));
            return { ...ci, qty: newQty };
          }
          return ci;
        })
        .filter(ci => ci.qty > 0)
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.item.id !== itemId));
    showToast('আইটেমটি কার্ট থেকে বাদ দেওয়া হয়েছে', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('কার্ট সম্পূর্ণ খালি করা হয়েছে', 'info');
  };

  const handleCartCheckout = (checkoutData: {
    cart: CartItem[];
    customerName: string;
    customerPhone: string;
    discount: number;
    paidAmount: number;
    isBaki: boolean;
    note: string;
  }) => {
    const todayStr = new Date().toLocaleDateString('en-GB');
    const { cart: cartItems, customerName: cName, customerPhone: cPhone, discount: disc, paidAmount: paidNow, isBaki: bakiChecked } = checkoutData;

    if (cartItems.length === 0) return;

    let cartSubtotal = 0;
    const receiptItems: { name: string; qty: number; rate: number; amount: number }[] = [];

    cartItems.forEach(ci => {
      const lineTotal = ci.qty * ci.price;
      cartSubtotal += lineTotal;
      receiptItems.push({
        name: `${ci.item.name} (${ci.item.brand})`,
        qty: ci.qty,
        rate: ci.price,
        amount: lineTotal
      });

      const remainingStock = Math.max(0, (ci.item.stock || 0) - ci.qty);
      setInventory(prev => {
        const next = prev.map(i => i.id === ci.item.id ? { ...i, stock: remainingStock } : i);
        saveLocal('anik_pos_inventory_v1', next);
        return next;
      });
      const safeKey = String(ci.item._fbKey || ci.item.id).replace(/[.#$[\]/]/g, '_');
      update(ref(rtdb, 'inventory/' + safeKey), { stock: remainingStock }).catch(() => {});

      const sId = 'sale_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const saleRec: SaleRecord = {
        id: sId,
        itemId: ci.item.id,
        name: ci.item.name,
        qty: ci.qty,
        buy: ci.item.price || 0,
        sell: ci.price,
        seller: activeSeller,
        date: todayStr,
        isBaki: bakiChecked
      };
      if (cName) saleRec.customerName = cName;
      if (cPhone) saleRec.customerPhone = cPhone;
      setSalesHistory(prev => {
        const next = [saleRec, ...prev];
        saveLocal('anik_pos_sales_v1', next);
        return next;
      });
      set(ref(rtdb, 'salesHistory/' + sId), sanitizeForFirebase(saleRec)).catch(() => {});
    });

    const finalBill = Math.max(0, cartSubtotal - (disc || 0));
    const finalPaid = bakiChecked ? Math.min(finalBill, paidNow) : finalBill;
    const dueLeft = Math.max(0, finalBill - finalPaid);

    if (bakiChecked && dueLeft > 0) {
      const debtorName = cName || 'কাস্টমার';
      const existing = duesData.find(d => 
        (cPhone && d.phone === cPhone) || 
        (d.name.toLowerCase() === debtorName.toLowerCase())
      );

      const itemsDesc = cartItems.map(ci => `${ci.item.name} x${ci.qty}`).join(', ');

      if (existing) {
        const newTotal = (existing.totalAmount || 0) + finalBill;
        const newPaidTotal = (existing.paidAmount || 0) + finalPaid;
        const newHist = existing.history ? [...existing.history] : [];
        newHist.push({
          date: todayStr,
          type: 'due',
          amount: finalBill,
          note: `কার্ট বিল: ${itemsDesc}`,
          seller: activeSeller
        });
        if (finalPaid > 0) {
          newHist.push({
            date: todayStr,
            type: 'payment',
            amount: finalPaid,
            note: 'কার্ট ক্রয়ের সময় নগদ জমা',
            seller: activeSeller
          });
        }
        update(ref(rtdb, 'duesData/' + existing.id), sanitizeForFirebase({
          totalAmount: newTotal,
          paidAmount: newPaidTotal,
          history: newHist,
          updatedAt: todayStr
        }));
      } else {
        const newDueId = 'due_' + Date.now();
        const newDueRec: CustomerDue = {
          id: newDueId,
          name: debtorName,
          phone: cPhone || '',
          note: `কার্ট বিল: ${itemsDesc}`,
          totalAmount: finalBill,
          paidAmount: finalPaid,
          seller: activeSeller,
          date: todayStr,
          history: [
            {
              date: todayStr,
              type: 'due',
              amount: finalBill,
              note: `কার্ট বিল: ${itemsDesc}`,
              seller: activeSeller
            },
            ...(finalPaid > 0 ? [{
              date: todayStr,
              type: 'payment' as const,
              amount: finalPaid,
              note: 'কার্ট ক্রয়ের সময় নগদ জমা',
              seller: activeSeller
            }] : [])
          ]
        };
        set(ref(rtdb, 'duesData/' + newDueId), sanitizeForFirebase(newDueRec));
      }
    }

    setReceiptData({
      title: 'ক্যাশ মেমো / বিক্রয় রসিদ (POS)',
      type: 'sale',
      date: todayStr,
      customerName: cName || undefined,
      customerPhone: cPhone || undefined,
      items: receiptItems,
      subtotal: finalBill,
      paid: finalPaid,
      due: dueLeft,
      seller: activeSeller,
      note: disc > 0 ? `ছাড়: ৳${disc}` : undefined
    });

    setCart([]);
    const cartSaleId = 'cart_sale_' + Date.now();
    knownSaleIds.current.add(cartSaleId);
    triggerSaleNotification({
      id: cartSaleId,
      name: cartItems.length === 1 ? cartItems[0].item.name : `${cartItems[0].item.name} সহ মোট ${cartItems.length} টি পার্টস`,
      qty: cartItems.reduce((acc, c) => acc + c.qty, 0),
      total: finalBill,
      seller: activeSeller,
      isBaki: bakiChecked && dueLeft > 0
    });
    showToast(`কার্টের ${cartItems.length} টি পার্টস বিক্রি সম্পন্ন হয়েছে! মোট ৳${finalBill}`, 'success');
  };

  // CSV Export Handlers
  const handleExportCSVInventory = () => {
    const headers = ['ID', 'পার্টসের নাম', 'ক্যাটেগরি', 'ব্র্যান্ড', 'স্টক (পিস)', 'কেনা দাম (৳)', 'বিক্রয় দাম (৳)', 'মোট স্টক মূল্য', 'SKU'];
    const rows = inventory.map(item => [
      item.id,
      item.name,
      item.category,
      item.brand,
      item.stock,
      item.price || 0,
      item.sellingPrice || 0,
      (item.stock || 0) * (item.price || 0),
      item.sku || ''
    ]);
    exportToCSV('Anik_Telecom_Inventory_Stock', headers, rows);
    showToast('স্টক ইনভেন্টরি Excel/CSV ফাইল ডাউনলোড হয়েছে! 📊', 'success');
  };

  const handleExportCSVSales = () => {
    const headers = ['বিক্রয় ID', 'তারিখ', 'পার্টসের নাম', 'পরিমাণ', 'কেনা মূল্য (৳)', 'বিক্রয় মূল্য (৳)', 'লাভ (৳)', 'কাস্টমার', 'মোবাইল', 'ধরন', 'অপারেটর'];
    const rows = salesHistory.map(sale => [
      sale.id,
      sale.date,
      sale.name,
      sale.qty,
      sale.buy,
      sale.sell,
      (sale.qty || 1) * ((sale.sell || 0) - (sale.buy || 0)),
      sale.customerName || 'কাস্টমার',
      sale.customerPhone || '',
      sale.isBaki ? 'বাকি' : 'নগদ',
      sale.seller || ''
    ]);
    exportToCSV('Anik_Telecom_Sales_History', headers, rows);
    showToast('বিক্রয় হিস্ট্রি Excel/CSV ফাইল ডাউনলোড হয়েছে! 📊', 'success');
  };

  const handleExportCSVDues = () => {
    const headers = ['কাস্টমার ID', 'তারিখ', 'গ্রাহকের নাম', 'মোবাইল', 'মোট বাকি (৳)', 'মোট জমা (৳)', 'অবশিষ্ট বকেয়া (৳)', 'স্ট্যাটাস', 'অপারেটর'];
    const rows = duesData.map(due => {
      const remaining = Math.max(0, due.totalAmount - (due.paidAmount || 0));
      return [
        due.id,
        due.date,
        due.name,
        due.phone || '',
        due.totalAmount,
        due.paidAmount || 0,
        remaining,
        remaining === 0 ? 'পরিশোধিত' : 'বকেয়া',
        due.seller || ''
      ];
    });
    exportToCSV('Anik_Telecom_Baki_Khata', headers, rows);
    showToast('বাকি খাতা Excel/CSV ফাইল ডাউনলোড হয়েছে! 📊', 'success');
  };

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem) return;

    const qty = parseInt(String(sellQty)) || 1;
    if (qty > sellingItem.stock) {
      showToast(`স্টকের পরিমাণের চেয়ে বেশি বিক্রি করা যাবে না! স্টকে আছে: ${sellingItem.stock} টি।`, 'error');
      return;
    }

    const unitPrice = parseFloat(String(sellPrice)) || 0;
    const totalBill = qty * unitPrice;
    const paid = sellIsBaki ? Math.min(totalBill, parseFloat(String(sellPaidNow)) || 0) : totalBill;
    const dueAmount = totalBill - paid;
    const todayStr = new Date().toLocaleDateString('en-GB');

    // 1. Log Sale
    const saleId = 'sale_' + Date.now();
    const saleRecord: SaleRecord = {
      id: saleId,
      itemId: sellingItem.id,
      name: sellingItem.name,
      qty: qty,
      buy: sellingItem.price || 0,
      sell: unitPrice,
      seller: activeSeller,
      date: todayStr,
      isBaki: sellIsBaki
    };
    if (sellCustomerName?.trim()) {
      saleRecord.customerName = sellCustomerName.trim();
    }
    if (sellCustomerPhone?.trim()) {
      saleRecord.customerPhone = sellCustomerPhone.trim();
    }
    if (sellWarranty && sellWarranty !== 'কোনো ওয়ারেন্টি নেই') {
      saleRecord.warranty = sellWarranty;
    }
    setSalesHistory(prev => {
      const next = [saleRecord, ...prev];
      saveLocal('anik_pos_sales_v1', next);
      return next;
    });
    set(ref(rtdb, 'salesHistory/' + saleId), sanitizeForFirebase(saleRecord)).catch(() => {});

    // 2. Deduct Stock
    setInventory(prev => {
      const next = prev.map(i => i.id === sellingItem.id ? { ...i, stock: Math.max(0, (i.stock || 0) - qty) } : i);
      saveLocal('anik_pos_inventory_v1', next);
      return next;
    });
    const safeKey = String(sellingItem._fbKey || sellingItem.id).replace(/[.#$[\]/]/g, '_');
    update(ref(rtdb, 'inventory/' + safeKey), {
      stock: Math.max(0, (sellingItem.stock || 0) - qty)
    }).catch(() => {});

    knownSaleIds.current.add(saleId);
    triggerSaleNotification({
      id: saleId,
      name: sellingItem.name,
      qty: qty,
      total: totalBill,
      seller: activeSeller,
      isBaki: sellIsBaki
    });

    showToast(`'${sellingItem.name}' (x${qty}) বিক্রি সম্পন্ন হয়েছে! ৳${totalBill}`, 'success');

    // 3. Handle Baki integration if checked
    if (sellIsBaki && dueAmount > 0) {
      const custName = sellCustomerName.trim() || 'কাস্টমার';
      const custPhone = sellCustomerPhone.trim();

      // Check if existing customer matches
      const existing = duesData.find(d => 
        (custPhone && d.phone === custPhone) || 
        (d.name.toLowerCase() === custName.toLowerCase())
      );

      if (existing) {
        // Append to existing customer!
        const updatedTotal = (existing.totalAmount || 0) + totalBill;
        const updatedPaid = (existing.paidAmount || 0) + paid;
        const newHistory = existing.history ? [...existing.history] : [];

        newHistory.push({
          date: todayStr,
          type: 'due',
          amount: totalBill,
          note: `${sellingItem.name} (পরিমাণ: ${qty} পিস)`,
          seller: activeSeller
        });

        if (paid > 0) {
          newHistory.push({
            date: todayStr,
            type: 'payment',
            amount: paid,
            note: 'পার্টস ক্রয়ের সময় জমা',
            seller: activeSeller
          });
        }

        update(ref(rtdb, 'duesData/' + existing.id), sanitizeForFirebase({
          totalAmount: updatedTotal,
          paidAmount: updatedPaid,
          history: newHistory,
          updatedAt: todayStr
        }));
      } else {
        // Create new customer due record
        const dueId = 'due_' + Date.now();
        const newDueRecord: CustomerDue = {
          id: dueId,
          name: custName,
          phone: custPhone || '',
          note: `${sellingItem.name} (পরিমাণ: ${qty})`,
          totalAmount: totalBill,
          paidAmount: paid,
          seller: activeSeller,
          date: todayStr,
          history: [
            {
              date: todayStr,
              type: 'due',
              amount: totalBill,
              note: `${sellingItem.name} (পরিমাণ: ${qty})`,
              seller: activeSeller
            },
            ...(paid > 0 ? [{
              date: todayStr,
              type: 'payment' as const,
              amount: paid,
              note: 'পার্টস ক্রয়ের সময় জমা',
              seller: activeSeller
            }] : [])
          ]
        };
        set(ref(rtdb, 'duesData/' + dueId), sanitizeForFirebase(newDueRecord));
      }
    }

    // 4. Open Receipt Option
    setReceiptData({
      title: 'ক্যাশ মেমো / বিক্রয় রসিদ',
      type: 'sale',
      date: todayStr,
      customerName: sellCustomerName.trim() || undefined,
      customerPhone: sellCustomerPhone.trim() || undefined,
      items: [
        {
          name: `${sellingItem.name} (${sellingItem.brand})`,
          qty: qty,
          rate: unitPrice,
          amount: totalBill
        }
      ],
      subtotal: totalBill,
      paid: paid,
      due: dueAmount,
      seller: activeSeller,
      note: sellWarranty !== 'কোনো ওয়ারেন্টি নেই' ? `ওয়ারেন্টি: ${sellWarranty}` : undefined
    });

    setIsSellModalOpen(false);
  };

  // Open / Edit / Delete Service & Load Modal
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceFormData({
      type: 'Recharge/Flexiload',
      desc: '',
      cost: '',
      paid: '',
      customerName: '',
      customerPhone: '',
      isBaki: false,
      date: new Date().toLocaleDateString('en-GB')
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: ServiceRecord) => {
    setEditingService(srv);
    setServiceFormData({
      type: srv.type || 'Recharge/Flexiload',
      desc: srv.desc || '',
      cost: srv.cost !== undefined && srv.cost !== null ? String(srv.cost) : '0',
      paid: srv.paid !== undefined && srv.paid !== null ? String(srv.paid) : '0',
      customerName: srv.customerName || '',
      customerPhone: srv.customerPhone || '',
      isBaki: false,
      date: srv.date || new Date().toLocaleDateString('en-GB')
    });
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = (srv: ServiceRecord) => {
    if (confirm(`'${srv.desc || srv.type}' সার্ভিস/লোড এন্ট্রিটি মুছে ফেলতে চান?`)) {
      const safeKey = String(srv._fbKey || srv.id).replace(/[.#$[\]/]/g, '_');
      setServicesData(prev => {
        const next = prev.filter(s => s.id !== srv.id && s._fbKey !== safeKey);
        saveLocal('anik_pos_services_v1', next);
        return next;
      });
      remove(ref(rtdb, 'servicesData/' + safeKey)).catch(() => {});
      showToast('সার্ভিস ও লোড এন্ট্রি মুছে ফেলা হয়েছে', 'info');
    }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();

    const cost = parseFloat(String(serviceFormData.cost)) || 0;
    const paid = parseFloat(String(serviceFormData.paid)) || 0;
    const todayStr = (serviceFormData.date && serviceFormData.date.trim())
      ? serviceFormData.date.trim()
      : (editingService?.date || new Date().toLocaleDateString('en-GB'));

    if (editingService) {
      const targetId = editingService.id || ('srv_' + Date.now());
      const safeKey = String(editingService._fbKey || targetId).replace(/[.#$[\]/]/g, '_');
      const updatedRecord: ServiceRecord = {
        id: targetId,
        _fbKey: safeKey,
        type: serviceFormData.type,
        desc: serviceFormData.desc.trim(),
        cost: cost,
        paid: paid,
        seller: editingService.seller || activeSeller,
        date: todayStr
      };
      if (serviceFormData.customerName?.trim()) {
        updatedRecord.customerName = serviceFormData.customerName.trim();
      }
      if (serviceFormData.customerPhone?.trim()) {
        updatedRecord.customerPhone = serviceFormData.customerPhone.trim();
      }

      setServicesData(prev => {
        const next = prev.map(s => (s.id === editingService.id || (editingService._fbKey && s._fbKey === editingService._fbKey) || s._fbKey === safeKey) ? updatedRecord : s);
        saveLocal('anik_pos_services_v1', next);
        return next;
      });
      set(ref(rtdb, 'servicesData/' + safeKey), sanitizeForFirebase(updatedRecord)).catch(() => {});
      showToast(`'${updatedRecord.desc || updatedRecord.type}' সার্ভিস ও লোড এন্ট্রি সফলভাবে আপডেট হয়েছে! ✅`, 'success');

      setIsServiceModalOpen(false);
      setEditingService(null);
      setServiceFormData({
        type: 'Recharge/Flexiload',
        desc: '',
        cost: '',
        paid: '',
        customerName: '',
        customerPhone: '',
        isBaki: false,
        date: ''
      });
      return;
    }

    const srvId = 'srv_' + Date.now();
    const serviceRecord: ServiceRecord = {
      id: srvId,
      _fbKey: srvId,
      type: serviceFormData.type,
      desc: serviceFormData.desc.trim(),
      cost: cost,
      paid: paid,
      seller: activeSeller,
      date: todayStr
    };
    if (serviceFormData.customerName?.trim()) {
      serviceRecord.customerName = serviceFormData.customerName.trim();
    }
    if (serviceFormData.customerPhone?.trim()) {
      serviceRecord.customerPhone = serviceFormData.customerPhone.trim();
    }

    setServicesData(prev => {
      const next = [serviceRecord, ...prev];
      saveLocal('anik_pos_services_v1', next);
      return next;
    });
    set(ref(rtdb, 'servicesData/' + srvId), sanitizeForFirebase(serviceRecord)).catch(() => {});
    showToast(`'${serviceRecord.type}' সার্ভিস রেকর্ড সফলভাবে সেভ হয়েছে! ✅`, 'success');

    // If customer has due on service
    if (serviceFormData.isBaki && paid < cost) {
      const dueId = 'due_' + Date.now();
      const newDue: CustomerDue = {
        id: dueId,
        name: serviceFormData.customerName.trim() || 'সার্ভিস কাস্টমার',
        phone: serviceFormData.customerPhone.trim() || '',
        note: `সার্ভিস: ${serviceFormData.type} - ${serviceFormData.desc}`,
        totalAmount: cost,
        paidAmount: paid,
        seller: activeSeller,
        date: todayStr,
        history: [
          {
            date: todayStr,
            type: 'due',
            amount: cost,
            note: `সার্ভিস বিল: ${serviceFormData.type}`,
            seller: activeSeller
          },
          ...(paid > 0 ? [{
            date: todayStr,
            type: 'payment' as const,
            amount: paid,
            note: 'সার্ভিসের অগ্রিম জমা',
            seller: activeSeller
          }] : [])
        ]
      };
      set(ref(rtdb, 'duesData/' + dueId), sanitizeForFirebase(newDue)).catch(() => {});
    }

    // Generate Receipt
    setReceiptData({
      title: 'সার্ভিসিং ও লোড রসিদ',
      type: 'service',
      date: todayStr,
      customerName: serviceFormData.customerName.trim() || undefined,
      customerPhone: serviceFormData.customerPhone.trim() || undefined,
      items: [
        {
          name: `${serviceFormData.type} - ${serviceFormData.desc}`,
          amount: paid
        }
      ],
      subtotal: paid,
      paid: paid,
      due: 0,
      seller: activeSeller
    });

    setIsServiceModalOpen(false);
    setEditingService(null);
    setServiceFormData({
      type: 'Recharge/Flexiload',
      desc: '',
      cost: '',
      paid: '',
      customerName: '',
      customerPhone: '',
      isBaki: false,
      date: ''
    });
  };

  // Add More Due (SOLVES BUG 2)
  const handleSaveDueEntry = (dueData: {
    customerId?: string;
    isExisting: boolean;
    name: string;
    phone: string;
    note: string;
    amount: number;
    advancePaid: number;
  }) => {
    const todayStr = new Date().toLocaleDateString('en-GB');

    if (dueData.isExisting && dueData.customerId) {
      // Append to EXISTING customer
      const existing = duesData.find(d => d.id === dueData.customerId);
      if (!existing) return;

      const newTotal = (existing.totalAmount || 0) + dueData.amount;
      const newPaid = (existing.paidAmount || 0) + dueData.advancePaid;
      const updatedHistory = existing.history ? [...existing.history] : [];

      updatedHistory.push({
        date: todayStr,
        type: 'due',
        amount: dueData.amount,
        note: dueData.note || 'বাকি বৃদ্ধি',
        seller: activeSeller
      });

      if (dueData.advancePaid > 0) {
        updatedHistory.push({
          date: todayStr,
          type: 'payment',
          amount: dueData.advancePaid,
          note: 'বাকি নেওয়ার সাথে নগদ জমা',
          seller: activeSeller
        });
      }

      setDuesData(prev => prev.map(d => d.id === existing.id ? {
        ...d,
        totalAmount: newTotal,
        paidAmount: newPaid,
        history: updatedHistory,
        updatedAt: todayStr
      } : d));

      update(ref(rtdb, 'duesData/' + existing.id), sanitizeForFirebase({
        totalAmount: newTotal,
        paidAmount: newPaid,
        history: updatedHistory,
        updatedAt: todayStr
      }));

      showToast(`'${existing.name}'-এর হিসাবে ৳${dueData.amount} বাকি যুক্ত হয়েছে! ✅`, 'success');
    } else {
      // Brand NEW customer
      const dueId = 'due_' + Date.now();
      const historyList: DueHistoryItem[] = [
        {
          date: todayStr,
          type: 'due',
          amount: dueData.amount,
          note: dueData.note || 'নতুন বাকি',
          seller: activeSeller
        }
      ];

      if (dueData.advancePaid > 0) {
        historyList.push({
          date: todayStr,
          type: 'payment',
          amount: dueData.advancePaid,
          note: 'বাকি নেওয়ার সাথে নগদ জমা',
          seller: activeSeller
        });
      }

      const newDue: CustomerDue = {
        id: dueId,
        name: dueData.name,
        phone: dueData.phone || '',
        note: dueData.note || 'নতুন বাকি',
        totalAmount: dueData.amount,
        paidAmount: dueData.advancePaid || 0,
        seller: activeSeller,
        date: todayStr,
        history: historyList
      };

      setDuesData(prev => [newDue, ...prev]);
      set(ref(rtdb, 'duesData/' + dueId), sanitizeForFirebase(newDue));
      showToast(`'${dueData.name}'-এর নতুন বাকির খাতা তৈরি হয়েছে! ✅`, 'success');
    }

    setDuePreselectedCustomer(null);
  };

  // Collect Payment
  const handleCollectPayment = (customerId: string, amount: number, note: string) => {
    const target = duesData.find(d => d.id === customerId);
    if (!target) return;

    const todayStr = new Date().toLocaleDateString('en-GB');
    const newPaidAmount = (target.paidAmount || 0) + amount;
    const historyItem: DueHistoryItem = {
      date: todayStr,
      type: 'payment',
      amount: amount,
      note: note || 'নগদ জমা পরিশোধ',
      seller: activeSeller
    };
    const updatedHistory = target.history ? [...target.history, historyItem] : [historyItem];

    setDuesData(prev => prev.map(d => d.id === target.id ? {
      ...d,
      paidAmount: newPaidAmount,
      history: updatedHistory,
      updatedAt: todayStr
    } : d));

    update(ref(rtdb, 'duesData/' + target.id), sanitizeForFirebase({
      paidAmount: newPaidAmount,
      history: updatedHistory,
      updatedAt: todayStr
    }));

    showToast(`'${target.name}'-এর কাছ থেকে ৳${amount} টাকা জমা নেওয়া হয়েছে! ✅`, 'success');

    const residualDue = Math.max(0, target.totalAmount - newPaidAmount);

    // Offer receipt
    setReceiptData({
      title: 'বাকির টাকা জমার রসিদ',
      type: 'due_payment',
      date: todayStr,
      customerName: target.name,
      customerPhone: target.phone,
      items: [
        {
          name: `বকেয়া বাকি পরিশোধ (${note || 'নগদ জমা'})`,
          amount: amount
        }
      ],
      subtotal: amount,
      paid: amount,
      due: residualDue,
      seller: activeSeller
    });
  };

  // Delete customer record (Admin)
  const handleDeleteDueCustomer = (customerId: string) => {
    if (userRole !== 'main_admin') {
      showToast('শুধুমাত্র Main Admin বাকির খাতা ডিলিট করতে পারবেন!', 'error');
      return;
    }
    remove(ref(rtdb, 'duesData/' + customerId));
    showToast('কাস্টমারের বাকির খাতা ডিলিট করা হয়েছে', 'info');
  };

  // Statement print for customer
  const handlePrintStatement = (cust: CustomerDue) => {
    const curDue = Math.max(0, cust.totalAmount - (cust.paidAmount || 0));
    setReceiptData({
      title: 'গ্রাহকের বাকির লেজার বিবরণী',
      type: 'due_payment',
      date: new Date().toLocaleDateString('en-GB'),
      customerName: cust.name,
      customerPhone: cust.phone,
      items: (cust.history || []).map(h => ({
        name: `${h.date}: ${h.note || (h.type === 'due' ? 'বাকি নেওয়া' : 'জমা প্রদান')}`,
        amount: h.amount
      })),
      subtotal: cust.totalAmount,
      paid: cust.paidAmount || 0,
      due: curDue,
      seller: activeSeller
    });
  };

  // WhatsApp Reminder
  const handleSendWhatsAppReminder = (cust: CustomerDue) => {
    if (!cust.phone) {
      showToast('গ্রাহকের মোবাইল নম্বর নেই!', 'error');
      return;
    }
    const curDue = Math.max(0, cust.totalAmount - (cust.paidAmount || 0));
    
    let msg = `আসসালামু আলাইকুম ${cust.name} ভাই,\n`;
    msg += `অনিক টেলিকমে আপনার আগের ও বর্তমান বাকি মিলিয়ে মোট বকেয়া রয়েছে ৳${curDue} টাকা।\n`;
    msg += `দয়া করে দোকান বন্ধের আগে বা সুবিধাজনক সময়ে বকেয়া টাকা পরিশোধ করবেন।\n`;
    msg += `ধন্যবাদ - অনিক টেলিকম।`;

    sendWhatsAppMessage(cust.phone, msg);
  };

  // Add New Seller
  const handleAddSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'main_admin') return;
    const name = newSellerName.trim();
    if (name && !sellers.includes(name)) {
      const updated = [...sellers, name];
      set(ref(rtdb, 'sellers'), updated);
      setActiveSeller(name);
      localStorage.setItem('gsm_active_seller_v16', name);
    }
    setNewSellerName('');
    setIsSellerModalOpen(false);
  };

  // Export Data
  const handleExportCSV = () => {
    if (userRole !== 'main_admin') {
      setIsLoginModalOpen(true);
      return;
    }
    let csv = "Date,Type,Description,Seller,Qty,Cost,Price,Profit\n";
    dashboardMetrics.filteredSales.forEach(s => {
      const q = s.qty || 1;
      const profit = q * ((s.sell || 0) - (s.buy || 0));
      csv += `"${s.date}","Sale","${(s.name || '').replace(/"/g, '""')}","${s.seller || ''}",${q},${s.buy || 0},${s.sell || 0},${profit}\n`;
    });
    dashboardMetrics.filteredServices.forEach(s => {
      const profit = (s.paid || 0) - (s.cost || 0);
      csv += `"${s.date}","Service","${(s.desc || '').replace(/"/g, '""')}","${s.seller || ''}",1,${s.cost || 0},${s.paid || 0},${profit}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Anik_Telecom_Report_${timeFilter}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (userRole !== 'main_admin') {
      setIsLoginModalOpen(true);
      return;
    }
    const dataObj = {
      inventory,
      salesHistory,
      servicesData,
      duesData,
      sellers,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Anik_Telecom_Full_Backup_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole !== 'main_admin') {
      setIsLoginModalOpen(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.inventory) {
          parsed.inventory.forEach((item: InventoryItem) => {
            set(ref(rtdb, 'inventory/' + item.id), item);
          });
        }
        if (parsed.salesHistory) {
          parsed.salesHistory.forEach((sale: SaleRecord) => {
            set(ref(rtdb, 'salesHistory/' + sale.id), sale);
          });
        }
        if (parsed.servicesData) {
          parsed.servicesData.forEach((srv: ServiceRecord) => {
            set(ref(rtdb, 'servicesData/' + srv.id), srv);
          });
        }
        if (parsed.duesData) {
          parsed.duesData.forEach((due: CustomerDue) => {
            set(ref(rtdb, 'duesData/' + due.id), due);
          });
        }
        if (parsed.sellers) {
          set(ref(rtdb, 'sellers'), parsed.sellers);
        }
        showToast('ডেটাবেজ সফলভাবে ইমপোর্ট সম্পন্ন হয়েছে! ✅', 'success');
      } catch {
        showToast('ভুল ফাইল! সঠিক JSON ফাইল আপলোড করুন। ❌', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* 1. Modern Header & Quick Tools Command Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-xl px-4 py-2.5">
        <div className="max-w-6xl mx-auto space-y-2.5">
          {/* Row 1: Brand Identity + Primary Action Dock + Operator/Auth */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 flex-shrink-0">
                <Boxes className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-100 truncate">
                    {shopSettings.shopName || 'Anik Telecom'}
                  </h1>
                  <span
                    className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                    title={isFirebaseConnected ? 'অনলাইন সিঙ্ক সচল' : 'সিঙ্কিং...'}
                  />
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {shopSettings.tagline || 'মোবাইল সার্ভিসিং ও পার্টস শপ'} · <span className="text-cyan-400 font-semibold">{activeSeller}</span>
                </p>
              </div>
            </div>

            {/* Mobile Quick Action Dock */}
            <div className="sm:hidden flex items-center gap-1.5">
              <div className="flex items-center bg-slate-900/90 border border-slate-800/90 p-1 rounded-2xl gap-1">
                <button
                  onClick={() => setIsBarcodeModalOpen(true)}
                  className="p-2 rounded-xl text-cyan-400 hover:bg-slate-800 active:scale-95 transition-all"
                  title="ক্যামেরা দিয়ে বারকোড স্ক্যান করুন"
                >
                  <ScanBarcode className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsCartModalOpen(true)}
                  className={`relative p-2 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                    cart.length > 0
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title="মাল্টি-আইটেম কার্ট"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cart.length > 0 && (
                    <span className="ml-1 text-[10px] font-mono font-black">
                      {cart.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsCashMemoStudioOpen(true)}
                  className="p-2 rounded-xl text-amber-400 hover:bg-slate-800 active:scale-95 transition-all"
                  title="প্রো ক্যাশ মেমো ও ইনভয়েস স্টুডিও"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleSoundPreference}
                  className={`p-2 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                    isSoundEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={isSoundEnabled ? 'বিক্রি সাউন্ড সচল (মিউট করুন)' : 'সাউন্ড মিউট (চালু করুন)'}
                >
                  {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 active:scale-95 transition-all"
                  title="দোকান সেটিংস ও সিস্টেম কনফিগারেশন"
                >
                  <Settings className="w-4 h-4 text-cyan-400" />
                </button>

                {isMainAdmin && (
                  <button
                    onClick={togglePrivacyMode}
                    className={`p-2 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                      isPrivacyMode ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
                    }`}
                    title={isPrivacyMode ? 'কেনা দাম গোপন' : 'কেনা দাম উন্মুক্ত'}
                  >
                    {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                title="স্মার্ট টুলস মেনু"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>টুলস</span>
              </button>
            </div>

            {/* Desktop Primary Controls & Operator Bar */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Primary POS Action Dock */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800/90 p-1 rounded-2xl gap-1">
                <button
                  onClick={() => setIsBarcodeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-300 hover:bg-slate-800/80 transition-all"
                  title="বারকোড ও এসকেইউ স্ক্যানার"
                >
                  <ScanBarcode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>স্ক্যানার</span>
                </button>

                <button
                  onClick={() => setIsCartModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    cart.length > 0
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-200 hover:text-cyan-300 hover:bg-slate-800/80'
                  }`}
                  title="মাল্টি-আইটেম কার্ট ও সেল এন্ট্রি"
                >
                  <ShoppingCart className={`w-3.5 h-3.5 ${cart.length > 0 ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>সেল কার্ট</span>
                  {cart.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-950 text-cyan-400 text-[10px] font-mono font-black">
                      {cart.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsCashMemoStudioOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all"
                  title="প্রো ক্যাশ মেমো ও কাস্টম ইনভয়েস স্টুডিও"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>ক্যাশ মেমো</span>
                </button>

                <button
                  onClick={() => setIsCalculatorOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-300 hover:bg-slate-800/80 transition-all"
                  title="দ্রুত ক্যাশ ক্যালকুলেটর"
                >
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden lg:inline">ক্যালকুলেটর</span>
                </button>

                <button
                  onClick={toggleSoundPreference}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSoundEnabled
                      ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                  title={isSoundEnabled ? 'বিক্রি সাউন্ড অন (ক্লিক করে মিউট করুন)' : 'সাউন্ড মিউট (ক্লিক করে চালু করুন)'}
                >
                  {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="hidden lg:inline">{isSoundEnabled ? 'সাউন্ড' : 'মিউট'}</span>
                </button>

                {isMainAdmin && (
                  <button
                    onClick={togglePrivacyMode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isPrivacyMode
                        ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                        : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                    }`}
                    title={isPrivacyMode ? 'কাস্টমার মোড: কেনা দাম গোপন' : 'ওনার মোড: কেনা দাম দৃশ্যমান'}
                  >
                    {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isPrivacyMode ? 'গোপন' : 'উন্মুক্ত'}</span>
                  </button>
                )}
              </div>

              {/* Operator Selector */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800/90 rounded-2xl px-3 py-1.5 text-xs">
                <span className="text-[11px] text-slate-400 mr-1.5">অপারেটর:</span>
                {isMainAdmin ? (
                  <>
                    <select
                      value={activeSeller}
                      onChange={e => handleSellerChange(e.target.value)}
                      className="bg-transparent font-bold text-cyan-400 focus:outline-none cursor-pointer text-xs"
                    >
                      {sellers.map((s, idx) => (
                        <option key={`seller_opt_${s}_${idx}`} value={s} className="bg-slate-900 text-slate-200">
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsSellerModalOpen(true)}
                      className="ml-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold transition-colors"
                      title="নতুন অপারেটর যোগ করুন"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <span className="font-bold text-cyan-400 text-xs">
                    {isSubAdmin ? 'Parvej' : activeSeller}
                  </span>
                )}
              </div>

              {/* Push Notification Permission Button (if not yet granted) */}
              {!isBrowserNotificationEnabled && (
                <button
                  onClick={handleEnableBrowserNotifications}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="কম্পিউটার বা মোবাইলে বিক্রির পুশ নোটিফিকেশন চালু করুন"
                >
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>নোটিফিকেশন অন</span>
                </button>
              )}

              {/* Prominent Modern Tools Menu Drawer Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/15 to-blue-600/15 hover:from-cyan-500 hover:to-blue-600 text-cyan-300 hover:text-slate-950 border border-cyan-500/35 text-xs font-black transition-all shadow-sm active:scale-95"
                title="সমস্ত কুইক টুলস ও অপশন মেনু"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>টুলস মেনু</span>
              </button>

              {/* Shop Settings & System Configuration Trigger */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-800/90 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="দোকানের সেটিংস, প্রিন্ট রসিদ ও সিস্টেম কনফিগারেশন"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">সেটিংস</span>
              </button>

              {/* Auth / Role Switcher */}
              <div className="flex items-center gap-1.5">
                {userRole === 'guest' ? (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 px-3.5 py-2 rounded-2xl text-xs font-black transition-all shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>লগইন</span>
                  </button>
                ) : (
                  <>
                    {isSubAdmin && (
                      <button
                        onClick={() => {
                          setSelectedLoginUser('Anik');
                          setIsLoginModalOpen(true);
                        }}
                        className="flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 px-3 py-2 rounded-2xl text-xs font-bold transition-all"
                        title="মেইন অ্যাডমিন (Anik) এ লগইন করুন"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Anik Login</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-800/60 px-3 py-2 rounded-2xl text-xs font-bold transition-all"
                      title="লগআউট করুন"
                    >
                      <Unlock className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden lg:inline">{isMainAdmin ? 'Anik' : 'Parvej'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Modern Segmented Page Navigation + Sleek Quick Tools Bar */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
            {/* Segmented Navigation Tabs */}
            <div className="flex items-center bg-slate-900/80 border border-slate-800/80 p-1 rounded-2xl gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>হোম হাব</span>
              </button>

              {/* Dedicated Mobile Parts Tab (আলাদা অপশন: শুধু মোবাইল পার্টস) */}
              <button
                onClick={() => setActiveTab('mobile_parts')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'mobile_parts'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>মোবাইল পার্টস</span>
                <span className={`text-[10px] font-mono font-bold ${
                  activeTab === 'mobile_parts' ? 'text-slate-900 font-black' : 'text-cyan-400'
                }`}>
                  ({mobilePartsCount})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'inventory'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>{isSubAdmin ? 'স্টক ও সেল এন্ট্রি' : 'স্টক ও মালামাল'}</span>
                <span className={`text-[10px] font-mono ${activeTab === 'inventory' ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
                  ({inventory.length})
                </span>
              </button>

              {isMainAdmin && (
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'services'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>সার্ভিস ও লোড</span>
                  <span className={`text-[10px] font-mono ${activeTab === 'services' ? 'text-slate-900 font-black' : 'text-slate-500'}`}>
                    ({servicesData.length})
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('dues')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'dues'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isSubAdmin ? 'বাকি এন্ট্রি' : 'বাকি খাতা'}</span>
                {duesSummary.debtorCount > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${
                    activeTab === 'dues' ? 'text-slate-950' : 'text-amber-400'
                  }`}>
                    ({duesSummary.debtorCount})
                  </span>
                )}
              </button>

              {isMainAdmin && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>হিসাব ও রিপোর্ট</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('preorders')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'preorders'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-500/25'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/60'
                }`}
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>চাহিদা ও প্রি-অর্ডার</span>
                {productPreOrders.filter(o => o.status === 'pending').length > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${
                    activeTab === 'preorders' ? 'text-white' : 'text-purple-400'
                  }`}>
                    ({productPreOrders.filter(o => o.status === 'pending').length})
                  </span>
                )}
              </button>
            </div>

            {/* Quick Tools Ribbon (Clean Single-Row Action Bar) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isSubAdmin ? (
                <div className="flex items-center bg-slate-900/70 border border-slate-800/80 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => handleOpenAddItem()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 hover:bg-slate-800 transition-all whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ স্টক এন্ট্রি</span>
                  </button>
                  <button
                    onClick={() => {
                      setDuePreselectedCustomer(null);
                      setIsAddDueModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:bg-slate-800 transition-all whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ বাকি এন্ট্রি</span>
                  </button>
                  <button
                    onClick={handleOpenAddPreOrder}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 hover:bg-slate-800 transition-all whitespace-nowrap"
                    title="কাস্টমার বায়না দিয়ে অর্ডার করেছে বা দোকানের মাল লাগবে"
                  >
                    <PackagePlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ প্রি-অর্ডার</span>
                  </button>
                </div>
              ) : isMainAdmin ? (
                <div className="flex items-center bg-slate-900/70 border border-slate-800/80 p-1 rounded-2xl gap-1">
                  <button
                    onClick={handleOpenAddPreOrder}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="নতুন পণ্য চাহিদা বা কাস্টমার প্রি-অর্ডার এন্ট্রি"
                  >
                    <PackagePlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ প্রি-অর্ডার</span>
                  </button>

                  <button
                    onClick={() => setIsDailySummaryOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="আজকের লাভ-ক্ষতি ও সারসংক্ষেপ"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>আজকের লাভ</span>
                  </button>

                  <button
                    onClick={() => setIsCashDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-teal-300 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="আজকের ক্যাশ ড্রয়ার"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                    <span>ক্যাশ ড্রয়ার</span>
                  </button>

                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-300 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="দোকান খরচ এন্ট্রি"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                    <span>দোকান খরচ</span>
                  </button>

                  <button
                    onClick={() => setIsSupplierModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-purple-300 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="মহাজন ও সাপ্লায়ার খাতা"
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>মহাজন ({supplierDues.length})</span>
                  </button>

                  <button
                    onClick={() => setIsProfitCalcOpen(true)}
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="লাভ ও ডিসকাউন্ট ক্যালকুলেটর"
                  >
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                    <span>লাভ হিসাব</span>
                  </button>

                  <button
                    onClick={() => setIsMessageHubOpen(true)}
                    className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-emerald-300 hover:bg-slate-800/80 transition-all whitespace-nowrap"
                    title="হোয়াটসঅ্যাপ তাগাদা মেসেজ"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>তাগাদা SMS</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto p-4 flex-1 w-full space-y-5">
        
        {/* ================= TAB 0: EXECUTIVE HOME HUB ================= */}
        {activeTab === 'home' && (
          <HomeHubView
            userRole={userRole}
            isMainAdmin={isMainAdmin}
            isSubAdmin={isSubAdmin}
            isPrivacyMode={isPrivacyMode}
            activeSeller={activeSeller}
            todaySummary={todaySummary}
            duesSummary={duesSummary}
            stockSummary={stockSummary}
            mobilePartsCount={mobilePartsCount}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenAddItem={category => handleOpenAddItem(category)}
            onOpenCashMemoStudio={() => setIsCashMemoStudioOpen(true)}
            onOpenDailySummary={() => setIsDailySummaryOpen(true)}
            onOpenExpenseModal={() => { setEditingExpense(null); setIsExpenseModalOpen(true); }}
            onOpenAddDue={() => { setDuePreselectedCustomer(null); setIsAddDueModalOpen(true); }}
            onReprintReceipt={handleReprintSaleReceipt}
            onShareWhatsApp={handleShareSaleWhatsApp}
          />
        )}

        {/* ================= DEDICATED TAB: MOBILE SPARE PARTS ONLY (আলাদা অপশন: শুধু মোবাইল পার্টস) ================= */}
        {activeTab === 'mobile_parts' && (
          <MobilePartsView
            inventory={inventory}
            isMainAdmin={isMainAdmin}
            isSubAdmin={isSubAdmin}
            isPrivacyMode={isPrivacyMode}
            onOpenAddItem={cat => handleOpenAddItem(cat)}
            onOpenEditItem={handleOpenEditItem}
            onAddToCart={handleAddToCart}
            onQuickSell={handleOpenSell}
            onOpenStockAdjust={item => handleOpenEditItem(item)}
            onOpenReorder={() => setIsReorderModalOpen(true)}
          />
        )}

        {/* ================= TAB 1: PARTS STOCK (INVENTORY) ================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1. STOCK VALUE & VALUATION SUMMARY (SOLVES BUG 1: "eta stock a koto takar mal ache show kore na") */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>স্টক ভ্যালু ও ইনভেন্টরি সামারি</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full font-bold">
                        Live Asset
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      দোকানে বর্তমানে মোট কত টাকার মালামাল ও ডিসপ্লে স্টক আছে
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Master Privacy Toggle for Buy Prices / Valuation (Main Admin Only) */}
                  {isMainAdmin && (
                    <button
                      onClick={togglePrivacyMode}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
                        isPrivacyMode
                          ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                          : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                      }`}
                      title={isPrivacyMode ? 'কাস্টমার মোড: সকল কেনা দাম সুরক্ষিত ও গোপন' : 'এডমিন মোড: কেনা দাম দেখা যাচ্ছে'}
                    >
                      {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{isPrivacyMode ? '🔒 কেনা দাম গোপন' : '🔓 কেনা দাম উন্মুক্ত'}</span>
                    </button>
                  )}

                  {/* Wholesale Reorder List Button (Main Admin Only) */}
                  {isMainAdmin && stockSummary.lowStockCount > 0 && (
                    <button
                      onClick={() => setIsReorderModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-all shadow-sm"
                      title="পাইকারি মালামাল ক্রয়ের ফর্দ দেখুন"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>পাইকারি ফর্দ ({stockSummary.lowStockCount})</span>
                    </button>
                  )}

                  {isAdminLoggedIn && (
                    <button
                      onClick={() => handleOpenAddItem()}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-md active:scale-95 shadow-cyan-500/20"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ নতুন মালামাল যোগ (স্টক এন্ট্রি)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className={`grid grid-cols-2 ${isMainAdmin ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3 mt-4`}>
                {/* 1. Total Stock Units */}
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    মোট মালামাল সংখ্যা
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-100">
                      {stockSummary.totalUnits}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">পিস ({stockSummary.totalItemsCount} প্রকার)</span>
                  </div>
                </div>

                {/* 2. Total Buy Value (Asset Investment) - Main Admin Only */}
                {isMainAdmin && (
                  <div className="bg-slate-950/70 border border-cyan-900/40 p-3.5 rounded-2xl relative">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      মোট ক্রয়মূল্য (Asset Value)
                    </span>
                    <div className="mt-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                        {isPrivacyMode ? '••••••••' : `৳ ${stockSummary.totalBuyVal.toLocaleString()}`}
                      </span>
                    </div>
                    <span className="block text-[9px] text-slate-500 mt-0.5">কেনা দামের মোট ইনভেস্টমেন্ট</span>
                  </div>
                )}

                {/* 3. Expected Retail Value */}
                <div className="bg-slate-950/70 border border-emerald-900/40 p-3.5 rounded-2xl">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    সম্ভাব্য বিক্রয় মূল্য
                  </span>
                  <div className="mt-1">
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                      {stockSummary.totalRetailVal.toLocaleString()} ৳
                    </span>
                  </div>
                  <span className="block text-[9px] text-slate-500 mt-0.5">সব বিক্রি হলে মোট বিল আসবে</span>
                </div>

                {/* 4. Potential Profit - Main Admin Only */}
                {isMainAdmin && (
                  <div className="bg-slate-950/70 border border-blue-900/40 p-3.5 rounded-2xl">
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      সম্ভাব্য মোট লাভ
                    </span>
                    <div className="mt-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-blue-400">
                        {isPrivacyMode ? '••••••••' : `৳ ${stockSummary.potentialProfit.toLocaleString()}`}
                      </span>
                    </div>
                    <span className="block text-[9px] text-slate-500 mt-0.5">বিক্রয়ের পর প্রত্যাশিত লাভ</span>
                  </div>
                )}
              </div>

              {/* Low Stock Filter Warning Bar */}
              {stockSummary.lowStockCount > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>সতর্কবার্তা: {stockSummary.lowStockCount} টি আইটেমের স্টক শেষের পথে (&lt; ৩ পিস)!</span>
                  </span>
                  <button
                    onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      filterLowStockOnly
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/50'
                    }`}
                  >
                    {filterLowStockOnly ? 'সব পণ্য দেখান' : 'কম স্টকগুলো দেখুন'}
                  </button>
                </div>
              )}
            </div>

            {/* 2. SEARCH BAR & FILTERS (WITH RECENT SEARCHES DROPDOWN) */}
            <div className="space-y-3">
              <div ref={searchContainerRef} className="relative">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onClick={() => setIsSearchDropdownOpen(true)}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (searchQuery.trim()) {
                          handleAddRecentSearch(searchQuery);
                          setIsSearchDropdownOpen(false);
                        }
                      } else if (e.key === 'Escape') {
                        setIsSearchDropdownOpen(false);
                      }
                    }}
                    placeholder="মডেল বা পার্টস খুঁজুন (যেমন: Y17, Y20, A50, Universal, ইত্যাদি)..."
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl pl-12 pr-32 sm:pr-48 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-lg"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchDropdownOpen(true);
                        }}
                        className="text-xs text-slate-400 hover:text-white px-1.5 py-1 rounded-md hover:bg-slate-800 transition-colors"
                        title="সার্চ মুছুন"
                      >
                        ✕
                      </button>
                    )}
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          handleAddRecentSearch(searchQuery);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="hidden sm:flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all shadow-sm active:scale-95"
                        title="সার্চ সেভ করুন"
                      >
                        <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>খুঁজুন</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="flex items-center gap-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-2.5 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm"
                      title="📷 ক্যামেরা দিয়ে বারকোড স্ক্যান করুন"
                    >
                      <ScanBarcode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>স্ক্যান</span>
                    </button>
                  </div>
                </div>

                {/* Recent Searches & Suggestions Dropdown */}
                {isSearchDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden divide-y divide-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Header */}
                    <div className="p-3 bg-slate-950/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                          <History className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-200">
                          সাম্প্রতিক অনুসন্ধান (Recent Searches)
                        </span>
                        {recentSearches.length > 0 && (
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded-md">
                            {recentSearches.length}
                          </span>
                        )}
                      </div>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllRecentSearches}
                          className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-rose-500/10 font-semibold"
                          title="সমস্ত সাম্প্রতিক সার্চ মুছে ফেলুন"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>সব মুছুন</span>
                        </button>
                      )}
                    </div>

                    {/* Recent Searches List */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/50">
                      {(() => {
                        const qTrim = searchQuery.toLowerCase().trim();
                        const displayedRecent = qTrim
                          ? recentSearches.filter(s => s.toLowerCase().includes(qTrim))
                          : recentSearches;

                        if (displayedRecent.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-slate-400">
                              <History className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                              <span>{qTrim ? `'${searchQuery}' এর সাথে কোনো সাম্প্রতিক অনুসন্ধান মিল পাওয়া যায়নি` : 'কোনো সাম্প্রতিক অনুসন্ধান নেই'}</span>
                            </div>
                          );
                        }

                        return displayedRecent.map((term, idx) => {
                          const matchCount = inventory.filter(item => {
                            const t = term.toLowerCase().trim();
                            return (
                              isMatch(item.name, t) ||
                              (Array.isArray(item.models) && item.models.some(m => isMatch(m, t))) ||
                              isMatch(item.brand, t) ||
                              (item.sku && isMatch(item.sku, t))
                            );
                          }).length;

                          return (
                            <div
                              key={`recent_term_${term}_${idx}`}
                              onClick={() => handleSelectRecentSearch(term)}
                              className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-800/80 cursor-pointer group transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                                <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                                  {term}
                                </span>
                                {matchCount > 0 && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 px-1.5 py-0.2 rounded-md flex-shrink-0">
                                    {matchCount} টি পণ্য
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-bold">
                                  খুঁজুন <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                                <button
                                  type="button"
                                  onClick={e => handleRemoveRecentSearch(term, e)}
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors ml-1"
                                  title="ইতিহাস থেকে মুছুন"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Quick Popular Models Section */}
                    {popularInventoryModels.length > 0 && (
                      <div className="p-3 bg-slate-950/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>জনপ্রিয় মডেল ও পার্টস সাজেশন্স:</span>
                          </span>
                          <span className="text-[10px] text-slate-500">১-ক্লিক সার্চ</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {popularInventoryModels.map((m, mIdx) => (
                            <button
                              key={`pop_model_${m}_${mIdx}`}
                              type="button"
                              onClick={() => handleSelectRecentSearch(m)}
                              className="text-xs bg-slate-800/90 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-semibold px-2.5 py-1 rounded-lg border border-slate-700/60 transition-all active:scale-95 shadow-sm"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Instructions Footer */}
                    <div className="px-3.5 py-2 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd> সেভ ও সার্চ</span>
                        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> বন্ধ</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-200 transition-colors font-medium text-xs"
                      >
                        মেনু বন্ধ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Category Showcase with Mobile Parts & Accessories Scope (আলাদা অপশন: শুধু মোবাইল পার্টস) */}
              <ProfessionalCategoryBar
                selectedCategory={selectedCategory}
                onSelectCategory={cat => setSelectedCategory(cat)}
                categoryCounts={categoryCounts}
                categoryScope={categoryScope}
                onSelectCategoryScope={scope => {
                  setCategoryScope(scope);
                  setSelectedCategory('');
                }}
                partsTotalCount={mobilePartsCount}
                accessoriesTotalCount={accessoriesCount}
                allTotalCount={inventory.length}
                availableCategories={availableCategories}
              />

              {/* Quick Brand Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => { setSelectedBrand(''); setSelectedCategory(''); }}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    !selectedBrand && !selectedCategory
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  সব ব্র্যান্ড
                </button>
                {availableBrands.map((b, idx) => (
                  <button
                    key={`brand_filter_${b}_${idx}`}
                    onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
                      selectedBrand === b
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Category, Stock Status & Sorting Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                {/* Stock Status Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">ফিল্টার:</span>
                  {[
                    { id: 'all', label: 'সব মালামাল' },
                    { id: 'in_stock', label: 'স্টক আছে' },
                    { id: 'low_stock', label: 'কম স্টক (<৩)' },
                    { id: 'out_of_stock', label: 'স্টক খালি (০)' },
                  ].map(f => (
                    <button
                      key={`sf_${f.id}`}
                      onClick={() => setStockStatusFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        stockStatusFilter === f.id
                          ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Category Dropdown with Organized Optgroups */}
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                  >
                    <option value="">সব ক্যাটাগরি</option>
                    <optgroup label="🔧 মোবাইল পার্টস">
                      {availableCategories.filter(c => isMobilePartItem(c)).map((c, idx) => (
                        <option key={`cat_opt_part_${c}_${idx}`} value={c} className="bg-slate-900 text-slate-200">
                          {getCategoryDisplay(c).nameBn} ({c})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎧 এক্সেসরিজ ও অন্যান্য">
                      {availableCategories.filter(c => !isMobilePartItem(c)).map((c, idx) => (
                        <option key={`cat_opt_acc_${c}_${idx}`} value={c} className="bg-slate-900 text-slate-200">
                          {getCategoryDisplay(c).nameBn} ({c})
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Sort By Dropdown */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-transparent text-[11px] text-slate-300 focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="default" className="bg-slate-900 text-slate-200">ডিফল্ট ক্রম</option>
                      <option value="stock_high" className="bg-slate-900 text-slate-200">স্টক: বেশি থেকে কম</option>
                      <option value="stock_low" className="bg-slate-900 text-slate-200">স্টক: কম থেকে বেশি</option>
                      <option value="price_high" className="bg-slate-900 text-slate-200">দাম: বেশি থেকে কম</option>
                      <option value="price_low" className="bg-slate-900 text-slate-200">দাম: কম থেকে বেশি</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Inventory Items Grid */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                <span>
                  প্রদর্শিত মালামাল: <strong className="text-slate-200 font-mono">{filteredInventory.length}</strong> টি
                  {searchQuery && <span> (&lsquo;{searchQuery}&rsquo; এর রেজাল্ট)</span>}
                </span>
                <span className="text-[10px] text-cyan-400">
                  {searchQuery ? 'ম্যাচ হওয়া মডেল হাইলাইট করা হয়েছে' : 'মডেল দেখতে কার্ডে ক্লিক করুন'}
                </span>
              </div>

              {filteredInventory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl p-6">
                  <Boxes className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p>কোনো মালামাল বা মডেল পাওয়া যায়নি।</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-cyan-400 underline font-bold"
                    >
                      সার্চ রিসেট করুন
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredInventory.map((item, itemIdx) => {
                    const models = Array.isArray(item.models) ? item.models : [];
                    
                    // Check if search query matches any model directly
                    const matchedModel = searchQuery.trim() 
                      ? models.find(m => isMatch(m, searchQuery))
                      : null;
                    
                    // Auto expand if matched during active search, or follow user toggle
                    const isExpanded = searchQuery.trim() && matchedModel 
                      ? true 
                      : !!expandedModelsMap[item.id];

                    const isLowStock = (item.stock || 0) < 3;
                    const isOutStock = (item.stock || 0) === 0;

                    const uniqueItemKey = item._fbKey ? `item_${item._fbKey}` : `${item.id || 'item'}_${itemIdx}`;

                    return (
                      <div
                        key={uniqueItemKey}
                        className={`bg-slate-900/90 border rounded-2xl p-4 shadow-md transition-all hover:border-slate-700 relative flex flex-col justify-between ${
                          matchedModel
                            ? 'border-cyan-500/60 ring-1 ring-cyan-500/30'
                            : isOutStock
                            ? 'border-red-900/50 bg-red-950/10'
                            : 'border-slate-800'
                        }`}
                      >
                        <div>
                          {/* Item Top Info */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              {/* Matched Model Highlight Callout */}
                              {matchedModel && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-sm">
                                  <Sparkles className="w-3 h-3" />
                                  <span>মিল পাওয়া মডেল: {matchedModel}</span>
                                </div>
                              )}

                              <h3 className="text-base font-bold text-slate-100 leading-snug">
                                <HighlightText text={item.name} query={searchQuery} />
                              </h3>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  <HighlightText text={item.brand} query={searchQuery} />
                                </span>
                                <span className="text-[10px] uppercase font-bold bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                                  <HighlightText text={item.category} query={searchQuery} />
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                                  বিক্রি: ৳{item.sellingPrice}
                                </span>

                                {/* Buy Price with Privacy Protection & Secret Cipher Code (Main Admin Only) */}
                                {isMainAdmin && (() => {
                                  const cardVisible = isCardPriceVisible(uniqueItemKey);
                                  return (
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 border transition-all ${
                                      cardVisible 
                                        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60 shadow-sm' 
                                        : 'bg-slate-950 text-slate-400 border-slate-800'
                                    }`}>
                                      <span className="text-slate-500 font-semibold">ক্রয়:</span>
                                      {cardVisible ? (
                                        <strong className="text-cyan-300 font-bold tracking-tight">৳{item.price}</strong>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <span className="text-slate-500 tracking-widest font-black">••••</span>
                                          <span 
                                            className="text-[9px] text-amber-400 font-mono font-bold bg-amber-950/70 px-1 py-0.2 rounded border border-amber-800/50" 
                                            title="গোপন কোড (Secret Cost Cipher: PROFITABLE)"
                                          >
                                            [{toCostCode(item.price)}]
                                          </span>
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSingleCardBuyPrice(uniqueItemKey);
                                        }}
                                        className="text-slate-400 hover:text-cyan-300 ml-0.5 p-0.5 transition-colors cursor-pointer"
                                        title={cardVisible ? 'কেনা দাম লুকান' : 'কেনা দাম দেখুন (উঁকি দিন)'}
                                      >
                                        {cardVisible ? (
                                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                        )}
                                      </button>
                                    </span>
                                  );
                                })()}

                                {item.sku && (
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    SKU: {item.sku}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stock Badge */}
                            <div className="text-center min-w-[55px]">
                              <div
                                className={`rounded-xl px-2.5 py-1.5 border font-mono ${
                                  isOutStock
                                    ? 'bg-red-950 border-red-800 text-red-400'
                                    : isLowStock
                                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                                    : 'bg-slate-950 border-slate-800 text-cyan-400'
                                }`}
                              >
                                <span className="block text-lg font-black">{item.stock}</span>
                                <span className="block text-[8px] font-bold uppercase tracking-wider opacity-80">
                                  {isOutStock ? 'স্টক শেষ' : 'স্টক পিস'}
                                </span>
                              </div>

                              {/* Quick +1, +5 for Stock Entry (Main Admin & Sub Admin) */}
                              {isAdminLoggedIn && (
                                <div className="flex gap-1 mt-1 justify-center">
                                  <button
                                    onClick={() => handleQuickStockAdjust(item, 1)}
                                    title="+১ পিস স্টক যোগ"
                                    className="text-[9px] bg-slate-800 hover:bg-slate-700 text-cyan-400 px-1 py-0.5 rounded font-mono font-bold"
                                  >
                                    +1
                                  </button>
                                  <button
                                    onClick={() => handleQuickStockAdjust(item, 5)}
                                    title="+৫ পিস স্টক যোগ"
                                    className="text-[9px] bg-slate-800 hover:bg-slate-700 text-cyan-400 px-1 py-0.5 rounded font-mono font-bold"
                                  >
                                    +5
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Supported Models Accordion / Pills */}
                          <div className="mt-3">
                            <button
                              onClick={() => setExpandedModelsMap(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
                            >
                              <span className="flex items-center gap-1.5 font-semibold">
                                <span>সাপোর্টেড মডেলসমূহ ({models.length} টি)</span>
                                {matchedModel && (
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                )}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* Render Models with vibrant Highlights */}
                            {isExpanded && (
                              <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                                {models.map((m, mIdx) => {
                                  const thisMatches = searchQuery.trim() && isMatch(m, searchQuery);
                                  return (
                                    <button
                                      key={`model_${uniqueItemKey}_${m}_${mIdx}`}
                                      type="button"
                                      onClick={() => handleSelectRecentSearch(m)}
                                      title={`'${m}' মডেল দিয়ে সার্চ করুন`}
                                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer hover:border-cyan-400 active:scale-95 ${
                                        thisMatches
                                          ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 ring-2 ring-amber-400/40 shadow-lg scale-105'
                                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300'
                                      }`}
                                    >
                                      <HighlightText text={m} query={searchQuery} />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <div className="flex gap-1.5">
                            {isAdminLoggedIn && (
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-xl transition-colors flex items-center gap-1 text-[11px] font-bold"
                                title={isMainAdmin ? 'এডিট করুন' : 'স্টক এন্ট্রি ও আপডেট করুন'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                                {isSubAdmin && <span>স্টক যোগ</span>}
                              </button>
                            )}
                            {isMainAdmin && (
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-2 bg-slate-800/80 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                                title="মুছে ফেলুন (শুধুমাত্র Main Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={isOutStock}
                              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border active:scale-95 ${
                                isOutStock
                                  ? 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
                                  : 'bg-slate-900 border-slate-700/80 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300'
                              }`}
                              title="কার্টে যোগ করুন"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">কার্ট</span>
                            </button>

                            <button
                              onClick={() => handleOpenSell(item)}
                              disabled={isOutStock}
                              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
                                isOutStock
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>বিক্রি করুন</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SERVICES, REPAIR & EXPENSES ================= */}
        {activeTab === 'services' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Sub-navigation pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  onClick={() => setServiceSubTab('repairs')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    serviceSubTab === 'repairs'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ফোন রিপেয়ার জব কার্ড</span>
                  <span className="text-[10px] bg-slate-900/80 px-1.5 rounded-full font-mono">
                    {repairJobs.filter(j => j.status !== 'delivered').length}
                  </span>
                </button>

                <button
                  onClick={() => setServiceSubTab('digital')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    serviceSubTab === 'digital'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>ডিজিটাল রিচার্জ ও সার্ভিস</span>
                  <span className="text-[10px] bg-slate-900/80 px-1.5 rounded-full font-mono">
                    {servicesData.length}
                  </span>
                </button>

                <button
                  onClick={() => setServiceSubTab('expenses')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    serviceSubTab === 'expenses'
                      ? 'bg-red-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-red-300 border border-slate-800'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>দোকান খরচ খাতা</span>
                  <span className="text-[10px] bg-slate-900/80 px-1.5 rounded-full font-mono">
                    {shopExpenses.length}
                  </span>
                </button>
              </div>

              {/* Action Button based on sub-tab */}
              {serviceSubTab === 'repairs' && (
                <button
                  onClick={handleOpenAddRepairJob}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ফোন জমা / জব কার্ড</span>
                </button>
              )}

              {serviceSubTab === 'digital' && (
                <button
                  onClick={handleOpenAddService}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-50 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন সার্ভিস / রিচার্জ লগ</span>
                </button>
              )}

              {serviceSubTab === 'expenses' && (
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ দোকান খরচ এন্ট্রি</span>
                </button>
              )}
            </div>

            {/* SUB-TAB 1: REPAIR JOBS */}
            {serviceSubTab === 'repairs' && (
              <div className="space-y-3">
                {repairJobs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl p-6">
                    <Smartphone className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p>বর্তমানে কোনো মোবাইল রিপেয়ারিংয়ের জব কার্ড এন্ট্রি নেই।</p>
                    <button
                      onClick={handleOpenAddRepairJob}
                      className="mt-2 text-xs text-cyan-400 underline font-bold"
                    >
                      কাস্টমারের ফোন জমা নিন (+ জব কার্ড)
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {repairJobs.map((job, jIdx) => {
                      const remainingDue = Math.max(0, (job.estimatedCost || 0) - (job.advancePaid || 0));
                      const isReady = job.status === 'ready';
                      const isDelivered = job.status === 'delivered';
                      const uniqueJobKey = job._fbKey ? `job_${job._fbKey}` : `${job.id || 'job'}_${jIdx}`;

                      return (
                        <div
                          key={uniqueJobKey}
                          className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex flex-col justify-between transition-all ${
                            isDelivered
                              ? 'border-slate-800/80 bg-slate-900/60 opacity-80'
                              : isReady
                              ? 'border-emerald-500/60 bg-emerald-950/10 ring-1 ring-emerald-500/30'
                              : 'border-amber-500/40 bg-slate-900'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded">
                                    {job.tokenNo}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      isDelivered
                                        ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                                        : isReady
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50 animate-pulse'
                                        : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                                    }`}
                                  >
                                    {isDelivered ? 'ডেলিভারি সম্পন্ন ✅' : isReady ? 'ডেলিভারি প্রস্তুত 🟢' : 'কাজ চলছে 🟡'}
                                  </span>
                                </div>

                                <h4 className="text-base font-bold text-slate-100 mt-1">
                                  {job.deviceModel}
                                </h4>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  সমস্যা: <strong className="text-amber-400">{job.problem}</strong>
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">বিল: ৳{job.estimatedCost}</span>
                                <span className="text-xs font-mono font-bold text-red-400 block">
                                  {remainingDue > 0 ? `বকেয়া: ৳${remainingDue}` : 'পরিশোধিত ✅'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap justify-between items-center text-[10px] text-slate-400 font-mono">
                              <span>গ্রাহক: <strong className="text-slate-200">{job.customerName}</strong></span>
                              {job.customerPhone && (
                                <a href={`tel:${job.customerPhone}`} className="text-cyan-400 hover:underline">
                                  📞 {job.customerPhone}
                                </a>
                              )}
                              <span>জমা: {job.date}</span>
                            </div>
                          </div>

                          {/* Status Changing Bar & Edit/Delete */}
                          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex gap-1.5 text-xs">
                              {job.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateRepairStatus(job, 'ready')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                                  title="কাজ শেষ হয়েছে চিহ্নিত করুন এবং কাস্টমারকে জানান"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>কাজ শেষ (রেডি)</span>
                                </button>
                              )}

                              {job.status === 'ready' && (
                                <button
                                  onClick={() => handleUpdateRepairStatus(job, 'delivered')}
                                  className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                                >
                                  <span>ডেলিভারি দিন</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditRepairJob(job)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950/80 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 font-bold text-[11px] flex items-center gap-1 transition-all"
                                title="ভুল এন্ট্রি এডিট ও সংশোধন করুন"
                              >
                                <Edit className="w-3.5 h-3.5 text-cyan-400" />
                                <span>এডিট</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {job.customerPhone && (
                                <button
                                  onClick={() => {
                                    let msg = `আসসালামু আলাইকুম ${job.customerName} ভাই,\n`;
                                    msg += `অনিক টেলিকমে আপনার ${job.deviceModel} ফোনের কাজের বর্তমান আপডেট:\n`;
                                    msg += `স্ট্যাটাস: ${isReady ? 'কাজ সম্পন্ন হয়েছে, এসে নিয়ে যান' : 'কাজ চলছে'}।\n`;
                                    msg += `মোট খরচ: ৳${job.estimatedCost} | অগ্রিম: ৳${job.advancePaid} | বকেয়া: ৳${remainingDue}।\n`;
                                    msg += `ধন্যবাদ - অনিক টেলিকম।`;
                                    sendWhatsAppMessage(job.customerPhone, msg);
                                  }}
                                  className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded border border-emerald-900/40"
                                  title="WhatsApp বার্তা"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {job.customerPhone && (
                                <button
                                  onClick={() => handleOpenCustomerQr(job.customerName, job.customerPhone, remainingDue)}
                                  className="p-1 text-amber-400 hover:bg-amber-950/60 rounded border border-amber-900/40"
                                  title="গ্রাহকের WhatsApp ও কন্টাক্ট QR কোড"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setReceiptData({
                                    title: `সার্ভিসিং জব কার্ড (${job.tokenNo})`,
                                    type: 'repair_token',
                                    date: job.date,
                                    customerName: job.customerName,
                                    customerPhone: job.customerPhone,
                                    items: [
                                      {
                                        name: `${job.deviceModel}: ${job.problem}`,
                                        amount: job.estimatedCost
                                      }
                                    ],
                                    subtotal: job.estimatedCost,
                                    paid: job.advancePaid,
                                    due: remainingDue,
                                    seller: job.seller || activeSeller,
                                    note: `ডেলিভারির তারিখ: ${job.deliveryDate || 'শীঘ্রই'}`
                                  });
                                }}
                                className="p-1 text-cyan-400 hover:bg-cyan-950/60 rounded border border-cyan-900/40"
                                title="টোকেন রসিদ প্রিন্ট"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteRepairJob(job)}
                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded border border-slate-800 hover:border-red-900/40 transition-colors"
                                title="জব কার্ড মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: DIGITAL RECHARGE & SERVICES */}
            {serviceSubTab === 'digital' && (
              <div className="space-y-2.5">
                {servicesData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
                    কোনো সার্ভিস বা রিচার্জের রেকর্ড নেই।
                  </div>
                ) : (
                  servicesData.map((s, sIdx) => {
                    const profit = (s.paid || 0) - (s.cost || 0);
                    const uniqueSrvKey = s._fbKey ? `srv_${s._fbKey}` : `${s.id || 'srv'}_${sIdx}`;
                    return (
                      <div
                        key={uniqueSrvKey}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {s.date}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                              অপারেটর: {s.seller || 'Admin'}
                            </span>
                            <span className="text-[10px] bg-blue-950/50 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50 font-semibold uppercase tracking-wider">
                              {s.type}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100">{s.desc}</h4>
                          {(s.customerName || s.customerPhone) && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              গ্রাহক: {s.customerName || 'কাস্টমার'} {s.customerPhone ? `(${s.customerPhone})` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex sm:flex-col justify-between sm:justify-end w-full sm:w-auto items-center sm:items-end border-t sm:border-t-0 border-slate-800/60 pt-2.5 sm:pt-0 gap-2">
                          <div className="text-left sm:text-right">
                            <span className="text-base font-black font-mono text-emerald-400 block">
                              + ৳{s.paid}
                            </span>
                            {userRole === 'main_admin' && (
                              <div className="text-[11px] text-slate-400">
                                খরচ: ৳{s.cost} | লাভ: <span className="font-bold text-blue-400">৳{profit}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditService(s)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950/80 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                              title="ভুল সার্ভিস বা লোড এন্ট্রি এডিট করুন"
                            >
                              <Edit className="w-3.5 h-3.5 text-cyan-400" />
                              <span>এডিট</span>
                            </button>

                            <button
                              onClick={() => {
                                setReceiptData({
                                  title: 'সার্ভিসিং ও লোড রসিদ',
                                  type: 'service',
                                  date: s.date,
                                  customerName: s.customerName || undefined,
                                  customerPhone: s.customerPhone || undefined,
                                  items: [
                                    {
                                      name: `${s.type} - ${s.desc}`,
                                      amount: s.paid || 0
                                    }
                                  ],
                                  subtotal: s.paid || 0,
                                  paid: s.paid || 0,
                                  due: 0,
                                  seller: s.seller || activeSeller
                                });
                              }}
                              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-slate-700/80 transition-colors"
                              title="রসিদ প্রিন্ট করুন"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteService(s)}
                              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-800/60 transition-colors"
                              title="সার্ভিস রেকর্ড মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SUB-TAB 3: SHOP EXPENSES */}
            {serviceSubTab === 'expenses' && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-red-900/40 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400">সর্বমোট দোকান খরচ রেকর্ড:</span>
                    <h4 className="text-xl font-black font-mono text-red-400 mt-0.5">
                      ৳ {dashboardMetrics.totalExpenseAmount.toLocaleString()}
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setIsExpenseModalOpen(true);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    + নতুন খরচ যোগ
                  </button>
                </div>

                <div className="space-y-2">
                  {shopExpenses.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                      কোনো খরচের রেকর্ড নেই।
                    </div>
                  ) : (
                    shopExpenses.map((exp, expIdx) => (
                      <div
                        key={exp._fbKey ? `exp_${exp._fbKey}` : `exp_${exp.id}_${expIdx}`}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{exp.category}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{exp.date}</span>
                            {exp.seller && (
                              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">
                                {exp.seller}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{exp.note}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black font-mono text-red-400 mr-1">
                            - ৳{exp.amount}
                          </span>
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            className="px-2.5 py-1.5 text-slate-200 hover:text-cyan-300 bg-slate-800 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500/40 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                            title="খরচের এন্ট্রি এডিট করুন"
                          >
                            <Edit className="w-3.5 h-3.5 text-cyan-400" />
                            <span>এডিট</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id, `${exp.category} (৳${exp.amount})`)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                            title="খরচের রেকর্ড মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BAKI KHATA / TALLY LEDGER (SOLVES BUG 2: 2nd time baki addition) ================= */}
        {activeTab === 'dues' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-red-900/40 p-4 rounded-3xl shadow-lg relative overflow-hidden">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  মোট বকেয়া বাকি (Total Market Due)
                </span>
                <span className="block text-2xl font-black text-red-400 font-mono mt-1">
                  ৳ {duesSummary.totalDue.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">কাস্টমারদের কাছে দোকানে মোট পাওনা</p>
              </div>

              <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-3xl shadow-lg">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  মোট আদায়কৃত টাকা (Total Paid)
                </span>
                <span className="block text-2xl font-black text-emerald-400 font-mono mt-1">
                  ৳ {duesSummary.totalPaid.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">কাস্টমারদের দেওয়া জমা</p>
              </div>

              <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-3xl col-span-2 md:col-span-1 shadow-lg">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  বাকিদার কাস্টমার সংখ্যা
                </span>
                <span className="block text-2xl font-black text-slate-100 font-mono mt-1">
                  {duesSummary.debtorCount} জন
                </span>
                <p className="text-[10px] text-slate-400 mt-1">যাদের কাছে এখনও বাকি পাওনা আছে</p>
              </div>
            </div>

            {/* Filter and Action Header */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={dueSearchQuery}
                    onChange={e => setDueSearchQuery(e.target.value)}
                    placeholder="কাস্টমারের নাম বা মোবাইল নম্বর খুঁজুন..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Filter Pills */}
                <select
                  value={dueFilterStatus}
                  onChange={e => setDueFilterStatus(e.target.value as 'all' | 'pending' | 'cleared')}
                  className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 font-semibold focus:outline-none"
                >
                  <option value="all">সব কাস্টমার ({duesData.length})</option>
                  <option value="pending">বাকি আছে ({duesSummary.debtorCount})</option>
                  <option value="cleared">পরিশোধিত</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setDuePreselectedCustomer(null);
                  setIsAddDueModalOpen(true);
                }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন বাকি এন্ট্রি করুন</span>
              </button>
            </div>

            {/* Dues List */}
            <div className="space-y-3">
              {filteredDues.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl p-6">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p>কোনো বাকির খাতা এন্ট্রি পাওয়া যায়নি।</p>
                </div>
              ) : (
                filteredDues.map((cust, custIdx) => {
                  const pendingDue = (cust.totalAmount || 0) - (cust.paidAmount || 0);
                  const isPaidFull = pendingDue <= 0;
                  const uniqueCustKey = cust._fbKey ? `due_${cust._fbKey}` : `${cust.id || 'cust'}_${custIdx}`;

                  return (
                    <div
                      key={uniqueCustKey}
                      className={`bg-slate-900 border rounded-2xl p-4 shadow-md transition-all hover:border-slate-700 ${
                        isPaidFull ? 'border-slate-800/80 bg-slate-900/60' : 'border-amber-500/40 bg-slate-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-100">{cust.name}</h3>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isPaidFull
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                  : 'bg-red-950 text-red-400 border border-red-800/50'
                              }`}
                            >
                              {isPaidFull ? 'পরিশোধিত ✅' : 'বাকি আছে'}
                            </span>
                          </div>

                          {cust.phone && (
                            <p className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${cust.phone}`} className="hover:underline">
                                {cust.phone}
                              </a>
                            </p>
                          )}

                          <p className="text-xs text-slate-400">{cust.note || 'সাধারণ বাকি'}</p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {cust.date}
                            </span>
                            {cust.seller && (
                              <span className="text-cyan-500">
                                অপারেটর: {cust.seller}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Totals & Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="text-left sm:text-right">
                            <div className="text-[11px] text-slate-400">
                              মোট বিল: ৳{cust.totalAmount} | জমা: ৳{cust.paidAmount || 0}
                            </div>
                            <div
                              className={`text-lg font-black font-mono mt-0.5 ${
                                isPaidFull ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {isPaidFull ? 'পরিশোধিত ✅' : `বকেয়া বাকি: ৳ ${pendingDue.toLocaleString()}`}
                            </div>
                          </div>

                          {/* Quick Action Buttons (Sub Admin only gets + বাকি যোগ; Main Admin gets all) */}
                          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                            {/* 1. Add More Due Directly To This Customer (Baki Entry - Allowed for Both Main & Sub Admin) */}
                            <button
                              onClick={() => {
                                setDuePreselectedCustomer(cust);
                                setIsAddDueModalOpen(true);
                              }}
                              className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1"
                              title="এই কাস্টমারকে নতুন আরো বাকি দিন"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ বাকি যোগ</span>
                            </button>

                            {/* Main Admin Only Actions in Baki Khata */}
                            {isMainAdmin && (
                              <>
                                {/* 2. Collect Payment */}
                                {!isPaidFull && (
                                  <button
                                    onClick={() => setCollectingCustomer(cust)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>জমা নিন</span>
                                  </button>
                                )}

                                {/* 3. View Full Ledger */}
                                <button
                                  onClick={() => setViewingLedgerCustomer(cust)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border border-slate-700"
                                  title="পূর্ণাঙ্গ লেজার খতিয়ান দেখুন"
                                >
                                  লেজার
                                </button>

                                {/* 4. WhatsApp Reminder */}
                                {cust.phone && (
                                  <button
                                    onClick={() => handleSendWhatsAppReminder(cust)}
                                    className="p-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900 rounded-xl transition-colors"
                                    title="হোয়াটসঅ্যাপে তাগাদা পাঠান"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </button>
                                )}

                                {/* QR Code (WhatsApp & Contact Save) */}
                                {cust.phone && (
                                  <button
                                    onClick={() => handleOpenCustomerQr(cust.name, cust.phone || '', pendingDue)}
                                    className="p-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900 rounded-xl transition-colors"
                                    title="গ্রাহকের WhatsApp ও কন্টাক্ট QR কোড"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                )}

                                {/* 5. Print Slip */}
                                <button
                                  onClick={() => handlePrintStatement(cust)}
                                  className="p-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900 rounded-xl transition-colors"
                                  title="স্টেটমেন্ট বা রসিদ"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recent History Preview */}
                      {cust.history && cust.history.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                            <span>সাম্প্রতিক লেনদেনের রেকর্ড:</span>
                            {isMainAdmin && (
                              <button
                                onClick={() => setViewingLedgerCustomer(cust)}
                                className="text-cyan-400 hover:underline lowercase font-normal"
                              >
                                সব দেখুন ({cust.history.length})
                              </button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {cust.history.slice(-2).reverse().map((h, idx) => (
                              <div
                                key={`recent_hist_${cust.id || custIdx}_${h.date}_${h.amount}_${idx}`}
                                className="flex justify-between items-center text-[10px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/40 font-mono text-slate-300"
                              >
                                <span>
                                  {h.date} - {h.note || (h.type === 'due' ? 'বাকি নেওয়া' : 'নগদ জমা')}
                                </span>
                                <span
                                  className={`font-bold ${
                                    h.type === 'due' ? 'text-amber-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {h.type === 'due' ? '+ ৳' : '- ৳'}
                                  {h.amount}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ACCOUNTS & REPORTS ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Admin PIN Gate for Accounts */}
            {userRole !== 'main_admin' ? (
              <div className="bg-red-950/30 border border-red-900/50 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Main Admin এক্সেস প্রয়োজন</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    দোকানের সার্বিক লাভ, বিক্রয় ও ইনভেস্টমেন্ট হিসাব দেখার জন্য Main Admin PIN দিয়ে লগইন করুন।
                  </p>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
                >
                  Admin Login করুন
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Period Controls & Exports */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">হিসাবের সময়সীমা:</span>
                    <select
                      value={timeFilter}
                      onChange={e => setTimeFilter(e.target.value as 'today' | '7' | '30' | 'all')}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="today">আজকের হিসাব (Today)</option>
                      <option value="7">গত ৭ দিন (Weekly)</option>
                      <option value="30">গত ৩০ দিন (Monthly)</option>
                      <option value="all">সব সময়ের হিসাব (All-Time)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                      <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                    </label>

                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                      title="পূর্ণাঙ্গ ডেটাবেজ ব্যাকআপ নিন"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Backup JSON</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                      title="এক্সেল বা CSV রিপোর্ট ডাউনলোড"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel CSV</span>
                    </button>
                  </div>
                </div>

                {/* Big Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl md:col-span-2 shadow-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      দোকানের বর্তমান মোট স্টক ভ্যালু (Asset Value)
                    </span>
                    <span className="block text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1">
                      {isPrivacyMode ? '••••••••' : `৳ ${stockSummary.totalBuyVal.toLocaleString()}`}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      মোট {stockSummary.totalUnits} পিস মালামাল স্টকে বিদ্যমান
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl md:col-span-2 shadow-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      পিরিয়ড মোট বিক্রয় / রেভিনিউ ({timeFilter})
                    </span>
                    <span className="block text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
                      ৳ {dashboardMetrics.revenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                      বিক্রিকৃত মালের আসল কেনা পুঁজি: ৳ {dashboardMetrics.totalSalesCost.toLocaleString()} | লাভ: ৳ {dashboardMetrics.totalSalesProfit.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-blue-900/40 p-4 rounded-3xl col-span-2 shadow-lg bg-blue-950/20">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      পিরিয়ড নীট লাভ (Net Profit)
                    </span>
                    <span className="block text-2xl sm:text-3xl font-black text-blue-400 font-mono mt-1">
                      {isPrivacyMode ? '••••••••' : `৳ ${(dashboardMetrics.netTrueProfit || dashboardMetrics.grossProfit || 0).toLocaleString()}`}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      মাল কেনা ও খরচ বাদে হাতে নিট নগদ ক্যাশ: <strong className="text-cyan-300 font-mono">৳ {dashboardMetrics.netCashRemainingInHand.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-red-900/40 p-4 rounded-3xl col-span-2 shadow-lg bg-red-950/20">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-red-400">
                      বাজারে বর্তমান বকেয়া বাকি
                    </span>
                    <span className="block text-2xl font-black text-red-400 font-mono mt-1">
                      ৳ {duesSummary.totalDue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {duesSummary.debtorCount} জন কাস্টমারের কাছে বাকি
                    </span>
                  </div>
                </div>

                {/* ================= 🔄 CAPITAL VS PROFIT & OUTSIDE PURCHASE / RESTOCK TRACKER ================= */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/30 border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-inner">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-slate-100">
                            🔄 বিক্রির টাকায় পুনরায় মাল ক্রয় ও বাহিরের পার্টস হিসাব (পুঁজি বনাম লাভ)
                          </h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            হিসাব আর এলোমেলো হবে না
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          স্টকের মাল বিক্রি করে যে টাকা আসে তার মধ্যে <strong className="text-amber-300">আসল কেনা পুঁজি কত</strong>, <strong className="text-emerald-300">লাভ কত</strong>, এবং <strong className="text-purple-300">ওই টাকা দিয়ে আবার অন্য জায়গা থেকে মাল কিনে আনলে বা লাগালে</strong> হাতে নিট কত টাকা থাকে—তার পরিষ্কার হিসাব।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5-Box Crystal Clear Cash & Capital Equation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Step 1: Total Cash Received */}
                    <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                        ১. বিক্রি থেকে নগদ ক্যাশ ইন
                      </span>
                      <span className="text-lg font-black font-mono text-slate-100 mt-1 block">
                        ৳ {dashboardMetrics.totalCashInHandBeforeSpend.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        নগদ বিক্রি ৳{dashboardMetrics.totalSalesCashAmount.toLocaleString()} + সার্ভিস/বাকি আদায়
                      </span>
                    </div>

                    {/* Step 2: Original Buying Cost (Capital) of Sold Goods */}
                    <div className="bg-slate-950/80 border border-amber-500/30 p-3.5 rounded-2xl relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        ২. বিক্রিকৃত মালের আসল পুঁজি (কেনা দাম)
                      </span>
                      <span className="text-lg font-black font-mono text-amber-300 mt-1 block">
                        ৳ {dashboardMetrics.totalSalesCost.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        যেমন: ২০০০ টাকার ডিসপ্লের মধ্যে ৮০০ টাকা আসল পুঁজি
                      </span>
                    </div>

                    {/* Step 3: True Profit from Sales */}
                    <div className="bg-slate-950/80 border border-emerald-500/30 p-3.5 rounded-2xl relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                        ৩. বিক্রি থেকে প্রকৃত লাভ
                      </span>
                      <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
                        + ৳ {dashboardMetrics.grossProfit.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        যেমন: ২০০০ - ৮০০ = ১২০০ টাকা লাভ
                      </span>
                    </div>

                    {/* Step 4: Cash Spent to Buy Parts / Reinvest */}
                    <div className="bg-slate-950/80 border border-purple-500/40 p-3.5 rounded-2xl relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                        ৪. ক্যাশ থেকে পুনরায় মাল কেনা
                      </span>
                      <span className="text-lg font-black font-mono text-purple-400 mt-1 block">
                        - ৳ {dashboardMetrics.totalCashReinvested.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        অন্য দোকান থেকে পার্টস কিনতে ক্যাশ খরচ
                      </span>
                    </div>

                    {/* Step 5: Final Net Cash Remaining in Hand */}
                    <div className="bg-gradient-to-br from-cyan-950/60 via-slate-950 to-emerald-950/40 border-2 border-cyan-500/50 p-3.5 rounded-2xl shadow-lg">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                        ৫. মাল কেনার পর হাতে নিট ক্যাশ
                      </span>
                      <span className="text-xl font-black font-mono text-cyan-300 mt-1 block">
                        = ৳ {dashboardMetrics.netCashRemainingInHand.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-cyan-200/80 block mt-0.5">
                        (ক্যাশ ইন - মাল কেনা ৳{dashboardMetrics.totalCashReinvested} - খরচ ৳{dashboardMetrics.totalExpenseAmount})
                      </span>
                    </div>
                  </div>

                  {/* Quick Entry Form + Live Ledger */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                    {/* Left 7 Cols: Entry Form */}
                    <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-cyan-400" />
                          <span>নতুন মাল কেনা / বাহির থেকে এনে বিক্রি এন্ট্রি করুন</span>
                        </h4>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setReinvestMode('instant_sell')}
                            className={`px-2.5 py-1.5 rounded-lg transition-all ${
                              reinvestMode === 'instant_sell'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            ⚡ বাহির থেকে এনে তাৎক্ষণিক বিক্রি
                          </button>
                          <button
                            type="button"
                            onClick={() => setReinvestMode('restock')}
                            className={`px-2.5 py-1.5 rounded-lg transition-all ${
                              reinvestMode === 'restock'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            📦 বিক্রির টাকায় স্টক ক্রয়
                          </button>
                        </div>
                      </div>

                      {reinvestMode === 'instant_sell' ? (
                        <div className="bg-cyan-950/25 border border-cyan-500/20 rounded-xl px-3 py-2 text-[11px] text-cyan-200/90 leading-relaxed">
                          💡 <strong>আপনার উদাহরণ:</strong> আরেকটা ডিসপ্লে লাগাতে হবে যেটা আপনার স্টকে নেই। অন্য জায়গা থেকে <strong>৳৮০০</strong> দিয়ে কিনে এনে কাস্টমারকে <strong>৳২০০০</strong> টাকায় লাগিয়ে দিলেন। এখানে লিখে সেভ করলেই ক্যাশ থেকে <strong>-৳৮০০</strong> মাল কেনা এবং <strong>+৳২০০০</strong> বিক্রি ও <strong>+৳১২০০</strong> লাভ অটো হিসাব হয়ে যাবে!
                        </div>
                      ) : (
                        <div className="bg-purple-950/25 border border-purple-500/20 rounded-xl px-3 py-2 text-[11px] text-purple-200/90 leading-relaxed">
                          💡 <strong>উদাহরণ:</strong> ডিসপ্লে <strong>৳২০০০</strong> টাকায় বিক্রি করার পর সেই ক্যাশ টাকা থেকে <strong>৳৮০০</strong> দিয়ে আবার নতুন মাল কিনে দোকানে স্টক করলেন। এখানে এন্ট্রি দিলে ক্যাশ থেকে <strong>-৳৮০০</strong> মাল ক্রয় হিসেবে হিসাব থাকবে এবং স্টকে <strong>+১ পিস</strong> যোগ হবে!
                        </div>
                      )}

                      <form onSubmit={handleSaveCashPurchase} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              মালের নাম / মডেল লিখুন *
                            </label>
                            <input
                              type="text"
                              value={reinvestItemName}
                              onChange={e => setReinvestItemName(e.target.value)}
                              placeholder="যেমন: Vivo Y20 Display / শর্ট পার্টস"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                              required={!reinvestSelectedItemId}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              অথবা স্টকের মাল সিলেক্ট করুন (ঐচ্ছিক)
                            </label>
                            <select
                              value={reinvestSelectedItemId}
                              onChange={e => {
                                const id = e.target.value;
                                setReinvestSelectedItemId(id);
                                const found = inventory.find(i => i.id === id);
                                if (found) {
                                  setReinvestItemName(found.name);
                                  if (found.price) setReinvestBuyPrice(String(found.price));
                                  if (found.sellingPrice) setReinvestSellPrice(String(found.sellingPrice));
                                }
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">-- নতুন / বাহিরের পার্টস --</option>
                              {inventory.map(item => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (স্টক: {item.stock}, কেনা: ৳{item.price})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              পরিমাণ (পিস) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={reinvestQty}
                              onChange={e => setReinvestQty(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                              কেনা দাম / প্রতি পিস (৳) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={reinvestBuyPrice}
                              onChange={e => setReinvestBuyPrice(e.target.value)}
                              placeholder="যেমন: 800"
                              className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                              {reinvestMode === 'instant_sell' ? 'কাস্টমার দিল / বিক্রয় (৳) *' : 'সম্ভাব্য বিক্রয় দাম (৳)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={reinvestSellPrice}
                              onChange={e => setReinvestSellPrice(e.target.value)}
                              placeholder="যেমন: 2000"
                              className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                              required={reinvestMode === 'instant_sell'}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              কোন জায়গা / দোকান থেকে কিনে আনলেন? (ঐচ্ছিক)
                            </label>
                            <input
                              type="text"
                              value={reinvestSupplier}
                              onChange={e => setReinvestSupplier(e.target.value)}
                              placeholder="যেমন: পাশের দোকান / মার্কেট"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          {reinvestMode === 'instant_sell' && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                কাস্টমারের নাম / বিবরণ (ঐচ্ছিক)
                              </label>
                              <input
                                type="text"
                                value={reinvestCustomer}
                                onChange={e => setReinvestCustomer(e.target.value)}
                                placeholder="যেমন: ডিসপ্লে ফিটিং কাস্টমার"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Live Preview Banner before Submit */}
                        {(parseFloat(reinvestBuyPrice) || 0) > 0 && (
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="text-slate-400">ক্যাশ থেকে মাল কিনতে খরচ: </span>
                              <strong className="font-mono text-purple-400">
                                - ৳ {((parseInt(reinvestQty) || 1) * (parseFloat(reinvestBuyPrice) || 0)).toLocaleString()}
                              </strong>
                            </div>
                            {reinvestMode === 'instant_sell' && (parseFloat(reinvestSellPrice) || 0) > 0 && (
                              <>
                                <div>
                                  <span className="text-slate-400">কাস্টমার থেকে ক্যাশ ইন: </span>
                                  <strong className="font-mono text-cyan-400">
                                    + ৳ {((parseInt(reinvestQty) || 1) * (parseFloat(reinvestSellPrice) || 0)).toLocaleString()}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">নিট লাভ থাকবে: </span>
                                  <strong className="font-mono text-emerald-400">
                                    + ৳ {((parseInt(reinvestQty) || 1) * ((parseFloat(reinvestSellPrice) || 0) - (parseFloat(reinvestBuyPrice) || 0))).toLocaleString()}
                                  </strong>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          className={`w-full py-2.5 px-4 rounded-xl font-black text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            reinvestMode === 'instant_sell'
                              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {reinvestMode === 'instant_sell'
                              ? 'বাহির থেকে কিনে তাৎক্ষণিক বিক্রি ও লাভের হিসাব সেভ করুন'
                              : 'বিক্রির ক্যাশ টাকা দিয়ে মাল ক্রয় ও স্টকে যোগ করুন'}
                          </span>
                        </button>
                      </form>
                    </div>

                    {/* Right 5 Cols: Recent Reinvestment & Outside Purchases Ledger */}
                    <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-purple-400" />
                            <span>পুনরায় মাল ক্রয় ও বাহিরের পার্টস খতিয়ান</span>
                          </h4>
                          <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-500/30">
                            মোট কেনা: ৳{dashboardMetrics.totalCashReinvested.toLocaleString()}
                          </span>
                        </div>

                        {dashboardMetrics.filteredCashPurchases.length === 0 ? (
                          <div className="text-center py-8 px-3 border border-dashed border-slate-800 rounded-2xl">
                            <p className="text-xs text-slate-400 font-semibold">
                              এই সময়ে বিক্রির টাকা দিয়ে পুনরায় মাল কেনা বা বাহিরের পার্টস এন্ট্রি নেই।
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              বাম পাশের ফর্ম দিয়ে এন্ট্রি করলেই এখানে বিস্তারিত হিসাব দেখাবে।
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {dashboardMetrics.filteredCashPurchases.map(cp => {
                              const profit = cp.isSold && cp.sellingPrice
                                ? cp.qty * (cp.sellingPrice - cp.unitCost)
                                : 0;
                              return (
                                <div
                                  key={cp.id}
                                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex flex-col gap-2 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                                        <span>{cp.itemName}</span>
                                        <span className="text-[10px] font-mono bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded">
                                          x{cp.qty}
                                        </span>
                                        {cp.type === 'instant_sell' ? (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                            ⚡ এনে তাৎক্ষণিক বিক্রি
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                            📦 ক্যাশ দিয়ে স্টক ক্রয়
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        {cp.date} • উৎস: {cp.supplierName || 'মার্কেট'}
                                        {cp.customerName ? ` • কাস্টমার: ${cp.customerName}` : ''}
                                      </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                      <div className="font-mono font-bold text-purple-400">
                                        কেনা: -৳{cp.totalCost.toLocaleString()}
                                      </div>
                                      {cp.isSold && cp.sellingPrice ? (
                                        <div className="text-[10px] font-mono text-emerald-400 font-bold">
                                          বিক্রি: +৳{(cp.qty * cp.sellingPrice).toLocaleString()} (লাভ: ৳{profit})
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-amber-400">স্টকে জমা আছে</div>
                                      )}
                                    </div>
                                  </div>

                                  {sellingPurchaseId === cp.id ? (
                                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/70">
                                      <input
                                        type="number"
                                        min="1"
                                        step="any"
                                        value={sellingPurchaseRate}
                                        onChange={e => setSellingPurchaseRate(e.target.value)}
                                        placeholder="বিক্রয় দর (৳)"
                                        className="w-28 bg-slate-950 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs font-mono text-emerald-300 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmSellFromPurchase(cp)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px]"
                                      >
                                        কনফার্ম বিক্রি
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSellingPurchaseId(null);
                                          setSellingPurchaseRate('');
                                        }}
                                        className="text-slate-400 hover:text-white text-[10px] px-1.5"
                                      >
                                        বাতিল
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/70">
                                      {!cp.isSold ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSellingPurchaseId(cp.id);
                                            setSellingPurchaseRate(
                                              String(cp.sellingPrice && cp.sellingPrice > cp.unitCost ? cp.sellingPrice : cp.unitCost + 500)
                                            );
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-colors"
                                        >
                                          🛒 এখন কাস্টমারকে বিক্রি করুন
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-emerald-400/90 font-semibold flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" /> বিক্রি ও লাভের খাতায় যুক্ত হয়েছে
                                        </span>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCashPurchase(cp)}
                                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                        title="মুছে ফেলুন"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Clear summary footer inside right card */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>মোট নগদ ক্যাশ এসেছিল:</span>
                          <span className="font-mono font-bold text-slate-200">৳ {dashboardMetrics.totalCashInHandBeforeSpend.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-purple-300">
                          <span>পুনরায় মাল কিনতে ক্যাশ খরচ:</span>
                          <span className="font-mono font-bold">- ৳ {dashboardMetrics.totalCashReinvested.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-300">
                          <span>দোকানের অন্যান্য খরচ:</span>
                          <span className="font-mono font-bold">- ৳ {dashboardMetrics.totalExpenseAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-cyan-300 font-bold pt-1 border-t border-slate-800">
                          <span>এখন হাতে/ড্রয়ারে নিট নগদ টাকা:</span>
                          <span className="font-mono text-sm">৳ {dashboardMetrics.netCashRemainingInHand.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Ledger Breakdown */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2.5">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>পিরিয়ডের বিক্রয় খতিয়ান ({dashboardMetrics.filteredSales.length} টি বিক্রয়)</span>
                  </h3>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {dashboardMetrics.filteredSales.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        এই সময়সীমার মধ্যে কোনো পণ্য বিক্রি হয়নি।
                      </div>
                    ) : (
                      dashboardMetrics.filteredSales.map((s, sIdx) => {
                        const q = s.qty || 1;
                        const profit = q * ((s.sell || 0) - (s.buy || 0));
                        const uniqueSaleKey = s._fbKey ? `sale_${s._fbKey}` : `${s.id || 'sale'}_${sIdx}`;
                        return (
                          <div
                            key={uniqueSaleKey}
                            className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-200">
                                {s.name} <span className="text-slate-400 font-mono">(x{q})</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                <span>{s.date}</span>
                                {s.seller && (
                                  <span className="text-cyan-400">বিক্রেতা: {s.seller}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-emerald-400 font-bold block text-sm">
                                + ৳{q * (s.sell || 0)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                লাভ: <strong className="text-blue-400">{isPrivacyMode ? '••••' : `৳${profit}`}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: PRE-ORDERS & PRODUCT DEMANDS ================= */}
        {activeTab === 'preorders' && (
          <PreOrdersView
            orders={productPreOrders}
            onOpenAdd={handleOpenAddPreOrder}
            onOpenEdit={handleOpenEditPreOrder}
            onDelete={handleDeletePreOrder}
            onUpdateStatus={handleUpdatePreOrderStatus}
            onPrintSlip={(receipt) => setReceiptData(receipt)}
            activeSeller={activeSeller}
            onAddExtraAdvance={handleAddExtraAdvance}
            onSettleBalance={handleSettlePreOrderBalance}
          />
        )}
      </main>

      {/* ================= MODAL: IMPROVED LOGIN & ROLE ACCESS ================= */}
      {(isLoginModalOpen || userRole === 'guest') && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/30 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100">অনিক টেলিকম • সিকিউরিটি লগইন</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  আপনার অ্যাকাউন্ট নির্বাচন করে পাসওয়ার্ড দিন
                </p>
              </div>
            </div>

            {/* Account Selector Tabs: Anik (Main Admin) vs Parvej (Sub Admin) */}
            <div className="grid grid-cols-2 gap-2.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedLoginUser('Anik');
                  setEnteredPin('');
                  setLoginError(false);
                }}
                className={`p-3 rounded-xl text-left transition-all border ${
                  selectedLoginUser === 'Anik'
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500 text-cyan-300 shadow-lg'
                    : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-100">👑 Anik</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    Main Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  পূর্ণ নিয়ন্ত্রণ ও সকল হিসাব এক্সেস
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedLoginUser('Parvej');
                  setEnteredPin('');
                  setLoginError(false);
                }}
                className={`p-3 rounded-xl text-left transition-all border ${
                  selectedLoginUser === 'Parvej'
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500 text-amber-300 shadow-lg'
                    : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-100">🛡️ Parvej</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    Sub Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  শুধু সেল, স্টক ও বাকি এন্ট্রি
                </p>
              </button>
            </div>

            {/* Role Permission Info Box */}
            <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
              selectedLoginUser === 'Anik'
                ? 'bg-cyan-950/30 border-cyan-800/50 text-cyan-200'
                : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
            }`}>
              {selectedLoginUser === 'Anik' ? (
                <>
                  <p className="font-bold text-cyan-300">👑 Main Admin (Anik) সুবিধাসমূহ:</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ✓ কেনা দাম দেখা, লাভ-ক্ষতি ড্যাশবোর্ড, ক্যাশ ড্রয়ার, মহাজন খাতা, সার্ভিস ও সকল ডাটা এডিট/ডিলিট করার পূর্ণ ক্ষমতা।
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-amber-300">🛡️ Sub Admin (Parvej) অনুমোদিত এক্সেস:</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ✓ শুধুমাত্র <strong>১. সেল এন্ট্রি (বিক্রি)</strong>, <strong>২. স্টক এন্ট্রি (মালামাল যোগ)</strong> এবং <strong>৩. বাকি এন্ট্রি</strong>। (কেনা দাম, লাভ ও ডিলিট অপশন বন্ধ থাকবে)
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 text-left">
                  {selectedLoginUser === 'Anik' ? 'Anik (Main Admin) পাসওয়ার্ড দিন:' : 'Parvej (Sub Admin) পাসওয়ার্ড দিন:'}
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    value={enteredPin}
                    onChange={e => {
                      setEnteredPin(e.target.value);
                      setLoginError(false);
                    }}
                    placeholder={selectedLoginUser === 'Anik' ? 'Main Admin Password' : 'Sub Admin Password'}
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-11 py-3 text-center text-xl tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    title={showLoginPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 font-bold text-center">
                  ❌ ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।
                </div>
              )}

              <button
                type="submit"
                className={`w-full font-black py-3 rounded-xl transition-all shadow-lg text-sm active:scale-98 ${
                  selectedLoginUser === 'Anik'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                }`}
              >
                {selectedLoginUser === 'Anik' ? '👑 Anik হিসেবে লগইন করুন' : '🛡️ Parvej হিসেবে লগইন করুন'}
              </button>
            </form>

            {userRole !== 'guest' && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    setEnteredPin('');
                    setLoginError(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline font-semibold"
                >
                  বন্ধ করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT ITEM ================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>{editingItem ? 'মালামাল এডিট করুন' : 'নতুন মালামাল ও পার্টস যোগ'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsItemInlineScannerOpen(false);
                  setIsItemModalOpen(false);
                }}
                className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">ক্যাটাগরি</label>
                  <input
                    type="text"
                    list="cat-datalist"
                    value={itemFormData.category}
                    onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}
                    placeholder="যেমন: Display"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <datalist id="cat-datalist">
                    {availableCategories.map((c, idx) => <option key={`cat_dl_${c}_${idx}`} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">ব্র্যান্ড</label>
                  <input
                    type="text"
                    list="brand-datalist"
                    value={itemFormData.brand}
                    onChange={e => setItemFormData({ ...itemFormData, brand: e.target.value })}
                    placeholder="যেমন: Vivo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <datalist id="brand-datalist">
                    {availableBrands.map((b, idx) => <option key={`brand_dl_${b}_${idx}`} value={b} />)}
                  </datalist>
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[10px] text-slate-500 mr-1 font-semibold">কুইক সিলেক্ট:</span>
                  {[
                    { id: 'Display', label: '📱 ডিসপ্লে' },
                    { id: 'Battery', label: '🔋 ব্যাটারি' },
                    { id: 'Sub Charging Board', label: '⚡ চার্জিং বোর্ড' },
                    { id: 'Back Shell', label: '🛡️ ব্যাকশেল' },
                    { id: 'Camera', label: '📷 ক্যামেরা' },
                    { id: 'Flex Cable', label: '🔌 ফ্লেক্স' },
                    { id: 'Charger', label: '🔌 চার্জার' },
                    { id: 'Cable', label: '⚡ ডাটা কেবল' },
                    { id: 'Earphones', label: '🎧 ইয়ারফোন' }
                  ].map(qc => (
                    <button
                      key={`qc_btn_${qc.id}`}
                      type="button"
                      onClick={() => setItemFormData(prev => ({ ...prev, category: qc.id }))}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold transition-colors ${
                        itemFormData.category.toLowerCase() === qc.id.toLowerCase()
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {qc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-400">
                    প্রোডাক্ট কোড / বারকোড (SKU)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = (itemFormData.category || 'PART').slice(0, 3).toUpperCase();
                        const generated = `AT-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
                        setItemFormData(prev => ({ ...prev, sku: generated }));
                        showToast(`অটো বারকোড তৈরি হয়েছে: ${generated}`, 'info');
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold transition-colors"
                      title="নতুন র‍্যান্ডম বারকোড তৈরি করুন"
                    >
                      ⚡ অটো কোড
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsItemInlineScannerOpen(prev => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all border ${
                        isItemInlineScannerOpen
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/40 shadow-sm'
                      }`}
                    >
                      <ScanBarcode className="w-3.5 h-3.5" />
                      <span>{isItemInlineScannerOpen ? 'স্ক্যানার বন্ধ করুন' : 'বারকোড স্ক্যানার খুলুন'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Live Camera Barcode Scanner (auto-fills itemFormData.sku on scan) */}
                {isItemInlineScannerOpen && (
                  <InlineBarcodeScanner
                    onScanned={scannedCode => {
                      setItemFormData(prev => ({ ...prev, sku: scannedCode }));
                      setIsItemInlineScannerOpen(false);
                      showToast(`✅ বারকোড স্ক্যান হয়ে অটো যুক্ত হয়েছে: ${scannedCode}`, 'success');
                    }}
                    onClose={() => setIsItemInlineScannerOpen(false)}
                  />
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={itemFormData.sku}
                    onChange={e => setItemFormData({ ...itemFormData, sku: e.target.value })}
                    placeholder="যেমন: AT-DISP-01 বা উপরের বারকোড স্ক্যানার বাটনে চাপুন"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsItemInlineScannerOpen(prev => !prev)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                      isItemInlineScannerOpen
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-cyan-400 hover:bg-slate-800'
                    }`}
                    title="বারকোড স্ক্যান করে অটো বক্সে নিন"
                  >
                    <ScanBarcode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">পার্টস এর নাম</label>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={e => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="যেমন: Universal Display Vivo Y11/Y12/Y15"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  সাপোর্টেড মডেলসমূহ (কমা দিয়ে লিখুন)
                </label>
                <textarea
                  rows={2}
                  value={itemFormData.models}
                  onChange={e => setItemFormData({ ...itemFormData, models: e.target.value })}
                  placeholder="Y11, Y12, Y15, Y17"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className={`grid ${editingItem && !isMainAdmin ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={itemFormData.stock}
                    onChange={e => setItemFormData({ ...itemFormData, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                {(!editingItem || isMainAdmin) && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">ক্রয়মূল্য (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={itemFormData.price}
                      onChange={e => setItemFormData({ ...itemFormData, price: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                      required={isMainAdmin}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={itemFormData.sellingPrice}
                    onChange={e => setItemFormData({ ...itemFormData, sellingPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
                >
                  {editingItem ? 'আপডেট সম্পন্ন করুন' : 'মালামাল সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM SALE ================= */}
      {isSellModalOpen && sellingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>বিক্রি কনফার্মেশন</span>
              </h3>
              <button
                onClick={() => setIsSellModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSale} className="p-5 space-y-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="text-sm font-bold text-slate-100 truncate">{sellingItem.name}</h4>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>ব্র্যান্ড: <strong className="text-slate-200">{sellingItem.brand}</strong></span>
                  <span>বর্তমান স্টক: <strong className="text-cyan-400 font-mono">{sellingItem.stock} টি</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">বিক্রয় পরিমাণ</label>
                  <input
                    type="number"
                    min="1"
                    max={sellingItem.stock}
                    placeholder="1"
                    value={sellQty}
                    onChange={e => setSellQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">প্রতি পিস মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={sellPrice}
                    onChange={e => setSellPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">ওয়ারেন্টি পলিসি</label>
                <select
                  value={sellWarranty}
                  onChange={e => setSellWarranty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                >
                  <option value="কোনো ওয়ারেন্টি নেই">কোনো ওয়ারেন্টি নেই</option>
                  <option value="৭ দিনের টেস্টিং ওয়ারেন্টি">৭ দিনের টেস্টিং ওয়ারেন্টি</option>
                  <option value="১৫ দিনের ওয়ারেন্টি">১৫ দিনের ওয়ারেন্টি</option>
                  <option value="১ মাসের সার্ভিস ওয়ারেন্টি">১ মাসের সার্ভিস ওয়ারেন্টি</option>
                  <option value="৬ মাসের ব্যাটারি রিপ্লেসমেন্ট">৬ মাসের ব্যাটারি রিপ্লেসমেন্ট</option>
                </select>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">সর্বমোট বিক্রয় বিল:</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  ৳ {((Number(sellQty) || 0) * (Number(sellPrice) || 0)).toLocaleString()}
                </span>
              </div>

              {/* Baki integration option */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sellIsBaki}
                    onChange={e => setSellIsBaki(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-amber-400">এটির কি বাকি থাকবে? (বাকি খাতায় যুক্ত করুন)</span>
                </label>

                {sellIsBaki && (
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">গ্রাহকের নাম</label>
                      <input
                        type="text"
                        value={sellCustomerName}
                        onChange={e => setSellCustomerName(e.target.value)}
                        placeholder="গ্রাহকের নাম লিখুন"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                        required={sellIsBaki}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">মোবাইল নম্বর</label>
                      <input
                        type="tel"
                        value={sellCustomerPhone}
                        onChange={e => setSellCustomerPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">আজকে নগদ কত জমা দিল?</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        max={(Number(sellQty) || 0) * (Number(sellPrice) || 0)}
                        value={sellPaidNow}
                        onChange={e => setSellPaidNow(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold font-mono"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-slate-400">অবশিষ্ট বাকি থাকবে:</span>
                      <span className="font-mono font-bold text-red-400">
                        ৳ {Math.max(0, ((Number(sellQty) || 0) * (Number(sellPrice) || 0)) - (Number(sellPaidNow) || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>বিক্রি কনফার্ম করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW / EDIT SERVICE & LOAD ================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  <span>{editingService ? 'সার্ভিস ও লোড এন্ট্রি এডিট করুন' : 'নতুন সার্ভিসিং ও ডিজিটাল রিচার্জ'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {editingService ? 'ভুল এন্ট্রি বা টাকার পরিমাণ সংশোধন করে সেভ করুন' : 'সার্ভিস ও ফ্লেক্সিলোড/বিকাশ হিসাব যোগ করুন'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsServiceModalOpen(false);
                  setEditingService(null);
                }}
                className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveService} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">সার্ভিস / লোড টাইপ</label>
                  <select
                    value={serviceFormData.type}
                    onChange={e => setServiceFormData({ ...serviceFormData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Recharge/Flexiload">ফ্লেক্সিলোড / রিচার্জ / বিকাশ</option>
                    <option value="Display Fitting">ডিসপ্লে চেঞ্জ ও ফিটিং</option>
                    <option value="Hardware Repair">হার্ডওয়্যার আইসি / চার্জিং রিপেয়ার</option>
                    <option value="Software Unlock">সফটওয়্যার ফ্ল্যাশ / আনলক</option>
                    <option value="Apple ID/iCloud">অ্যাপল আইডি / বাইপাস</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">তারিখ (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={serviceFormData.date || new Date().toLocaleDateString('en-GB')}
                    onChange={e => setServiceFormData({ ...serviceFormData, date: e.target.value })}
                    placeholder="যেমন: 06/10/2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">বিবরণ / নম্বর / কাজের তথ্য *</label>
                <input
                  type="text"
                  value={serviceFormData.desc}
                  onChange={e => setServiceFormData({ ...serviceFormData, desc: e.target.value })}
                  placeholder="যেমন: 017XXXXX - ৳100 লোড, বা Vivo Y20 Display Fit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">কাস্টমারের নাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={serviceFormData.customerName}
                    onChange={e => setServiceFormData({ ...serviceFormData, customerName: e.target.value })}
                    placeholder="গ্রাহকের নাম"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="tel"
                    value={serviceFormData.customerPhone}
                    onChange={e => setServiceFormData({ ...serviceFormData, customerPhone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">দোকানের নিজস্ব খরচ (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={serviceFormData.cost}
                    onChange={e => setServiceFormData({ ...serviceFormData, cost: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">কাস্টমার দিল (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={serviceFormData.paid}
                    onChange={e => setServiceFormData({ ...serviceFormData, paid: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Live Profit Preview */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">এই সার্ভিস/লোড থেকে নিট লাভ:</span>
                <span className="font-mono font-black text-cyan-400">
                  ৳ {((parseFloat(String(serviceFormData.paid)) || 0) - (parseFloat(String(serviceFormData.cost)) || 0)).toLocaleString()}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-50 font-black py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
                >
                  {editingService ? 'এডিট ও আপডেট সেভ করুন' : 'সার্ভিস রেকর্ড সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD SELLER ================= */}
      {isSellerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100">নতুন স্টাফ / অপারেটর প্রোফাইল</h3>
              <button onClick={() => setIsSellerModalOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddSeller} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">স্টাফের নাম</label>
                <input
                  type="text"
                  value={newSellerName}
                  onChange={e => setNewSellerName(e.target.value)}
                  placeholder="যেমন: রাকিব"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2 rounded-xl text-xs"
              >
                প্রোফাইল সেভ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DUE (NEW OR 2ND TIME) ================= */}
      <AddDueModal
        isOpen={isAddDueModalOpen}
        onClose={() => {
          setIsAddDueModalOpen(false);
          setDuePreselectedCustomer(null);
        }}
        existingCustomers={duesData}
        preSelectedCustomer={duePreselectedCustomer}
        activeSeller={activeSeller}
        onSave={handleSaveDueEntry}
      />

      {/* ================= MODAL: COLLECT PAYMENT ================= */}
      <CollectPaymentModal
        customer={collectingCustomer}
        onClose={() => setCollectingCustomer(null)}
        activeSeller={activeSeller}
        onCollect={handleCollectPayment}
      />

      {/* ================= MODAL: CUSTOMER LEDGER STATEMENT ================= */}
      <CustomerLedgerModal
        customer={viewingLedgerCustomer}
        onClose={() => setViewingLedgerCustomer(null)}
        onAddMoreDue={cust => {
          setViewingLedgerCustomer(null);
          setDuePreselectedCustomer(cust);
          setIsAddDueModalOpen(true);
        }}
        onCollectPayment={cust => {
          setViewingLedgerCustomer(null);
          setCollectingCustomer(cust);
        }}
        onPrintStatement={handlePrintStatement}
        onOpenQrCode={cust => handleOpenCustomerQr(cust.name, cust.phone || '', Math.max(0, cust.totalAmount - (cust.paidAmount || 0)))}
        onDeleteCustomer={handleDeleteDueCustomer}
        isAdmin={userRole === 'main_admin'}
      />

      {/* ================= MODAL: CASH MEMO / RECEIPT ================= */}
      <ReceiptModal
        receipt={receiptData}
        onClose={() => setReceiptData(null)}
        settings={shopSettings}
      />

      {/* ================= MODAL: CASH DRAWER RECONCILIATION ================= */}
      <CashDrawerModal
        isOpen={isCashDrawerOpen}
        onClose={() => setIsCashDrawerOpen(false)}
        sales={salesHistory}
        services={servicesData}
        expenses={shopExpenses}
        dues={duesData}
        cashPurchases={cashPurchases}
        activeSeller={activeSeller}
      />

      {/* ================= MODAL: WHOLESALE SUPPLIER / MOHAJON KHATA ================= */}
      <SupplierLedgerModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        suppliers={supplierDues}
        onSaveSupplier={handleSaveSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        isAdmin={userRole === 'main_admin'}
        activeSeller={activeSeller}
      />

      {/* ================= MODAL: PROFIT & DISCOUNT CALCULATOR ================= */}
      <ProfitCalculatorModal
        isOpen={isProfitCalcOpen}
        onClose={() => setIsProfitCalcOpen(false)}
      />

      {/* ================= MODAL: REPAIR JOB CARD (ADD / EDIT) ================= */}
      <RepairJobModal
        isOpen={isRepairModalOpen}
        onClose={() => {
          setIsRepairModalOpen(false);
          setEditingRepairJob(null);
        }}
        activeSeller={activeSeller}
        onSaveJob={handleSaveRepairJob}
        nextJobNumber={repairJobs.length + 101}
        editingJob={editingRepairJob}
      />

      {/* ================= MODAL: SHOP EXPENSES (ADD / EDIT) ================= */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        activeSeller={activeSeller}
        onSaveExpense={handleSaveExpense}
        recentExpenses={shopExpenses}
        editingExpense={editingExpense}
      />

      {/* ================= MODAL: REORDER SHORTAGE LIST ================= */}
      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        lowStockItems={inventory.filter(i => (i.stock || 0) <= 2)}
      />

      {/* ================= MODAL: PRE-ORDERS & PRODUCT DEMANDS (ADD / EDIT) ================= */}
      <PreOrderModal
        isOpen={isPreOrderModalOpen}
        onClose={() => {
          setIsPreOrderModalOpen(false);
          setEditingPreOrder(null);
        }}
        activeSeller={activeSeller}
        onSave={handleSavePreOrder}
        editingOrder={editingPreOrder}
        existingCustomers={duesData.map(d => ({ name: d.name, phone: d.phone }))}
      />

      {/* ================= MODAL: SHOP QUICK CALCULATOR ================= */}
      <ShopCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* ================= MODAL: MULTI-ITEM POS CART ================= */}
      <PosCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        inventory={inventory}
        onAddToCart={handleAddToCart}
        existingCustomers={duesData}
        activeSeller={activeSeller}
        onCheckout={handleCartCheckout}
        onOpenCashMemoStudio={() => setIsCashMemoStudioOpen(true)}
      />

      {/* ================= MODAL: PRO CASH MEMO & CUSTOM INVOICE STUDIO ================= */}
      <CashMemoStudioModal
        isOpen={isCashMemoStudioOpen}
        onClose={() => setIsCashMemoStudioOpen(false)}
        inventory={inventory}
        salesHistory={salesHistory}
        cart={cart}
        customers={duesData}
        activeSeller={activeSeller}
        onShowToast={showToast}
      />

      {/* ================= MODAL: DAILY BUSINESS PROFIT & SUMMARY ================= */}
      <DailySummaryModal
        isOpen={isDailySummaryOpen}
        onClose={() => setIsDailySummaryOpen(false)}
        sales={salesHistory}
        services={servicesData}
        expenses={shopExpenses}
        dues={duesData}
        supplierDues={supplierDues}
        cashPurchases={cashPurchases}
        activeSeller={activeSeller}
      />

      {/* ================= MODAL: BARCODE & SKU CENTER ================= */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        inventory={inventory}
        onOpenSell={handleOpenSell}
        onAddToCart={handleAddToCart}
        onOpenAddItemWithSku={handleOpenAddItem}
        onDirectSaveItem={handleDirectSaveItem}
        onUpdateItemSku={handleUpdateItemSku}
        onOpenEditItem={handleOpenEditItem}
        isPrivacyMode={isPrivacyMode}
      />

      {/* ================= MODAL: WHATSAPP & SMS MESSAGE HUB ================= */}
      <MessageHubModal
        isOpen={isMessageHubOpen}
        onClose={() => setIsMessageHubOpen(false)}
        customers={duesData}
        onOpenQrCode={handleOpenCustomerQr}
      />

      {/* ================= MODAL: CUSTOMER WHATSAPP & CONTACT QR ================= */}
      <CustomerQrModal
        isOpen={isCustomerQrOpen}
        onClose={() => setIsCustomerQrOpen(false)}
        initialCustomerName={qrCustomerData.name}
        initialPhone={qrCustomerData.phone}
        initialDue={qrCustomerData.due}
      />

      {/* ================= MOBILE TOOLS DRAWER (BOTTOM SHEET) ================= */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isPrivacyMode={isPrivacyMode}
        togglePrivacyMode={togglePrivacyMode}
        activeSeller={activeSeller}
        sellers={sellers}
        onSellerChange={handleSellerChange}
        onOpenAddItem={handleOpenAddItem}
        onOpenAddDue={() => {
          setDuePreselectedCustomer(null);
          setIsAddDueModalOpen(true);
        }}
        onOpenCart={() => setIsCartModalOpen(true)}
        cartCount={cart.length}
        onOpenCashMemoStudio={() => setIsCashMemoStudioOpen(true)}
        onOpenDailySummary={() => setIsDailySummaryOpen(true)}
        onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
        onOpenSupplierLedger={() => setIsSupplierModalOpen(true)}
        onOpenProfitCalc={() => setIsProfitCalcOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenBarcode={() => setIsBarcodeModalOpen(true)}
        onOpenMessageHub={() => setIsMessageHubOpen(true)}
        onOpenCustomerQr={() => handleOpenCustomerQr('', '', 0)}
        onOpenReorder={() => setIsReorderModalOpen(true)}
        onOpenPreOrders={() => {
          setActiveTab('preorders');
          handleOpenAddPreOrder();
        }}
        preOrdersCount={productPreOrders.filter(o => o.status === 'pending').length}
        onOpenExpense={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenRepair={() => {
          setActiveTab('services');
          setServiceSubTab('repairs');
          handleOpenAddRepairJob();
        }}
        onExportCSVInventory={handleExportCSVInventory}
        onExportCSVSales={handleExportCSVSales}
        onExportCSVDues={handleExportCSVDues}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        userRole={userRole}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        supplierCount={supplierDues.length}
        lowStockCount={stockSummary.lowStockCount}
        mobilePartsCount={mobilePartsCount}
      />

      {/* ================= MODAL: SHOP SETTINGS & SYSTEM CONFIGURATION ================= */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={shopSettings}
        onUpdateSettings={handleUpdateShopSettings}
        sellers={sellers}
        onAddSeller={name => {
          if (!sellers.includes(name)) {
            const updated = [...sellers, name];
            setSellers(updated);
            set(ref(rtdb, 'sellers'), updated);
            showToast(`নতুন অপারেটর '${name}' যোগ করা হয়েছে! ✅`, 'success');
          }
        }}
        onDeleteSeller={name => {
          if (name.toLowerCase() === 'anik') {
            showToast('মেইন অপারেটর রিমুভ করা যাবে না!', 'error');
            return;
          }
          const updated = sellers.filter(s => s !== name);
          setSellers(updated);
          set(ref(rtdb, 'sellers'), updated);
          showToast(`অপারেটর '${name}' সরানো হয়েছে!`, 'info');
        }}
        userRole={userRole}
        isFirebaseConnected={isFirebaseConnected}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportCSVInventory={handleExportCSVInventory}
        onExportCSVSales={handleExportCSVSales}
        onExportCSVDues={handleExportCSVDues}
        onClearRecentSearches={handleClearAllRecentSearches}
        onEnableBrowserNotifications={handleEnableBrowserNotifications}
        isBrowserNotificationEnabled={isBrowserNotificationEnabled}
      />

      {/* ================= LIVE SALE POPUP NOTIFICATION BANNER ================= */}
      {latestSaleAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md w-[calc(100%-2rem)] bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/95 border-2 border-emerald-500/80 text-slate-100 rounded-3xl p-4 shadow-2xl shadow-emerald-950/90 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center flex-shrink-0 animate-bounce shadow-inner">
                <span className="text-xl">💰</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    নতুন বিক্রি সম্পন্ন!
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {latestSaleAlert.time}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 truncate mt-0.5">
                  {latestSaleAlert.name}
                </h4>
                <div className="flex items-center gap-2 text-xs mt-1 text-slate-300">
                  <span>পরিমাণ: <strong className="text-white font-mono">{latestSaleAlert.qty}</strong> টি</span>
                  <span>·</span>
                  <span>অপারেটর: <strong className="text-cyan-400">{latestSaleAlert.seller}</strong></span>
                  {latestSaleAlert.isBaki && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                      বাকি
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="block text-lg sm:text-xl font-black font-mono text-emerald-400">
                ৳{latestSaleAlert.total.toLocaleString()}
              </span>
              <div className="flex items-center justify-end gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => playCashRegisterSound()}
                  title="সাউন্ড আবার বাজান"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLatestSaleAlert(null)}
                  title="নোটিফিকেশন বন্ধ করুন"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION BANNER ================= */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-3.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 backdrop-blur-md ${
            toastMessage.type === 'error'
              ? 'bg-red-950/95 border-red-500 text-red-200 shadow-red-500/30'
              : toastMessage.type === 'info'
              ? 'bg-blue-950/95 border-blue-500 text-blue-200 shadow-blue-500/30'
              : 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-500/30'
          }`}>
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
              toastMessage.type === 'error' ? 'text-red-400' : toastMessage.type === 'info' ? 'text-blue-400' : 'text-emerald-400'
            }`} />
            <p className="text-xs font-bold leading-tight">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* ================= 📱 MODERN MOBILE FLOATING BOTTOM DOCK ================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 px-2 py-1.5 flex justify-between items-center shadow-2xl">
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === 'home'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 font-semibold">হোম</span>
        </button>

        {/* Tab 2: Mobile Parts (আলাদা অপশন: শুধু মোবাইল পার্টস) */}
        <button
          onClick={() => setActiveTab('mobile_parts')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === 'mobile_parts'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className={`w-5 h-5 ${activeTab === 'mobile_parts' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 font-semibold">পার্টস ({mobilePartsCount})</span>
        </button>

        {/* Center Primary Quick Entry Button */}
        <button
          onClick={() => {
            if (activeTab === 'inventory') {
              handleOpenAddItem();
            } else if (activeTab === 'services' && isMainAdmin) {
              if (serviceSubTab === 'expenses') {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              } else if (serviceSubTab === 'digital') {
                handleOpenAddService();
              } else {
                handleOpenAddRepairJob();
              }
            } else if (activeTab === 'dues') {
              setDuePreselectedCustomer(null);
              setIsAddDueModalOpen(true);
            } else if (activeTab === 'preorders') {
              handleOpenAddPreOrder();
            } else {
              handleOpenAddItem();
            }
          }}
          className="w-12 h-12 -mt-6 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/30 border-2 border-slate-950 active:scale-95 transition-all"
          title="নতুন এন্ট্রি যোগ করুন"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Tab 3: All Stock & Inventory */}
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
            activeTab === 'inventory'
              ? 'bg-cyan-500/15 text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className={`w-5 h-5 ${activeTab === 'inventory' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 font-semibold">স্টক ({inventory.length})</span>
        </button>

        {/* Tab 4: Modern Tools & All Pages Drawer Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
            isMobileMenuOpen
              ? 'bg-cyan-500/20 text-cyan-300 font-bold'
              : 'text-cyan-400 hover:text-cyan-300'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">মেনু ও বাকি</span>
        </button>
      </nav>
    </div>
  );
}
