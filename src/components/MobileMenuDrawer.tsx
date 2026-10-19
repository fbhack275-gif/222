import React from 'react';
import {
  X,
  Home,
  Boxes,
  BookOpen,
  Wrench,
  BarChart3,
  ShoppingCart,
  ScanBarcode,
  ClipboardList,
  Wallet,
  Calculator,
  Truck,
  Plus,
  Eye,
  EyeOff,
  Download,
  Upload,
  Lock,
  LogOut,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  MessageSquare,
  QrCode,
  FileText,
  Calendar,
  ChevronRight,
  Layers,
  Database,
  PackagePlus,
  Settings,
  Smartphone
} from 'lucide-react';
import { UserRole } from '../types';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'home' | 'inventory' | 'mobile_parts' | 'services' | 'dues' | 'dashboard' | 'preorders';
  onSelectTab: (tab: 'home' | 'inventory' | 'mobile_parts' | 'services' | 'dues' | 'dashboard' | 'preorders') => void;
  mobilePartsCount?: number;
  onOpenSettings?: () => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  activeSeller: string;
  sellers: string[];
  onSellerChange: (seller: string) => void;
  onOpenAddItem: () => void;
  onOpenAddDue?: () => void;
  onOpenCart: () => void;
  cartCount: number;
  onOpenCashMemoStudio?: () => void;
  onOpenDailySummary: () => void;
  onOpenCashDrawer: () => void;
  onOpenSupplierLedger: () => void;
  onOpenProfitCalc: () => void;
  onOpenCalculator: () => void;
  onOpenBarcode: () => void;
  onOpenMessageHub: () => void;
  onOpenCustomerQr: () => void;
  onOpenReorder: () => void;
  onOpenPreOrders?: () => void;
  preOrdersCount?: number;
  onOpenExpense: () => void;
  onOpenRepair: () => void;
  onExportCSVInventory: () => void;
  onExportCSVSales: () => void;
  onExportCSVDues: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  userRole: UserRole;
  isAdminLoggedIn?: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  supplierCount: number;
  lowStockCount: number;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenSettings,
  isPrivacyMode,
  togglePrivacyMode,
  activeSeller,
  sellers,
  onSellerChange,
  onOpenAddItem,
  onOpenAddDue,
  onOpenCart,
  cartCount,
  onOpenCashMemoStudio,
  onOpenDailySummary,
  onOpenCashDrawer,
  onOpenSupplierLedger,
  onOpenProfitCalc,
  onOpenCalculator,
  onOpenBarcode,
  onOpenMessageHub,
  onOpenCustomerQr,
  onOpenReorder,
  onOpenPreOrders,
  preOrdersCount = 0,
  onOpenExpense,
  onOpenRepair,
  onExportCSVInventory,
  onExportCSVSales,
  onExportCSVDues,
  onExportJSON,
  onImportJSON,
  userRole,
  isAdminLoggedIn = true,
  onOpenLogin,
  onLogout,
  supplierCount,
  lowStockCount,
  mobilePartsCount = 0
}) => {
  if (!isOpen) return null;

  const isMainAdmin = isAdminLoggedIn && userRole === 'main_admin';
  const isSubAdmin = isAdminLoggedIn && userRole === 'sub_admin';

  const handleAction = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-[92%] max-w-[380px] bg-slate-950 border-l border-slate-800/90 h-full flex flex-col justify-between overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Modern Top Header */}
        <div className="px-5 py-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 tracking-tight leading-none">
                স্মার্ট টুলস মেনু
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                অনিক টেলিকম · কমান্ড সেন্টার
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all border border-slate-700/60"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-6 overflow-y-auto flex-1">
          {/* 1. Modern Role & Operator Identity Card */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/90 p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isMainAdmin
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isSubAdmin
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-100">
                    {isMainAdmin
                      ? 'Anik · Main Admin'
                      : isSubAdmin
                      ? 'Parvej · Sub Admin'
                      : 'লগইন করা নেই'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isMainAdmin
                      ? 'পূর্ণ নিয়ন্ত্রণ ও সকল হিসাব এক্সেস'
                      : isSubAdmin
                      ? 'সেল, স্টক ও বাকি এন্ট্রি মোড'
                      : 'লগইন করে কাজ শুরু করুন'}
                  </div>
                </div>
              </div>

              {isAdminLoggedIn ? (
                <button
                  onClick={() => handleAction(onLogout)}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </button>
              ) : (
                <button
                  onClick={() => handleAction(onOpenLogin)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </button>
              )}
            </div>

            {/* Operator Selector Segment */}
            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>সক্রিয় অপারেটর</span>
              </span>
              {isMainAdmin ? (
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-bold">
                  {sellers.map(s => (
                    <button
                      key={s}
                      onClick={() => onSellerChange(s)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        activeSeller === s
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  {activeSeller}
                </span>
              )}
            </div>

            {/* Sub Admin Quick Switch to Main Admin */}
            {isSubAdmin && (
              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">সব ফিচার আনলক করতে:</span>
                <button
                  onClick={() => handleAction(onOpenLogin)}
                  className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Lock className="w-3 h-3" />
                  <span>Anik (Main Admin) লগইন</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick System Settings Action Banner */}
          {onOpenSettings && (
            <button
              onClick={() => handleAction(onOpenSettings)}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-600/10 to-slate-900 hover:from-cyan-500/25 border border-cyan-500/35 text-left flex items-center justify-between group active:scale-98 transition-all shadow-lg shadow-cyan-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-black shadow-inner">
                  <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-cyan-300 block">
                      ⚙️ দোকান ও সিস্টেম সেটিংস
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                      SETTING
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    দোকানের নাম, প্রিন্ট রসিদ, সাউন্ড, কর্মী ও ডাটা ব্যাকআপ
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* 2. Page Navigation Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300">মূল পেজ নেভিগেশন</span>
              <span className="text-[11px] text-slate-500">ট্যাব পরিবর্তন</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction(() => onSelectTab('home'))}
                className={`col-span-2 p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  activeTab === 'home'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'home' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs block font-bold">হোম ড্যাশবোর্ড ও কুইক হাব</span>
                    <span className={`text-[10px] block ${activeTab === 'home' ? 'text-slate-900/80' : 'text-slate-400'}`}>
                      আজকের বিক্রি, লাভ ও কুইক শর্টকাট
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'home' ? 'text-slate-950' : 'text-slate-500'}`} />
              </button>

              {/* Dedicated Mobile Parts Tab (আলাদা অপশন: শুধু মোবাইল পার্টস) */}
              <button
                onClick={() => handleAction(() => onSelectTab('mobile_parts'))}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                  activeTab === 'mobile_parts'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeTab === 'mobile_parts' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs block truncate font-bold">🔧 মোবাইল পার্টস</span>
                  <span className={`text-[10px] block font-mono ${
                    activeTab === 'mobile_parts' ? 'text-slate-900 font-bold' : 'text-cyan-400'
                  }`}>
                    {mobilePartsCount > 0 ? `${mobilePartsCount} টি পার্টস` : 'শুধুমাত্র পার্টস'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleAction(() => onSelectTab('inventory'))}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                  activeTab === 'inventory'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeTab === 'inventory' ? 'bg-slate-950/15 text-slate-950' : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs block truncate">স্টক ও মালামাল</span>
                  {lowStockCount > 0 && (
                    <span className={`text-[10px] block font-mono ${
                      activeTab === 'inventory' ? 'text-slate-900 font-bold' : 'text-amber-400'
                    }`}>
                      {lowStockCount} টি কম স্টক
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleAction(() => onSelectTab('dues'))}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                  activeTab === 'dues'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeTab === 'dues' ? 'bg-slate-950/15 text-slate-950' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs block truncate">বাকির খাতা</span>
                  <span className={`text-[10px] block ${
                    activeTab === 'dues' ? 'text-slate-900 font-bold' : 'text-slate-400'
                  }`}>
                    বকেয়া হিসাব
                  </span>
                </div>
              </button>

              {isMainAdmin && (
                <>
                  <button
                    onClick={() => handleAction(() => onSelectTab('services'))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      activeTab === 'services'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      activeTab === 'services' ? 'bg-slate-950/15 text-slate-950' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs block truncate">সার্ভিস ও লোড</span>
                      <span className={`text-[10px] block ${
                        activeTab === 'services' ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}>
                        মেরামত ও রিচার্জ
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAction(() => onSelectTab('dashboard'))}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      activeTab === 'dashboard'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      activeTab === 'dashboard' ? 'bg-slate-950/15 text-slate-950' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs block truncate">হিসাব ও রিপোর্ট</span>
                      <span className={`text-[10px] block ${
                        activeTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}>
                        লাভ-ক্ষতি ও খতিয়ান
                      </span>
                    </div>
                  </button>
                </>
              )}

              {/* Pre-Orders & Required Products Navigation Tab */}
              <button
                onClick={() => handleAction(() => onSelectTab('preorders'))}
                className={`col-span-2 p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  activeTab === 'preorders'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 font-black shadow-lg shadow-purple-500/20'
                    : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'preorders' ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-400'
                  }`}>
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs block truncate font-bold">চাহিদা ও কাস্টমার প্রি-অর্ডার</span>
                    <span className={`text-[10px] block ${
                      activeTab === 'preorders' ? 'text-purple-100 font-medium' : 'text-slate-400'
                    }`}>
                      অগ্রিম বায়না ও মালামাল রিকুইজিশন
                    </span>
                  </div>
                </div>
                {preOrdersCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                    activeTab === 'preorders' ? 'bg-white text-purple-900' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {preOrdersCount} টি
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 3. Primary Quick Entry Dock (Sell, Stock, Baki, Scanner, Calculator) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300">
                {isSubAdmin ? 'অনুমোদিত কুইক এন্ট্রি' : 'দ্রুত এন্ট্রি ও পস টুলস'}
              </span>
              <span className="text-[11px] text-slate-500">এক ক্লিকে অ্যাকশন</span>
            </div>

            <div className="space-y-2">
              {/* Pro Custom Cash Memo & Invoice Studio */}
              {onOpenCashMemoStudio && (
                <button
                  onClick={() => handleAction(onOpenCashMemoStudio)}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 hover:from-amber-500/30 border border-amber-500/40 text-left flex items-center justify-between group active:scale-98 transition-all shadow-lg shadow-amber-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow">
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-300 block">
                          🧾 প্রো ক্যাশ মেমো ও ইনভয়েস স্টুডিও
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                          PRO
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5">
                        কাস্টম মেমো কালার, স্টক/হিস্ট্রি/কার্ট পিক, প্রিন্ট ও PDF/PNG ডাউনলোড
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {/* Pre-Orders & Required Products Quick Banner */}
              <button
                onClick={() => handleAction(() => {
                  onSelectTab('preorders');
                  if (onOpenPreOrders) onOpenPreOrders();
                })}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-slate-900 hover:from-purple-500/30 border border-purple-500/40 text-left flex items-center justify-between group active:scale-98 transition-all shadow-lg shadow-purple-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow">
                    <PackagePlus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-purple-300 block">
                        📋 মালামাল চাহিদা ও কাস্টমার প্রি-অর্ডার
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                        ADVANCE
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-300 block mt-0.5">
                      কাস্টমার বায়না দিয়ে অর্ডার করা মালামাল ও দোকানের চাহিদা লিস্ট
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {preOrdersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500 text-white font-mono font-black text-xs">
                      {preOrdersCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
              {/* Sell Entry / Multi-Item Cart */}
              <button
                onClick={() => handleAction(onOpenCart)}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-slate-900 hover:from-emerald-500/25 border border-emerald-500/30 text-left flex items-center justify-between group active:scale-98 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">
                      সেল এন্ট্রি ও মাল্টি-আইটেম কার্ট
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      একসাথে একাধিক পণ্য বিক্রি ও মেমো প্রিন্ট
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {cartCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-mono font-black text-xs">
                      {cartCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Pro Custom Cash Memo & Invoice Studio */}
              {onOpenCashMemoStudio && (
                <button
                  onClick={() => handleAction(onOpenCashMemoStudio)}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 hover:from-amber-500/30 border border-amber-500/40 text-left flex items-center justify-between group active:scale-98 transition-all shadow-lg shadow-amber-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow">
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-300 block">
                          🧾 প্রো ক্যাশ মেমো ও ইনভয়েস স্টুডিও
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                          PRO
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5">
                        কাস্টম মেমো কালার, স্টক/হিস্ট্রি/কার্ট পিক, প্রিন্ট ও PDF/PNG ডাউনলোড
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {/* 2-Column Grid for Stock Entry & Baki Entry */}
              {isAdminLoggedIn && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction(onOpenAddItem)}
                    className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/30 text-left flex flex-col justify-between gap-2 active:scale-98 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/25">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-100 block group-hover:text-cyan-300">
                        + নতুন স্টক এন্ট্রি
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        নতুন পার্টস স্টকে যোগ
                      </span>
                    </div>
                  </button>

                  {onOpenAddDue && (
                    <button
                      onClick={() => handleAction(onOpenAddDue)}
                      className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-left flex flex-col justify-between gap-2 active:scale-98 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block group-hover:text-amber-300">
                          + নতুন বাকি এন্ট্রি
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          গ্রাহকের বকেয়া খাতা
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* 2-Column Grid for Barcode Scanner & Calculator */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction(onOpenBarcode)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-left flex items-center gap-2.5 active:scale-98 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <ScanBarcode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">স্ক্যানার ও SKU</span>
                    <span className="text-[10px] text-slate-400 block truncate">বারকোড ও স্টিকার</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenCalculator)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-left flex items-center gap-2.5 active:scale-98 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">ক্যালকুলেটর</span>
                    <span className="text-[10px] text-slate-400 block truncate">দ্রুত ক্যাশ হিসাব</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Main Admin Only: Accounts, Cash & Business Tools Bento Grid */}
          {isMainAdmin && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">হিসাব, খাতা ও বিজনেস টুলস</span>
                <span className="text-[11px] text-cyan-400 font-medium">Main Admin</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction(onOpenDailySummary)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">আজকের লাভ</span>
                    <span className="text-[10px] text-slate-400 block truncate">দৈনিক সামারি</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenCashDrawer)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">ক্যাশ ড্রয়ার</span>
                    <span className="text-[10px] text-slate-400 block truncate">ক্যাশ মিলানো</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenExpense)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">দোকান খরচ</span>
                    <span className="text-[10px] text-slate-400 block truncate">খরচের খাতা</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenSupplierLedger)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">মহাজন খাতা</span>
                    <span className="text-[10px] text-slate-400 block truncate">{supplierCount} জন মহাজন</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenRepair)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-violet-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">রিপেয়ার জব</span>
                    <span className="text-[10px] text-slate-400 block truncate">সার্ভিস টোকেন</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenProfitCalc)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">লাভ হিসাব</span>
                    <span className="text-[10px] text-slate-400 block truncate">মার্জিন চেক</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenMessageHub)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">তাগাদা SMS</span>
                    <span className="text-[10px] text-slate-400 block truncate">হোয়াটসঅ্যাপ</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenCustomerQr)}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-left flex items-center gap-2.5 active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">কাস্টমার QR</span>
                    <span className="text-[10px] text-slate-400 block truncate">ডিজিটাল কার্ড</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(onOpenReorder)}
                  className="col-span-2 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 flex items-center justify-between text-xs font-bold active:scale-98 transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="text-slate-200">পাইকারি মালামাল ক্রয়ের ফর্দ</span>
                  </span>
                  <span className="text-xs font-mono text-purple-300">
                    {lowStockCount} টি পণ্য
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Main Admin Only: Privacy Switch & Backup */}
          {isMainAdmin && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>সিকিউরিটি ও ডাটা ব্যাকআপ</span>
                </span>
              </div>

              <button
                onClick={togglePrivacyMode}
                className={`w-full p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isPrivacyMode
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isPrivacyMode ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </span>
                  <span className="text-left">
                    <span className="block text-xs font-bold">কেনা দাম গোপন মোড</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {isPrivacyMode ? 'কাস্টমার সেফ মোড চালু আছে' : 'কেনা দাম বর্তমানে দৃশ্যমান'}
                    </span>
                  </span>
                </span>
                <span className={`text-[11px] font-mono font-bold ${isPrivacyMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isPrivacyMode ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAction(onExportCSVInventory)}
                  className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold text-center transition-colors"
                >
                  স্টক CSV
                </button>
                <button
                  onClick={() => handleAction(onExportCSVSales)}
                  className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold text-center transition-colors"
                >
                  বিক্রয় CSV
                </button>
                <button
                  onClick={() => handleAction(onExportCSVDues)}
                  className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold text-center transition-colors"
                >
                  বাকি CSV
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction(onExportJSON)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ব্যাকআপ সেভ</span>
                </button>

                <label className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ব্যাকআপ রিস্টোর</span>
                  <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Clean Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>অনিক টেলিকম পস</span>
          <span>স্মার্ট ইনভেন্টরি</span>
        </div>
      </div>
    </div>
  );
};
