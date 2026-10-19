import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  Boxes,
  History,
  Palette,
  Building2,
  User,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Phone,
  Globe,
  MapPin,
  Hexagon,
  FolderOpen
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { InventoryItem, SaleRecord, CustomerDue } from '../types';
import { CartItem } from './PosCartModal';

export interface MemoLineItem {
  id: string;
  title: string;
  subtitle: string;
  unitPrice: number;
  qty: number;
}

export interface MemoCompanyProfile {
  companyName: string;
  tagline: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  paymentAccountNo: string;
  paymentPayName: string;
  paymentAddress: string;
  termsText: string;
  signatureText: string;
  signatureLabel: string;
  footerGreeting: string;
  currencySymbol: string;
  themeColor: string;
  invoiceTitle: string;
  showDecimals: boolean;
}

export interface SavedMemoDocument {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPosition: string;
  customerAddress: string;
  customerPhone: string;
  customerCustomNote: string;
  items: MemoLineItem[];
  discount: number;
  tax: number;
  paidAmount: number;
  showPaidDue: boolean;
  themeColor: string;
  createdAt: string;
}

const DEFAULT_COMPANY_PROFILE: MemoCompanyProfile = {
  companyName: 'ANIK TELECOM',
  tagline: 'GSM Mobile Parts, Display & Servicing Center',
  phone1: '(+880) 1700-000000',
  phone2: '(+880) 1800-000000',
  email: 'aniktelecom@gmail.com',
  website: 'www.aniktelecom.com',
  addressLine1: 'Main Road, Mobile Market',
  addressLine2: 'Bangladesh',
  paymentAccountNo: 'bKash / Nagad: 017XXXXXXXX',
  paymentPayName: 'MD ANIK HOSSAIN',
  paymentAddress: 'Cash / Mobile Banking / Bank Transfer',
  termsText:
    '১. বিক্রিত মালামাল ৭ দিনের মধ্যে উপযুক্ত কারণে পরিবর্তনযোগ্য।\n২. ডিসপ্লে ফিটিং বা সল্ডারিং করার পর কোনো ওয়ারেন্টি প্রযোজ্য নয়।\n৩. ক্যাশ মেমো ছাড়া কোনো অভিযোগ গ্রহণযোগ্য নয়।',
  signatureText: 'Anik Hossain',
  signatureLabel: 'Company Signature',
  footerGreeting: 'Thank You For Your Business!',
  currencySymbol: '৳',
  themeColor: '#f59e0b',
  invoiceTitle: 'INVOICE',
  showDecimals: true
};

