import React, { useState, useEffect, useMemo } from 'react';
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
  UserRole, 
  ReceiptData,
  DueHistoryItem
} from './types';
import { HighlightText, isMatch } from './utils/highlight';
import { toCostCode } from './utils/costCode';
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
import {
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
  Wallet
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
  // Auth & Roles
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('anik_user_role') as UserRole) || 'guest';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [loginError, setLoginError] = useState(false);

  // App State from Firebase
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [servicesData, setServicesData] = useState<ServiceRecord[]>([]);
  const [repairJobs, setRepairJobs] = useState<RepairJob[]>([]);
  const [shopExpenses, setShopExpenses] = useState<ShopExpense[]>([]);
  const [duesData, setDuesData] = useState<CustomerDue[]>([]);
  const [supplierDues, setSupplierDues] = useState<SupplierDue[]>([]);
  const [sellers, setSellers] = useState<string[]>(['MD Anik Hossain']);
  const [activeSeller, setActiveSeller] = useState<string>(() => {
    return localStorage.getItem('gsm_active_seller_v16') || 'MD Anik Hossain';
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // UI Tabs & Views
  const [activeTab, setActiveTab] = useState<'inventory' | 'services' | 'dues' | 'dashboard'>('inventory');
  const [serviceSubTab, setServiceSubTab] = useState<'repairs' | 'digital' | 'expenses'>('repairs');
  const [inventoryViewMode, setInventoryViewMode] = useState<'folders' | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'stock_high' | 'stock_low' | 'price_high' | 'price_low'>('default');

  // Privacy & Buying Price Protection
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('anik_privacy_mode') !== 'false';
  });
  const [revealedCardsMap, setRevealedCardsMap] = useState<Record<string, boolean>>({});
  const [expandedModelsMap, setExpandedModelsMap] = useState<Record<string, boolean>>({});

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    category: '',
    brand: '',
    name: '',
    models: '',
    stock: 0,
    price: 0,
    sellingPrice: 0,
    sku: ''
  });

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState<InventoryItem | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellIsBaki, setSellIsBaki] = useState(false);
  const [sellCustomerName, setSellCustomerName] = useState('');
  const [sellCustomerPhone, setSellCustomerPhone] = useState('');
  const [sellPaidNow, setSellPaidNow] = useState(0);
  const [sellWarranty, setSellWarranty] = useState('কোনো ওয়ারেন্টি নেই');

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    type: 'Recharge/Flexiload',
    desc: '',
    cost: 0,
    paid: 0,
    customerName: '',
    customerPhone: '',
    isBaki: false
  });

  // Repair & Expense & Reorder & Calculator & Cash Drawer & Supplier Modals
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProfitCalcOpen, setIsProfitCalcOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // 1. Firebase Listeners
  useEffect(() => {
    const invRef = ref(rtdb, 'inventory');
    const unsubInv = onValue(invRef, snapshot => {
      setIsFirebaseConnected(true);
      const val = snapshot.val();
      if (val) {
        const list: InventoryItem[] = Object.entries(val).map(([fbKey, itemData]: [string, any]) => ({
          ...(itemData || {}),
          id: itemData?.id || fbKey,
          _fbKey: fbKey
        }));
        setInventory(list);
      } else {
        setInventory([]);
      }
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
        setSalesHistory(list.reverse());
      } else {
        setSalesHistory([]);
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
        setServicesData(list.reverse());
      } else {
        setServicesData([]);
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
        setRepairJobs(list.reverse());
      } else {
        setRepairJobs([]);
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
        setShopExpenses(list.reverse());
      } else {
        setShopExpenses([]);
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
        setDuesData(list.reverse());
      } else {
        setDuesData([]);
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
        setSupplierDues(list.reverse());
      } else {
        setSupplierDues([]);
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

    return () => {
      unsubInv();
      unsubSales();
      unsubServ();
      unsubRepair();
      unsubExpense();
      unsubDues();
      unsubSupp();
      unsubSellers();
    };
  }, []);

  // Save active seller
  const handleSellerChange = (name: string) => {
    setActiveSeller(name);
    localStorage.setItem('gsm_active_seller_v16', name);
  };

  // Auth Handling
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === MAIN_ADMIN_PIN) {
      setUserRole('main_admin');
      localStorage.setItem('anik_user_role', 'main_admin');
      setIsLoginModalOpen(false);
      setEnteredPin('');
      setLoginError(false);
    } else if (enteredPin === SUB_ADMIN_PIN) {
      setUserRole('sub_admin');
      localStorage.setItem('anik_user_role', 'sub_admin');
      setIsLoginModalOpen(false);
      setEnteredPin('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    localStorage.setItem('anik_user_role', 'guest');
  };

  // Privacy & Buying Price Protection:
  const togglePrivacyMode = () => {
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
    set(ref(rtdb, 'supplierDues/' + supplier.id), supplier);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (userRole !== 'main_admin') {
      alert('শুধুমাত্র Main Admin মহাজন প্রোফাইল মুছে ফেলতে পারবেন!');
      return;
    }
    remove(ref(rtdb, 'supplierDues/' + supplierId));
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

  // Filtered Inventory with Smart Model Match, SKU, and Sorting
  const filteredInventory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    let list = inventory.filter(item => {
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
  }, [inventory, searchQuery, filterLowStockOnly, selectedCategory, selectedBrand, stockStatusFilter, sortBy]);

  // Categories & Brands list
  const availableCategories = useMemo(() => {
    return Array.from(new Set([...defaultCategories, ...inventory.map(i => i.category).filter(Boolean)]));
  }, [inventory]);

  const availableBrands = useMemo(() => {
    return Array.from(new Set([...defaultBrands, ...inventory.map(i => i.brand).filter(Boolean)]));
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

    const filteredSales = salesHistory.filter(s => isWithinDays(s.date, timeFilter));
    const filteredServices = servicesData.filter(s => isWithinDays(s.date, timeFilter));
    const filteredExpenses = shopExpenses.filter(e => isWithinDays(e.date, timeFilter));

    filteredSales.forEach(s => {
      const q = s.qty || 1;
      const sell = s.sell || 0;
      const buy = s.buy || 0;
      revenue += q * sell;
      grossProfit += q * (sell - buy);
      soldUnits += q;
    });

    filteredServices.forEach(s => {
      const paid = s.paid || 0;
      const cost = s.cost || 0;
      revenue += paid;
      grossProfit += paid - cost;
      soldUnits += 1;
    });

    filteredExpenses.forEach(e => {
      totalExpenseAmount += e.amount || 0;
    });

    const netTrueProfit = grossProfit - totalExpenseAmount;

    return {
      revenue,
      grossProfit,
      netTrueProfit,
      totalExpenseAmount,
      soldUnits,
      filteredSales,
      filteredServices,
      filteredExpenses
    };
  }, [salesHistory, servicesData, shopExpenses, timeFilter]);

  // Handlers for Repair Jobs & Expenses
  const handleSaveRepairJob = (jobData: Omit<RepairJob, 'id'>) => {
    const jobId = 'repair_' + Date.now();
    const newJob: RepairJob = {
      ...jobData,
      id: jobId
    };
    set(ref(rtdb, 'repairJobs/' + jobId), newJob);

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

  const handleUpdateRepairStatus = (job: RepairJob, newStatus: 'pending' | 'ready' | 'delivered') => {
    update(ref(rtdb, 'repairJobs/' + job.id), { status: newStatus });
    if (newStatus === 'ready' && job.customerPhone) {
      const remainingDue = Math.max(0, job.estimatedCost - job.advancePaid);
      const cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
      let msg = `আসসালামু আলাইকুম ${job.customerName} ভাই,\n`;
      msg += `অনিক টেলিকম থেকে জানানো হচ্ছে আপনার ${job.deviceModel} মোবাইলটির রিপেয়ারিং কাজ সম্পন্ন হয়েছে।\n`;
      if (remainingDue > 0) {
        msg += `আপনার অবশিষ্ট বিল: ৳${remainingDue} টাকা।\n`;
      }
      msg += `অনুগ্রহ করে দোকানে এসে আপনার ফোনটি সংগ্রহ করার অনুরোধ রইল।\nধন্যবাদ - অনিক টেলিকম।`;
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleSaveExpense = (expData: Omit<ShopExpense, 'id'>) => {
    const expId = 'exp_' + Date.now();
    const newExp: ShopExpense = {
      ...expData,
      id: expId
    };
    set(ref(rtdb, 'shopExpenses/' + expId), newExp);
  };

  // Open Edit / Add Item Modal
  const handleOpenAddItem = () => {
    if (userRole !== 'main_admin') {
      alert('শুধুমাত্র Main Admin মালামাল যোগ বা এডিট করতে পারবেন!');
      setIsLoginModalOpen(true);
      return;
    }
    setEditingItem(null);
    setItemFormData({
      category: selectedCategory || '',
      brand: selectedBrand || '',
      name: '',
      models: '',
      stock: 0,
      price: 0,
      sellingPrice: 0,
      sku: ''
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    if (userRole !== 'main_admin') {
      alert('শুধুমাত্র Main Admin মালামাল এডিট করতে পারবেন!');
      setIsLoginModalOpen(true);
      return;
    }
    setEditingItem(item);
    setItemFormData({
      category: item.category || '',
      brand: item.brand || '',
      name: item.name || '',
      models: Array.isArray(item.models) ? item.models.join(', ') : '',
      stock: item.stock || 0,
      price: item.price || 0,
      sellingPrice: item.sellingPrice || 0,
      sku: item.sku || ''
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'main_admin') return;

    const itemId = editingItem ? editingItem.id : 'item_' + Date.now();
    const modelsArr = itemFormData.models
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);

    const newItem: InventoryItem = {
      id: itemId,
      category: itemFormData.category.trim(),
      brand: itemFormData.brand.trim(),
      name: itemFormData.name.trim(),
      models: modelsArr,
      stock: parseInt(String(itemFormData.stock)) || 0,
      price: parseFloat(String(itemFormData.price)) || 0,
      sellingPrice: parseFloat(String(itemFormData.sellingPrice)) || 0,
      sku: itemFormData.sku ? itemFormData.sku.trim() : undefined,
      updatedAt: new Date().toLocaleDateString('en-GB')
    };

    set(ref(rtdb, 'inventory/' + itemId), newItem);
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (userRole !== 'main_admin') {
      alert('অনুমতি নেই!');
      return;
    }
    if (confirm(`'${itemName}' আইটেমটি স্টক থেকে চিরতরে মুছে ফেলতে চান?`)) {
      remove(ref(rtdb, 'inventory/' + itemId));
    }
  };

  // Quick Stock Adjustment (+1, +5)
  const handleQuickStockAdjust = (item: InventoryItem, delta: number) => {
    if (userRole !== 'main_admin') {
      setIsLoginModalOpen(true);
      return;
    }
    const newStock = Math.max(0, (item.stock || 0) + delta);
    update(ref(rtdb, 'inventory/' + item.id), { stock: newStock });
  };

  // Open Sell Modal
  const handleOpenSell = (item: InventoryItem) => {
    if (item.stock <= 0) {
      alert('এই আইটেমটির স্টক খালি (০ পিস)! বিক্রি করা যাবে না।');
      return;
    }
    setSellingItem(item);
    setSellQty(1);
    setSellPrice(item.sellingPrice || 0);
    setSellIsBaki(false);
    setSellCustomerName('');
    setSellCustomerPhone('');
    setSellPaidNow(0);
    setIsSellModalOpen(true);
  };

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem) return;

    const qty = parseInt(String(sellQty)) || 1;
    if (qty > sellingItem.stock) {
      alert(`স্টকের পরিমাণের চেয়ে বেশি বিক্রি করা যাবে না! স্টকে আছে: ${sellingItem.stock} টি।`);
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
      customerName: sellCustomerName.trim() || undefined,
      customerPhone: sellCustomerPhone.trim() || undefined,
      isBaki: sellIsBaki,
      warranty: sellWarranty !== 'কোনো ওয়ারেন্টি নেই' ? sellWarranty : undefined
    };
    set(ref(rtdb, 'salesHistory/' + saleId), saleRecord);

    // 2. Deduct Stock
    update(ref(rtdb, 'inventory/' + sellingItem.id), {
      stock: (sellingItem.stock || 0) - qty
    });

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

        update(ref(rtdb, 'duesData/' + existing.id), {
          totalAmount: updatedTotal,
          paidAmount: updatedPaid,
          history: newHistory,
          updatedAt: todayStr
        });
      } else {
        // Create new customer due record
        const dueId = 'due_' + Date.now();
        const newDueRecord: CustomerDue = {
          id: dueId,
          name: custName,
          phone: custPhone,
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
        set(ref(rtdb, 'duesData/' + dueId), newDueRecord);
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

  // Open Service Modal
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'guest') {
      alert('সার্ভিস এন্ট্রি করার জন্য লগইন করুন!');
      setIsLoginModalOpen(true);
      return;
    }

    const srvId = 'srv_' + Date.now();
    const cost = parseFloat(String(serviceFormData.cost)) || 0;
    const paid = parseFloat(String(serviceFormData.paid)) || 0;
    const todayStr = new Date().toLocaleDateString('en-GB');

    const serviceRecord: ServiceRecord = {
      id: srvId,
      type: serviceFormData.type,
      desc: serviceFormData.desc.trim(),
      cost: cost,
      paid: paid,
      seller: activeSeller,
      date: todayStr,
      customerName: serviceFormData.customerName.trim() || undefined,
      customerPhone: serviceFormData.customerPhone.trim() || undefined
    };

    set(ref(rtdb, 'servicesData/' + srvId), serviceRecord);

    // If customer has due on service
    if (serviceFormData.isBaki && paid < cost) {
      const dueId = 'due_' + Date.now();
      const newDue: CustomerDue = {
        id: dueId,
        name: serviceFormData.customerName.trim() || 'সার্ভিস কাস্টমার',
        phone: serviceFormData.customerPhone.trim(),
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
      set(ref(rtdb, 'duesData/' + dueId), newDue);
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
    setServiceFormData({
      type: 'Recharge/Flexiload',
      desc: '',
      cost: 0,
      paid: 0,
      customerName: '',
      customerPhone: '',
      isBaki: false
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

      update(ref(rtdb, 'duesData/' + existing.id), {
        totalAmount: newTotal,
        paidAmount: newPaid,
        history: updatedHistory,
        updatedAt: todayStr
      });

      alert(`'${existing.name}'-এর হিসাবে সফলভাবে ৳${dueData.amount} বাকি যুক্ত হয়েছে! ✅`);
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
        note: dueData.note,
        totalAmount: dueData.amount,
        paidAmount: dueData.advancePaid || 0,
        seller: activeSeller,
        date: todayStr,
        history: historyList
      };

      set(ref(rtdb, 'duesData/' + dueId), newDue);
      alert(`'${dueData.name}'-এর নতুন বাকির খাতা তৈরি হয়েছে! ✅`);
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

    update(ref(rtdb, 'duesData/' + target.id), {
      paidAmount: newPaidAmount,
      history: updatedHistory,
      updatedAt: todayStr
    });

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
      alert('শুধুমাত্র Main Admin বাকির খাতা ডিলিট করতে পারবেন!');
      return;
    }
    remove(ref(rtdb, 'duesData/' + customerId));
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
      alert('গ্রাহকের মোবাইল নম্বর নেই!');
      return;
    }
    const curDue = Math.max(0, cust.totalAmount - (cust.paidAmount || 0));
    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
    
    let msg = `আসসালামু আলাইকুম ${cust.name} ভাই,\n`;
    msg += `অনিক টেলিকমে আপনার আগের ও বর্তমান বাকি মিলিয়ে মোট বকেয়া রয়েছে ৳${curDue} টাকা।\n`;
    msg += `দয়া করে দোকান বন্ধের আগে বা সুবিধাজনক সময়ে বকেয়া টাকা পরিশোধ করবেন।\n`;
    msg += `ধন্যবাদ - অনিক টেলিকম।`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
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
        alert('ডেটাবেজ সফলভাবে ইমপোর্ট সম্পন্ন হয়েছে! ✅');
      } catch {
        alert('ভুল ফাইল! সঠিক JSON ফাইল আপলোড করুন। ❌');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Anik Telecom
                </h1>
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span>মোবাইল সার্ভিসিং ও পার্টস শপ</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} title={isFirebaseConnected ? 'অনলাইন সিঙ্ক সচল' : 'সিঙ্কিং...'} />
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Actions */}
            <div className="sm:hidden flex items-center gap-1.5">
              <button
                onClick={togglePrivacyMode}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 shadow-sm active:scale-95 transition-all ${
                  isPrivacyMode
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                }`}
                title={isPrivacyMode ? 'কেনা দাম গোপন (Customer Safe)' : 'কেনা দাম দৃশ্যমান (Owner)'}
              >
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-[11px]">{isPrivacyMode ? 'গোপন' : 'উন্মুক্ত'}</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 active:scale-95 transition-all"
                title="কুইক মেনু ও টুলস"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation & Controls (hidden on mobile, cleanly arranged) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Master Buying Price Privacy Toggle (Desktop & Tablet) */}
            <button
              onClick={togglePrivacyMode}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                isPrivacyMode
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
              }`}
              title={isPrivacyMode ? 'কাস্টমার মোড: সকল কেনা দাম গোপন (Privacy ON)' : 'ওনার মোড: কেনা দাম দৃশ্যমান (Owner ON)'}
            >
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPrivacyMode ? '🔒 কেনা দাম গোপন' : '🔓 কেনা দাম উন্মুক্ত'}</span>
            </button>

            {/* Daily Cash Drawer Button */}
            <button
              onClick={() => setIsCashDrawerOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="আজকের ক্যাশ ড্রয়ার ও হিসাব মিলানো"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">ক্যাশ ড্রয়ার</span>
            </button>

            {/* Wholesale Supplier / Mohajon Khata Button */}
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-purple-400 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="পাইকারি মহাজন ও সাপ্লায়ার খাতা"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">মহাজন খাতা</span>
              {supplierDues.length > 0 && (
                <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded-full font-mono">
                  {supplierDues.length}
                </span>
              )}
            </button>

            {/* Quick Profit Calculator */}
            <button
              onClick={() => setIsProfitCalcOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="লাভ ও ডিসকাউন্ট ক্যালকুলেটর"
            >
              <Percent className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">লাভ হিসাব</span>
            </button>

            {/* Active Seller Select */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs">
              <span className="text-[10px] text-slate-500 font-bold mr-1.5">অপারেটর:</span>
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
              {userRole === 'main_admin' && (
                <button
                  onClick={() => setIsSellerModalOpen(true)}
                  className="ml-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors"
                  title="নতুন অপারেটর প্রোফাইল যোগ করুন"
                >
                  +
                </button>
              )}
            </div>

            {/* Quick Calculator Button */}
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              title="দ্রুত ক্যাশ ও ফেরত টাকা ক্যালকুলেটর"
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">ক্যালকুলেটর</span>
            </button>

            {/* Auth Button on Desktop */}
            <div className="hidden sm:block">
              {userRole === 'guest' ? (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Admin Login
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  {userRole === 'main_admin' ? 'Main Admin Logout' : 'Sub Admin Logout'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto mt-3 flex items-center justify-between overflow-x-auto gap-2 border-t border-slate-800/80 pt-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Parts Stock</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 font-mono">
                {inventory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Services & Load</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 font-mono">
                {servicesData.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dues')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'dues'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-amber-300 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>বাকি খাতা (Ledger)</span>
              {duesSummary.debtorCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono font-bold animate-pulse">
                  {duesSummary.debtorCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Accounts & Reports</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto p-4 flex-1 w-full space-y-5">
        
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
                  {/* Master Privacy Toggle for Buy Prices / Valuation */}
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

                  {/* Wholesale Reorder List Button */}
                  {stockSummary.lowStockCount > 0 && (
                    <button
                      onClick={() => setIsReorderModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-all shadow-sm"
                      title="পাইকারি মালামাল ক্রয়ের ফর্দ দেখুন"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>পাইকারি ফর্দ ({stockSummary.lowStockCount})</span>
                    </button>
                  )}

                  {userRole === 'main_admin' && (
                    <button
                      onClick={handleOpenAddItem}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-md active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন মালামাল যোগ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary 4-Column Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
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

                {/* 2. Total Buy Value (Asset Investment) */}
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

                {/* 4. Potential Profit */}
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

            {/* 2. SEARCH BAR & FILTERS (SOLVES BUG 3: Match highlight for models and search query) */}
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="মডেল বা পার্টস খুঁজুন (যেমন: Y17, Y20, A50, Universal, ইত্যাদি)..."
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-white"
                  >
                    ✕ মুছে ফেলুন
                  </button>
                )}
              </div>

              {/* Quick Brand Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => { setSelectedBrand(''); setSelectedCategory(''); }}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    !selectedBrand && !selectedCategory
                      ? 'bg-cyan-500 text-slate-950'
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
                        ? 'bg-cyan-500 text-slate-950'
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
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Category Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-xl px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                  >
                    <option value="">সব ক্যাটাগরি</option>
                    {availableCategories.map((c, idx) => (
                      <option key={`cat_opt_${c}_${idx}`} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                    ))}
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

                                {/* Buy Price with Privacy Protection & Secret Cipher Code */}
                                {(() => {
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

                              {/* Quick +1, +5 for Admin */}
                              {userRole === 'main_admin' && (
                                <div className="flex gap-1 mt-1 justify-center">
                                  <button
                                    onClick={() => handleQuickStockAdjust(item, 1)}
                                    title="+১ পিস যোগ"
                                    className="text-[9px] bg-slate-800 hover:bg-slate-700 text-cyan-400 px-1 py-0.5 rounded font-mono font-bold"
                                  >
                                    +1
                                  </button>
                                  <button
                                    onClick={() => handleQuickStockAdjust(item, 5)}
                                    title="+৫ পিস যোগ"
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
                                    <span
                                      key={`model_${uniqueItemKey}_${m}_${mIdx}`}
                                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                                        thisMatches
                                          ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 ring-2 ring-amber-400/40 shadow-lg scale-105'
                                          : 'bg-slate-900 border border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <HighlightText text={m} query={searchQuery} />
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <div className="flex gap-1.5">
                            {userRole === 'main_admin' && (
                              <>
                                <button
                                  onClick={() => handleOpenEditItem(item)}
                                  className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-xl transition-colors"
                                  title="এডিট করুন"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="p-2 bg-slate-800/80 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenSell(item)}
                            disabled={isOutStock}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
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
                  onClick={() => setIsRepairModalOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ফোন জমা / জব কার্ড</span>
                </button>
              )}

              {serviceSubTab === 'digital' && (
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-50 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন সার্ভিস / রিচার্জ লগ</span>
                </button>
              )}

              {serviceSubTab === 'expenses' && (
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
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
                      onClick={() => setIsRepairModalOpen(true)}
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

                          {/* Status Changing Bar */}
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
                            </div>

                            <div className="flex items-center gap-1">
                              {job.customerPhone && (
                                <button
                                  onClick={() => {
                                    const cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
                                    const intlPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
                                    let msg = `আসসালামু আলাইকুম ${job.customerName} ভাই,\n`;
                                    msg += `অনিক টেলিকমে আপনার ${job.deviceModel} ফোনের কাজের বর্তমান আপডেট:\n`;
                                    msg += `স্ট্যাটাস: ${isReady ? 'কাজ সম্পন্ন হয়েছে, এসে নিয়ে যান' : 'কাজ চলছে'}।\n`;
                                    msg += `মোট খরচ: ৳${job.estimatedCost} | অগ্রিম: ৳${job.advancePaid} | বকেয়া: ৳${remainingDue}।\n`;
                                    msg += `ধন্যবাদ - অনিক টেলিকম।`;
                                    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="p-1 text-emerald-400 hover:bg-emerald-950/60 rounded border border-emerald-900/40"
                                  title="WhatsApp বার্তা"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {s.date}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                              অপারেটর: {s.seller || 'Admin'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100">{s.desc}</h4>
                          <span className="text-[10px] bg-blue-950/50 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50 font-semibold uppercase tracking-wider inline-block">
                            {s.type}
                          </span>
                        </div>

                        <div className="text-right flex sm:flex-col justify-between sm:justify-end w-full sm:w-auto items-center sm:items-end border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                          <span className="text-base font-black font-mono text-emerald-400">
                            + ৳{s.paid}
                          </span>
                          {userRole === 'main_admin' && (
                            <div className="text-[11px] text-slate-400">
                              খরচ: ৳{s.cost} | লাভ: <span className="font-bold text-blue-400">৳{profit}</span>
                            </div>
                          )}
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
                    onClick={() => setIsExpenseModalOpen(true)}
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
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{exp.category}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{exp.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{exp.note}</p>
                        </div>
                        <span className="text-base font-black font-mono text-red-400">
                          - ৳{exp.amount}
                        </span>
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

                          {/* Quick Action Buttons (SOLVES BUG 2) */}
                          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                            {/* 1. Add More Due Directly To This Customer */}
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

                            {/* 5. Print Slip */}
                            <button
                              onClick={() => handlePrintStatement(cust)}
                              className="p-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900 rounded-xl transition-colors"
                              title="স্টেটমেন্ট বা রসিদ"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Recent History Preview */}
                      {cust.history && cust.history.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                            <span>সাম্প্রতিক লেনদেনের রেকর্ড:</span>
                            <button
                              onClick={() => setViewingLedgerCustomer(cust)}
                              className="text-cyan-400 hover:underline lowercase font-normal"
                            >
                              সব দেখুন ({cust.history.length})
                            </button>
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
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      পার্টস ও সার্ভিস মিলিয়ে সংগৃহীত টাকা
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
                      ক্রয়মূল্য ও সার্ভিস খরচ বাদে অর্জিত লাভ
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
      </main>

      {/* ================= MODAL: LOGIN ================= */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100">Anik Telecom Control Panel</h2>
              <p className="text-xs text-slate-400 mt-1">
                লগইন করতে আপনার এডমিন PIN লিখুন
              </p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input
                type="password"
                value={enteredPin}
                onChange={e => {
                  setEnteredPin(e.target.value);
                  setLoginError(false);
                }}
                placeholder="Enter PIN"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-500 font-mono font-bold"
                required
                autoFocus
              />
              {loginError && (
                <div className="text-xs text-red-400 font-semibold">
                  ভুল PIN! অনুগ্রহ করে আবার চেষ্টা করুন।
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg text-sm"
              >
                Login System
              </button>
            </form>
            <div className="pt-1">
              <button
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setEnteredPin('');
                  setLoginError(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT ITEM ================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>{editingItem ? 'মালামাল এডিট করুন' : 'নতুন মালামাল ও পার্টস যোগ'}</span>
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5">
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
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">প্রোডাক্ট কোড / SKU (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={itemFormData.sku}
                  onChange={e => setItemFormData({ ...itemFormData, sku: e.target.value })}
                  placeholder="যেমন: AT-DISP-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.stock}
                    onChange={e => setItemFormData({ ...itemFormData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">ক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.price}
                    onChange={e => setItemFormData({ ...itemFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemFormData.sellingPrice}
                    onChange={e => setItemFormData({ ...itemFormData, sellingPrice: parseFloat(e.target.value) || 0 })}
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
                    value={sellQty}
                    onChange={e => setSellQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">প্রতি পিস মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={sellPrice}
                    onChange={e => setSellPrice(parseFloat(e.target.value) || 0)}
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
                  ৳ {(sellQty * sellPrice).toLocaleString()}
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
                        max={sellQty * sellPrice}
                        value={sellPaidNow}
                        onChange={e => setSellPaidNow(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold font-mono"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-slate-400">অবশিষ্ট বাকি থাকবে:</span>
                      <span className="font-mono font-bold text-red-400">
                        ৳ {Math.max(0, (sellQty * sellPrice) - sellPaidNow).toLocaleString()}
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

      {/* ================= MODAL: NEW SERVICE ================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                <span>নতুন সার্ভিসিং ও ডিজিটাল রিচার্জ</span>
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveService} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">সার্ভিস টাইপ</label>
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
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">বিবরণ / কাস্টমার তথ্য</label>
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
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">দোকানের নিজস্ব খরচ (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceFormData.cost}
                    onChange={e => setServiceFormData({ ...serviceFormData, cost: parseFloat(e.target.value) || 0 })}
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
                    value={serviceFormData.paid}
                    onChange={e => setServiceFormData({ ...serviceFormData, paid: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-50 font-black py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95"
                >
                  সার্ভিস রেকর্ড সেভ করুন
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
        onDeleteCustomer={handleDeleteDueCustomer}
        isAdmin={userRole === 'main_admin'}
      />

      {/* ================= MODAL: CASH MEMO / RECEIPT ================= */}
      <ReceiptModal
        receipt={receiptData}
        onClose={() => setReceiptData(null)}
      />

      {/* ================= MODAL: CASH DRAWER RECONCILIATION ================= */}
      <CashDrawerModal
        isOpen={isCashDrawerOpen}
        onClose={() => setIsCashDrawerOpen(false)}
        sales={salesHistory}
        services={servicesData}
        expenses={shopExpenses}
        dues={duesData}
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
    </div>
  );
}