const PRESET_COLORS = [
  { name: 'Classic Amber (Default)', hex: '#f59e0b' },
  { name: 'Vibrant Orange', hex: '#ea580c' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Cyan Teal', hex: '#0891b2' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Crimson Red', hex: '#e11d48' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Executive Gold', hex: '#ca8a04' }
];

interface CashMemoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  salesHistory: SaleRecord[];
  cart: CartItem[];
  customers: CustomerDue[];
  activeSeller: string;
  onShowToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const CashMemoStudioModal: React.FC<CashMemoStudioModalProps> = ({
  isOpen,
  onClose,
  inventory,
  salesHistory,
  cart,
  customers,
  onShowToast
}) => {
  // 1. Persistent Company Profile
  const [company, setCompany] = useState<MemoCompanyProfile>(() => {
    try {
      const raw = localStorage.getItem('anik_pos_memo_company_v1');
      if (raw) {
        return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(raw) };
      }
    } catch {}
    return DEFAULT_COMPANY_PROFILE;
  });

  // 2. Saved Memos List
  const [savedMemos, setSavedMemos] = useState<SavedMemoDocument[]>(() => {
    try {
      const raw = localStorage.getItem('anik_pos_saved_memos_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // 3. Current Memo State
  const [invoiceNo, setInvoiceNo] = useState<string>(() => {
    return `# ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  });

  // Customer fields
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPosition, setCustomerPosition] = useState<string>('Valued Customer / Retail Client');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerCustomNote, setCustomerCustomNote] = useState<string>('');

  // Line items
  const [items, setItems] = useState<MemoLineItem[]>([
    {
      id: 'item_1',
      title: 'DISPLAY REPLACEMENT / MOBILE PARTS',
      subtitle: 'Original Quality Crown Display & Fitting',
      unitPrice: 2000,
      qty: 1
    }
  ]);

  // Totals & adjustments
  const [discount, setDiscount] = useState<string>('0');
  const [tax, setTax] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [showPaidDue, setShowPaidDue] = useState<boolean>(false);

  // Studio Control Tabs
  const [controlTab, setControlTab] = useState<
    'items' | 'database' | 'history' | 'customer' | 'company' | 'saved'
  >('items');

  // Search states for Database & Sales History pickers
  const [dbSearch, setDbSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Auto-save company profile when updated
  useEffect(() => {
    try {
      localStorage.setItem('anik_pos_memo_company_v1', JSON.stringify(company));
    } catch {}
  }, [company]);

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onShowToast) onShowToast(msg, type);
  };

  // Calculations
  const calculations = useMemo(() => {
    const subTotal = items.reduce((acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0), 0);
    const discVal = parseFloat(discount) || 0;
    const taxVal = parseFloat(tax) || 0;
    const grandTotal = Math.max(0, subTotal - discVal + taxVal);
    const paidVal = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;
    const totalDue = showPaidDue ? Math.max(0, grandTotal - paidVal) : grandTotal;

    return {
      subTotal,
      discVal,
      taxVal,
      grandTotal,
      paidVal,
      totalDue
    };
  }, [items, discount, tax, paidAmount, showPaidDue]);

  // Format money helper
  const formatAmount = (num: number) => {
    if (company.showDecimals) {
      return `${company.currencySymbol} ${num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
    return `${company.currencySymbol} ${Math.round(num).toLocaleString('en-US')}`;
  };

  // Filtered Inventory for Database Picker
  const filteredInventory = useMemo(() => {
    const q = dbSearch.toLowerCase().trim();
    if (!q) return inventory.slice(0, 60);
    return inventory
      .filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)) ||
          (Array.isArray(i.models) && i.models.some(m => m.toLowerCase().includes(q)))
      )
      .slice(0, 60);
  }, [inventory, dbSearch]);

  // Filtered Sales History for History Picker
  const filteredSales = useMemo(() => {
    const q = historySearch.toLowerCase().trim();
    if (!q) return salesHistory.slice(0, 60);
    return salesHistory
      .filter(
        s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.customerPhone && s.customerPhone.includes(q)) ||
          (s.date && s.date.includes(q))
      )
      .slice(0, 60);
  }, [salesHistory, historySearch]);

  if (!isOpen) return null;

  // Handlers for Line Items
  const handleAddEmptyItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: 'memo_item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        title: 'NEW ITEM / PART NAME',
        subtitle: 'Product specification or warranty info',
        unitPrice: 0,
        qty: 1
      }
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof MemoLineItem, value: string | number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // 1. Add Single Item from Database Inventory
  const handlePickFromInventory = (inv: InventoryItem) => {
    const modelStr =
      Array.isArray(inv.models) && inv.models.length > 0
        ? `${inv.brand} • Models: ${inv.models.slice(0, 4).join(', ')}`
        : `${inv.brand} • ${inv.category}`;

    const newItem: MemoLineItem = {
      id: 'inv_pick_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: inv.name.toUpperCase(),
      subtitle: modelStr,
      unitPrice: inv.sellingPrice || inv.price || 0,
      qty: 1
    };

    setItems(prev => {
      // If only default placeholder item with 0 or initial state exists, append or replace cleanly
      return [...prev, newItem];
    });
    notify(`'${inv.name}' ক্যাশ মেমোতে যুক্ত হয়েছে! ✅`, 'success');
  };

  // 2. Add Sold Item from Sales History
  const handlePickFromHistory = (sale: SaleRecord, replaceCustomer = false) => {
    const newItem: MemoLineItem = {
      id: 'sale_pick_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: (sale.name || 'SOLD PART').toUpperCase(),
      subtitle: `Sold on ${sale.date}${sale.warranty ? ' • ' + sale.warranty : ''}`,
      unitPrice: sale.sell || 0,
      qty: sale.qty || 1
    };

    setItems(prev => [...prev, newItem]);

    if (replaceCustomer || customerName === 'Walk-in Customer') {
      if (sale.customerName) setCustomerName(sale.customerName);
      if (sale.customerPhone) setCustomerPhone(sale.customerPhone);
    }
    notify(`বিক্রয় হিস্ট্রি থেকে '${sale.name}' মেমোতে নেওয়া হয়েছে! ✅`, 'success');
  };

  // 3. Import All Items from POS Cart
  const handleImportFromCart = () => {
    if (cart.length === 0) {
      notify('বর্তমানে কার্টে কোনো পণ্য নেই! আগে কার্টে পণ্য যোগ করুন অথবা স্টক থেকে পিক করুন।', 'error');
      return;
    }

    const cartMemoItems: MemoLineItem[] = cart.map(ci => ({
      id: 'cart_pick_' + ci.item.id + '_' + Math.random().toString(36).slice(2, 5),
      title: ci.item.name.toUpperCase(),
      subtitle: `${ci.item.brand} • ${ci.item.category}`,
      unitPrice: ci.price || ci.item.sellingPrice || 0,
      qty: ci.qty || 1
    }));

    setItems(cartMemoItems);
    notify(`কার্টের ${cart.length} টি আইটেম সরাসরি ক্যাশ মেমোতে বসানো হয়েছে! 🛒`, 'success');
  };

  // Save Company Profile Explicitly
  const handleSaveCompanyProfile = () => {
    try {
      localStorage.setItem('anik_pos_memo_company_v1', JSON.stringify(company));
      notify('কোম্পানির নাম, ঠিকানা ও মেমো সেটিংস স্থায়ীভাবে সেভ করা হয়েছে! 💾', 'success');
    } catch {
      notify('সেভ করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Save Current Memo to Saved Memos History
  const handleSaveMemoDocument = () => {
    const newDoc: SavedMemoDocument = {
      id: 'memo_doc_' + Date.now(),
      invoiceNo,
      date: invoiceDate,
      customerName,
      customerPosition,
      customerAddress,
      customerPhone,
      customerCustomNote,
      items,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      showPaidDue,
      themeColor: company.themeColor,
      createdAt: new Date().toLocaleString('en-GB')
    };

    const updated = [newDoc, ...savedMemos.slice(0, 49)];
    setSavedMemos(updated);
    try {
      localStorage.setItem('anik_pos_saved_memos_v1', JSON.stringify(updated));
    } catch {}
    notify(`ক্যাশ মেমো (${invoiceNo}) সফলভাবে সেভ করা হয়েছে! ✅`, 'success');
  };

  const handleLoadSavedMemo = (doc: SavedMemoDocument) => {
    setInvoiceNo(doc.invoiceNo);
    setInvoiceDate(doc.date);
    setCustomerName(doc.customerName);
    setCustomerPosition(doc.customerPosition);
    setCustomerAddress(doc.customerAddress);
    setCustomerPhone(doc.customerPhone);
    setCustomerCustomNote(doc.customerCustomNote || '');
    setItems(doc.items);
    setDiscount(String(doc.discount || 0));
    setTax(String(doc.tax || 0));
    setPaidAmount(doc.paidAmount ? String(doc.paidAmount) : '');
    setShowPaidDue(Boolean(doc.showPaidDue));
    if (doc.themeColor) {
      setCompany(prev => ({ ...prev, themeColor: doc.themeColor }));
    }
    notify(`মেমো ${doc.invoiceNo} লোড করা হয়েছে!`, 'info');
  };

  const handleDeleteSavedMemo = (id: string) => {
    const updated = savedMemos.filter(m => m.id !== id);
    setSavedMemos(updated);
    try {
      localStorage.setItem('anik_pos_saved_memos_v1', JSON.stringify(updated));
    } catch {}
    notify('সেভ করা মেমো মুছে ফেলা হয়েছে', 'info');
  };

  // Download as High-Res PNG Image
  const handleDownloadPNG = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `Cash_Memo_${customerName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      notify('ক্যাশ মেমো PNG ইমেজ হিসেবে ডাউনলোড হয়েছে! 🖼️', 'success');
    } catch (err) {
      console.error('PNG export error:', err);
      notify('ইমেজ ডাউনলোড করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Download as A4 PDF
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      notify('ক্যাশ মেমো PDF ফাইল হিসেবে ডাউনলোড হয়েছে! 📄', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      notify('PDF ডাউনলোড করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Print
  const handlePrintMemo = () => {
    window.print();
  };

  const accent = company.themeColor || '#f59e0b';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Dedicated Print Style so window.print() prints ONLY the exact A4 Invoice in full color */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pro-invoice, #printable-pro-invoice * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-pro-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>

      {/* ================= TOP STUDIO COMMAND BAR ================= */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg"
            style={{ backgroundColor: accent }}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white">
                🧾 প্রো ক্যাশ মেমো ও ইনভয়েস স্টুডিও (Custom Cash Memo Designer)
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Full Control • Print • PDF • PNG
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              কোম্পানির নাম, কাস্টমার, মেমো কালার, স্টক/হিস্ট্রি/কার্ট থেকে আইটেম পিক এবং ডাউনলোড ও প্রিন্ট কন্ট্রোল
            </p>
          </div>
        </div>

        {/* Action Buttons: Cart Import, Save Memo, PNG, PDF, Print, Close */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImportFromCart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
            title="কার্টের সব পণ্য মেমোতে আনুন"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>কার্ট থেকে আনুন ({cart.length})</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMemoDocument}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            title="এই মেমোটি সেভ করে রাখুন"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>মেমো সেভ</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isExporting ? 'প্রসেসিং...' : 'PNG ডাউনলোড'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'প্রসেসিং...' : 'PDF ডাউনলোড'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintMemo}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ================= MAIN WORKSPACE: LEFT EDITOR + RIGHT LIVE INVOICE PREVIEW ================= */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
        {/* LEFT 5 COLS: FULL CONTROL PANEL */}
        <div className="lg:col-span-5 border-r border-slate-800 flex flex-col lg:h-full lg:overflow-hidden bg-slate-900/70 print:hidden">
          {/* Navigation Tabs for Controls */}
          <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 grid grid-cols-3 sm:grid-cols-6 gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setControlTab('items')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                controlTab === 'items'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <Plus className="w-3.5 h-3.5 mb-0.5" />
              <span>মেমো আইটেম ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab('database')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                controlTab === 'database'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 mb-0.5" />
              <span>স্টক থেকে পিক</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab('history')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                controlTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <History className="w-3.5 h-3.5 mb-0.5" />
              <span>সেল হিস্ট্রি পিক</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab('customer')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                controlTab === 'customer'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <User className="w-3.5 h-3.5 mb-0.5" />
              <span>কাস্টমার ও কালার</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab('company')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                controlTab === 'company'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 mb-0.5" />
              <span>কোম্পানি তথ্য সেভ</span>
            </button>

            <button
              type="button"
              onClick={() => setControlTab('saved')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                controlTab === 'saved'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 mb-0.5" />
              <span>সেভড মেমো ({savedMemos.length})</span>
            </button>
          </div>

          {/* Scrollable Tab Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* ================= TAB 1: MEMO ITEMS & TOTALS CONTROL ================= */}
            {controlTab === 'items' && (
              <div className="space-y-4">
                {/* Quick Pick Bar */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300">দ্রুত মালামাল যোগ করুন:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddEmptyItem}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন লাইন</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setControlTab('database')}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>ডাটাবেস থেকে পিক</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setControlTab('history')}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>সেল হিস্ট্রি থেকে পিক</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleImportFromCart}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>কার্ট ({cart.length})</span>
                    </button>
                  </div>
                </div>

                {/* Items List Editor */}
                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          SL #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            মোট: {formatAmount((Number(item.unitPrice) || 0) * (Number(item.qty) || 0))}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded-lg bg-red-950/50 hover:bg-red-900/70 text-red-400 transition-colors"
                            title="আইটেমটি মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            পণ্য বা সার্ভিসের নাম (Item Title)
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => handleUpdateItem(item.id, 'title', e.target.value)}
                            placeholder="যেমন: VIVO Y20 DISPLAY"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            বিবরণ / মডেল / ওয়ারেন্টি (Subtitle)
                          </label>
                          <input
                            type="text"
                            value={item.subtitle}
                            onChange={e => handleUpdateItem(item.id, 'subtitle', e.target.value)}
                            placeholder="যেমন: Original Crown Quality • 1 Month Service"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            একক মূল্য (Unit Price)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={e => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            পরিমাণ (Quantity)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={e => handleUpdateItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-400">
                      মেমোতে কোনো আইটেম নেই। স্টক, হিস্ট্রি, কার্ট বা "+ নতুন লাইন" থেকে যোগ করুন।
                    </div>
                  )}
                </div>

                {/* Totals, Discount, Tax & Paid/Due Controls */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                    💰 ছাড়, ট্যাক্স এবং জমা/বাকি নিয়ন্ত্রণ
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ছাড় / Discount (-)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ট্যাক্স / সার্ভিস চার্জ (TAX +)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={tax}
                        onChange={e => setTax(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-800/80 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-semibold">
                      <input
                        type="checkbox"
                        checked={showPaidDue}
                        onChange={e => setShowPaidDue(e.target.checked)}
                        className="rounded w-4 h-4"
                      />
                      <span>মেমোতে নগদ জমা (Paid) এবং বকেয়া বাকি (Due) আলাদাভাবে দেখান</span>
                    </label>

                    {showPaidDue && (
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">
                          কাস্টমার নগদ কত জমা দিয়েছেন? (Paid Amount)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={paidAmount}
                          onChange={e => setPaidAmount(e.target.value)}
                          placeholder={String(calculations.grandTotal)}
                          className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: DATABASE STOCK ITEM PICKER ================= */}
            {controlTab === 'database' && (
              <div className="space-y-3">
                <div className="bg-cyan-950/25 border border-cyan-500/30 rounded-2xl p-3 text-xs text-cyan-200">
                  📦 <strong>ডাটাবেস থেকে আইটেম পিক করুন:</strong> নিচের তালিকা থেকে যেকোনো মালামালের পাশে{' '}
                  <strong>"+ মেমোতে যোগ"</strong> বাটনে ক্লিক করলেই সেটি মেমোতে যুক্ত হয়ে যাবে।
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dbSearch}
                    onChange={e => setDbSearch(e.target.value)}
                    placeholder="স্টকের নাম, মডেল, ব্র্যান্ড বা বারকোড দিয়ে খুঁজুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                  {filteredInventory.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">কোনো মালামাল পাওয়া যায়নি।</div>
                  ) : (
                    filteredInventory.map(inv => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-2 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">{inv.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {inv.brand} • {inv.category} • স্টক: {inv.stock} পিস
                          </div>
                          <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                            বিক্রয় দর: ৳ {inv.sellingPrice || inv.price || 0}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickFromInventory(inv)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex-shrink-0 flex items-center gap-1 shadow active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>মেমোতে যোগ</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 3: SALES HISTORY PICKER ================= */}
            {controlTab === 'history' && (
              <div className="space-y-3">
                <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-200">
                  📜 <strong>সেল করা হিস্ট্রি থেকে পিক করুন:</strong> আগে বিক্রি করা যেকোনো আইটেম এক ক্লিকে ক্যাশ মেমোতে যোগ করুন।
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="বিক্রিত মালের নাম, কাস্টমার বা তারিখ দিয়ে খুঁজুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                  {filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">কোনো বিক্রয় হিস্ট্রি পাওয়া যায়নি।</div>
                  ) : (
                    filteredSales.map((sale, idx) => (
                      <div
                        key={sale.id || idx}
                        className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-2 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">
                            {sale.name} <span className="text-cyan-400 font-mono">x{sale.qty || 1}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            তারিখ: {sale.date}
                            {sale.customerName ? ` • গ্রাহক: ${sale.customerName}` : ''}
                            {sale.customerPhone ? ` (${sale.customerPhone})` : ''}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                            বিক্রয় দর: ৳ {sale.sell} (মোট: ৳ {(sale.qty || 1) * (sale.sell || 0)})
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePickFromHistory(sale, false)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 shadow active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                            <span>মেমোতে নিন</span>
                          </button>
                          {sale.customerName && (
                            <button
                              type="button"
                              onClick={() => handlePickFromHistory(sale, true)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[9px] font-semibold"
                            >
                              + কাস্টমারসহ নিন
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 4: CUSTOMER, INVOICE META & COLOR THEME ================= */}
            {controlTab === 'customer' && (
              <div className="space-y-4">
                {/* Theme Color Picker */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <span>মেমো থিম কালার (Memo Color)</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">{company.themeColor}</span>
                      <input
                        type="color"
                        value={company.themeColor}
                        onChange={e => setCompany({ ...company, themeColor: e.target.value })}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-700 bg-transparent"
                        title="পছন্দের যেকোনো কালার বেছে নিন"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCompany({ ...company, themeColor: c.hex })}
                        className={`p-2 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                          company.themeColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'border-white bg-slate-800 text-white shadow-md scale-[1.02]'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate">{c.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invoice Number, Date & Title */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
                    🧾 ইনভয়েস নাম্বার, তারিখ ও হেডার টাইটেল
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">মেমো টাইটেল</label>
                      <input
                        type="text"
                        value={company.invoiceTitle}
                        onChange={e => setCompany({ ...company, invoiceTitle: e.target.value })}
                        placeholder="INVOICE / CASH MEMO"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>ইনভয়েস নং (Invoice No)</span>
                        <button
                          type="button"
                          onClick={() =>
                            setInvoiceNo(
                              `# ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`
                            )
                          }
                          className="text-cyan-400 hover:underline text-[9px]"
                        >
                          অটো নং
                        </button>
                      </label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={e => setInvoiceNo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">তারিখ (Date)</label>
                      <input
                        type="text"
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                        placeholder="05 October 2026"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={company.showDecimals}
                        onChange={e => setCompany({ ...company, showDecimals: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                      <span>টাকার পরিমাণে দশমিক (.00) দেখান</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">কারেন্সি চিহ্ন:</span>
                      <select
                        value={company.currencySymbol}
                        onChange={e => setCompany({ ...company, currencySymbol: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-amber-400"
                      >
                        <option value="৳">৳ (টাকা)</option>
                        <option value="$">$ (Dollar)</option>
                        <option value="TK">TK</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Details Control */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-200">👤 কাস্টমারের তথ্য (Invoice To)</h4>
                    {customers.length > 0 && (
                      <select
                        onChange={e => {
                          const c = customers.find(cu => cu.id === e.target.value);
                          if (c) {
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone || '');
                            setCustomerPosition(c.note || 'Regular Customer');
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-cyan-300"
                      >
                        <option value="" disabled>
                          -- সেভ করা কাস্টমার সিলেক্ট --
                        </option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone || 'No Phone'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">কাস্টমার / প্রতিষ্ঠানের নাম</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="যেমন: ABC Company / করিম ভাই"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">পদবী / মোবাইল মডেল / পরিচয়</label>
                      <input
                        type="text"
                        value={customerPosition}
                        onChange={e => setCustomerPosition(e.target.value)}
                        placeholder="যেমন: Vivo Y20 Customer / প্রোপাইটর"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">কাস্টমারের ঠিকানা (Address)</label>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={e => setCustomerAddress(e.target.value)}
                        placeholder="যেমন: মিরপুর-১০, ঢাকা"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">কাস্টমারের মোবাইল নাম্বার</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="যেমন: 017XXXXXXXX"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-amber-400 font-semibold mb-1">
                      কাস্টমারের অতিরিক্ত নোট / IMEI / বিশেষ তথ্য (মেমোতে যুক্ত হবে)
                    </label>
                    <input
                      type="text"
                      value={customerCustomNote}
                      onChange={e => setCustomerCustomNote(e.target.value)}
                      placeholder="যেমন: IMEI: 35890123456 • ডেলিভারি: হাতে হাতে"
                      className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 5: OUR COMPANY INFO & PERMANENT SAVE ================= */}
            {controlTab === 'company' && (
              <div className="space-y-4">
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-blue-200">
                    🏢 <strong>আমাদের কোম্পানির তথ্য:</strong> এখানে আপনার দোকানের নাম, ঠিকানা ও নাম্বার লিখে সেভ করলে সবসময় মেমোতে অটোমেটিক থাকবে।
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCompanyProfile}
                    className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs flex-shrink-0 flex items-center gap-1 shadow-lg active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>সেভ করুন</span>
                  </button>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">কোম্পানি / দোকানের নাম (LOGO NAME)</label>
                      <input
                        type="text"
                        value={company.companyName}
                        onChange={e => setCompany({ ...company, companyName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ট্যাগলাইন / স্লোগান (Tagline)</label>
                      <input
                        type="text"
                        value={company.tagline}
                        onChange={e => setCompany({ ...company, tagline: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">মোবাইল নাম্বার ১</label>
                      <input
                        type="text"
                        value={company.phone1}
                        onChange={e => setCompany({ ...company, phone1: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">মোবাইল নাম্বার ২</label>
                      <input
                        type="text"
                        value={company.phone2}
                        onChange={e => setCompany({ ...company, phone2: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ইমেইল (Email)</label>
                      <input
                        type="text"
                        value={company.email}
                        onChange={e => setCompany({ ...company, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">ওয়েবসাইট / ফেসবুক পেজ</label>
                      <input
                        type="text"
                        value={company.website}
                        onChange={e => setCompany({ ...company, website: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">দোকানের ঠিকানা (লাইন ১)</label>
                      <input
                        type="text"
                        value={company.addressLine1}
                        onChange={e => setCompany({ ...company, addressLine1: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">দোকানের ঠিকানা (লাইন ২)</label>
                      <input
                        type="text"
                        value={company.addressLine2}
                        onChange={e => setCompany({ ...company, addressLine2: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Payment Account / bKash</label>
                      <input
                        type="text"
                        value={company.paymentAccountNo}
                        onChange={e => setCompany({ ...company, paymentAccountNo: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Pay Name (মালিকের নাম)</label>
                      <input
                        type="text"
                        value={company.paymentPayName}
                        onChange={e => setCompany({ ...company, paymentPayName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Payment Method / Note</label>
                      <input
                        type="text"
                        value={company.paymentAddress}
                        onChange={e => setCompany({ ...company, paymentAddress: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      শর্তাবলী ও ওয়ারেন্টি পলিসি (Terms & Conditions)
                    </label>
                    <textarea
                      rows={3}
                      value={company.termsText}
                      onChange={e => setCompany({ ...company, termsText: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">স্বাক্ষর (Signature Name)</label>
                      <input
                        type="text"
                        value={company.signatureText}
                        onChange={e => setCompany({ ...company, signatureText: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">স্বাক্ষর টাইটেল</label>
                      <input
                        type="text"
                        value={company.signatureLabel}
                        onChange={e => setCompany({ ...company, signatureLabel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">নিচের শুভেচ্ছা বার্তা</label>
                      <input
                        type="text"
                        value={company.footerGreeting}
                        onChange={e => setCompany({ ...company, footerGreeting: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCompanyProfile}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>কোম্পানির সব তথ্য ডিফল্ট হিসেবে সেভ করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 6: SAVED MEMOS ARCHIVE ================= */}
            {controlTab === 'saved' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
                  <span className="text-xs font-bold text-slate-200">
                    💾 সেভ করা ক্যাশ মেমোর তালিকা ({savedMemos.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveMemoDocument}
                    className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>বর্তমান মেমো সেভ করুন</span>
                  </button>
                </div>

                {savedMemos.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
                    এখনো কোনো মেমো সেভ করা হয়নি। উপরের "মেমো সেভ" বাটনে ক্লিক করে সেভ করে রাখতে পারেন।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedMemos.map(doc => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-100">
                            {doc.customerName}{' '}
                            <span className="text-amber-400 font-mono text-[11px]">({doc.invoiceNo})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            তারিখ: {doc.date} • আইটেম: {doc.items.length} টি
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadSavedMemo(doc)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold"
                          >
                            ওপেন করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSavedMemo(doc.id)}
                            className="p-1.5 rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900/60"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT 7 COLS: LIVE PROFESSIONAL INVOICE TEMPLATE PREVIEW ================= */}
        <div className="lg:col-span-7 lg:h-full lg:overflow-y-auto p-3 sm:p-6 bg-slate-950 flex flex-col items-center">
          {/* Preview Helper Bar */}
          <div className="w-full max-w-[794px] mb-3 flex flex-wrap items-center justify-between gap-2 px-1 print:hidden">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>লাইভ ক্যাশ মেমো প্রিভিউ (আপনার দেওয়া ডিজাইন অনুযায়ী প্রস্তুত)</span>
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>মোট আইটেম: {items.length} টি</span>
              <span>•</span>
              <span className="text-amber-400 font-bold font-mono">
                সর্বমোট বিল: {formatAmount(calculations.grandTotal)}
              </span>
            </div>
          </div>

          {/* ================= THE ACTUAL INVOICE PAPER (MATCHING UPLOADED TEMPLATE IMAGE) ================= */}
          <div className="w-full overflow-x-auto flex justify-center pb-10">
            <div
              id="printable-pro-invoice"
              ref={invoiceRef}
              className="w-[794px] min-w-[794px] min-h-[1080px] bg-white text-slate-900 shadow-2xl relative flex flex-col justify-between overflow-hidden select-text"
              style={{ fontFamily: "'Inter', 'Hind Siliguri', sans-serif" }}
            >
              {/* TOP SECTION WRAPPER */}
              <div>
                {/* 1. ANGLED GEOMETRIC HEADER BANNER (EXACT MATCH TO IMAGE) */}
                <div className="relative h-[155px] w-full overflow-hidden bg-white">
                  {/* Right Black Angled Background */}
                  <div
                    className="absolute top-0 right-0 w-[62%] h-[132px] bg-[#0b0b0e] flex flex-col justify-center items-end pr-12 z-10"
                    style={{
                      clipPath: 'polygon(22% 0, 100% 0, 100% 100%, 0% 100%)',
                      borderBottom: `4px solid ${accent}`
                    }}
                  >
                    <h1
                      className="text-4xl font-black tracking-wider uppercase leading-none"
                      style={{ color: accent }}
                    >
                      {company.invoiceTitle || 'INVOICE'}
                    </h1>
                    <p className="text-white text-xs font-bold tracking-widest uppercase mt-2 font-mono">
                      INVOICE NO: {invoiceNo}
                    </p>
                  </div>

                  {/* Left Accent Colored Angled Polygon */}
                  <div
                    className="absolute top-0 left-0 w-[60%] h-full flex items-center pl-10 pr-20 z-20"
                    style={{
                      backgroundColor: accent,
                      clipPath: 'polygon(0 0, 92% 0, 66% 100%, 0% 100%)'
                    }}
                  >
                    {/* Subtle Decorative Rotated Squares (from template image) */}
                    <div
                      className="absolute right-24 top-6 w-14 h-14 rounded-lg opacity-20 rotate-12 pointer-events-none"
                      style={{ backgroundColor: '#000000' }}
                    />
                    <div
                      className="absolute right-20 top-9 w-8 h-8 rounded border-2 border-white/40 rotate-12 pointer-events-none"
                    />

                    {/* Brand Logo & Company Name */}
                    <div className="flex items-center gap-3.5 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-[#0b0b0e] text-white flex items-center justify-center shadow-md flex-shrink-0 -rotate-12">
                        <Hexagon className="w-7 h-7 stroke-[2.5]" style={{ color: accent }} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-[#0b0b0e] uppercase leading-none">
                          {company.companyName || 'LOGO NAME'}
                        </h2>
                        <p className="text-white text-xs font-semibold tracking-wide mt-1 drop-shadow-sm">
                          {company.tagline || 'Your Business Tagline Here'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. INVOICE TO & DATE / TOTAL DUE SECTION */}
                <div className="px-12 pt-6 pb-6 flex justify-between items-start">
                  {/* Left: Invoice To */}
                  <div className="space-y-0.5 max-w-[58%]">
                    <p className="text-xs font-semibold text-slate-600">Invoice To:</p>
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {customerName || 'Walk-in Customer'}
                    </h3>
                    {customerPosition && (
                      <p className="text-xs font-medium text-slate-700">{customerPosition}</p>
                    )}
                    {customerAddress && (
                      <p className="text-xs text-slate-600 leading-relaxed">{customerAddress}</p>
                    )}
                    {customerPhone && (
                      <p className="text-xs font-semibold text-slate-800 pt-0.5">
                        Phone: <span className="font-mono">{customerPhone}</span>
                      </p>
                    )}
                    {customerCustomNote && (
                      <p
                        className="text-xs font-bold pt-1"
                        style={{ color: accent }}
                      >
                        {customerCustomNote}
                      </p>
                    )}
                  </div>

                  {/* Right: Date & Total Due */}
                  <div className="text-left min-w-[185px] space-y-3">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-900 tracking-wide">
                        DATE:
                      </p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {invoiceDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-900 tracking-wide">
                        {showPaidDue ? 'TOTAL DUE' : 'TOTAL AMOUNT'}
                      </p>
                      <p className="text-base font-black font-mono text-slate-900 mt-0.5">
                        {formatAmount(calculations.totalDue)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. ITEMS TABLE (EXACT BLACK HEADER + ACCENT BORDER + STRIPED COLUMNS) */}
                <div className="px-12">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr
                        className="bg-[#0b0b0e] text-white text-xs font-black uppercase tracking-wider"
                        style={{ borderBottom: `3px solid ${accent}` }}
                      >
                        <th className="py-3 px-3 text-center w-14">SL.</th>
                        <th className="py-3 px-4 text-left">ITEM DESCRIPTION</th>
                        <th className="py-3 px-4 text-center w-32">UNIT PRICE</th>
                        <th className="py-3 px-4 text-center w-28">QUANTITY</th>
                        <th className="py-3 px-4 text-right w-36">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody style={{ borderBottom: `2px solid ${accent}` }}>
                      {items.map((item, idx) => {
                        const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-300 text-xs text-slate-800"
                          >
                            <td className="py-3 px-3 text-center font-bold bg-slate-100/90 text-slate-900">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4 bg-slate-100/90">
                              <div className="font-black text-slate-900 uppercase tracking-tight">
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                                  {item.subtitle}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold bg-white text-slate-800">
                              {formatAmount(Number(item.unitPrice) || 0)}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold bg-white text-slate-800">
                              {item.qty}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black bg-slate-100/90 text-slate-900">
                              {formatAmount(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Keep minimum table height aesthetic if very few items */}
                      {items.length < 4 &&
                        Array.from({ length: 4 - items.length }).map((_, emptyIdx) => (
                          <tr key={`empty_${emptyIdx}`} className="border-b border-slate-200 h-12">
                            <td className="bg-slate-100/50" />
                            <td className="bg-slate-100/50" />
                            <td className="bg-white" />
                            <td className="bg-white" />
                            <td className="bg-slate-100/50" />
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. LOWER SECTION: LEFT (PAYMENT INFO, TERMS, CONTACTS) & RIGHT (SUBTOTAL, TAX, TOTAL, SIGNATURE) */}
                <div className="px-12 pt-5 pb-6 grid grid-cols-12 gap-8">
                  {/* Left 7 Columns: Payment Info, Terms & Conditions, Contact Icons */}
                  <div className="col-span-7 space-y-5">
                    {/* Payment Info */}
                    <div>
                      <h4
                        className="text-xs font-black uppercase tracking-wider mb-1.5"
                        style={{ color: accent }}
                      >
                        PAYMENT INFO
                      </h4>
                      <div className="text-[11px] text-slate-800 font-medium space-y-0.5">
                        <p>
                          <strong className="font-bold">ACCOUNT NO :</strong> {company.paymentAccountNo}
                        </p>
                        <p>
                          <strong className="font-bold">PAY NAME :</strong> {company.paymentPayName}
                        </p>
                        <p>
                          <strong className="font-bold">METHOD / INFO :</strong> {company.paymentAddress}
                        </p>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div>
                      <h4
                        className="text-xs font-black uppercase tracking-wider mb-1.5"
                        style={{ color: accent }}
                      >
                        TERMS & CONDITIONS:
                      </h4>
                      <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                        {company.termsText}
                      </p>
                    </div>

                    {/* Contact Info with Square Colored Icons (Matching Reference Image) */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: accent }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 leading-tight font-mono">
                          <div>{company.phone1}</div>
                          {company.phone2 && <div>{company.phone2}</div>}
                        </div>
                      </div>

                      {(company.email || company.website) && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-[#0b0b0e] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                            {company.email && <div>{company.email}</div>}
                            {company.website && <div>{company.website}</div>}
                          </div>
                        </div>
                      )}

                      {(company.addressLine1 || company.addressLine2) && (
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: accent }}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                            <div>{company.addressLine1}</div>
                            {company.addressLine2 && <div>{company.addressLine2}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 5 Columns: Totals Table & Signature */}
                  <div className="col-span-5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-2 px-3 border-b border-slate-300 text-xs font-black text-slate-900">
                        <span>SUB. TOTAL</span>
                        <span className="font-mono">{formatAmount(calculations.subTotal)}</span>
                      </div>

                      {calculations.discVal > 0 && (
                        <div className="flex justify-between items-center py-2 px-3 border-b border-slate-300 text-xs font-bold text-emerald-700">
                          <span>DISCOUNT (-)</span>
                          <span className="font-mono">- {formatAmount(calculations.discVal)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 px-3 border-b border-slate-300 text-xs font-black text-slate-900">
                        <span>TAX</span>
                        <span className="font-mono">{formatAmount(calculations.taxVal)}</span>
                      </div>

                      {/* Dark Total Box with Accent Bottom Border */}
                      <div
                        className="bg-[#0b0b0e] text-white py-3 px-4 flex justify-between items-center mt-1"
                        style={{ borderBottom: `4px solid ${accent}` }}
                      >
                        <span className="text-sm font-black uppercase tracking-wider">TOTAL</span>
                        <span className="text-base font-black font-mono">
                          {formatAmount(calculations.grandTotal)}
                        </span>
                      </div>

                      {showPaidDue && (
                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between items-center py-1 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 rounded">
                            <span>PAID (নগদ জমা)</span>
                            <span className="font-mono">{formatAmount(calculations.paidVal)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 px-3 text-xs font-black text-red-600 bg-red-50 rounded">
                            <span>BALANCE DUE (বাকি)</span>
                            <span className="font-mono">{formatAmount(calculations.totalDue)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Signature Block */}
                    <div className="pt-12 pb-2 text-center">
                      <div
                        className="text-2xl font-bold text-slate-900 italic tracking-wide mb-1"
                        style={{ fontFamily: ' Georgia, serif' }}
                      >
                        {company.signatureText || 'Signature'}
                      </div>
                      <div
                        className="w-48 mx-auto h-[2px]"
                        style={{ backgroundColor: accent }}
                      />
                      <p className="text-xs font-bold text-slate-800 mt-1.5">
                        {company.signatureLabel || 'Company Signature'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. BOTTOM ANGLED FOOTER BANNER (EXACT MATCH TO IMAGE) */}
              <div className="relative h-[68px] w-full overflow-hidden bg-white mt-auto">
                {/* Left Black Angled Bar */}
                <div
                  className="absolute bottom-0 left-0 w-[56%] h-[50px] bg-[#0b0b0e]"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0% 100%)'
                  }}
                />
                {/* Right Accent Colored Angled Bar with Greeting */}
                <div
                  className="absolute bottom-0 right-0 w-[56%] h-full flex items-center justify-center pl-10"
                  style={{
                    backgroundColor: accent,
                    clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)'
                  }}
                >
                  <p className="text-white text-sm font-black tracking-[0.18em] text-center leading-tight">
                    {company.footerGreeting || 'Thank You For Your Business!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
