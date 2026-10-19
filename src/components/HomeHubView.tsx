import React from 'react';
import {
  Smartphone,
  Boxes,
  Wrench,
  BookOpen,
  BarChart3,
  PackagePlus,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Printer,
  Share2,
  Clock,
  User,
  Plus,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Receipt,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SaleRecord, InventoryItem, UserRole } from '../types';

interface HomeHubViewProps {
  userRole: UserRole;
  isMainAdmin: boolean;
  isSubAdmin: boolean;
  isPrivacyMode: boolean;
  activeSeller: string;
  todaySummary: {
    todaySalesRev: number;
    todaySalesCost: number;
    todaySalesUnits: number;
    todaySalesCount: number;
    todaySalesList: SaleRecord[];
    todayServiceRev: number;
    todayGrossProfit: number;
    todayNetProfit: number;
    todayExpenseAmount: number;
  };
  duesSummary: {
    totalDue: number;
    debtorCount: number;
  };
  stockSummary: {
    totalItemsCount: number;
    totalUnits: number;
    totalBuyVal: number;
    totalRetailVal: number;
    lowStockCount: number;
  };
  mobilePartsCount: number;
  onNavigateTab: (tab: 'home' | 'inventory' | 'mobile_parts' | 'services' | 'dues' | 'dashboard' | 'preorders') => void;
  onOpenAddItem: (category?: string) => void;
  onOpenCashMemoStudio: () => void;
  onOpenDailySummary: () => void;
  onOpenExpenseModal: () => void;
  onOpenAddDue: () => void;
  onReprintReceipt: (sale: SaleRecord) => void;
  onShareWhatsApp: (sale: SaleRecord) => void;
}

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  userRole,
  isMainAdmin,
  isSubAdmin,
  isPrivacyMode,
  activeSeller,
  todaySummary,
  duesSummary,
  stockSummary,
  mobilePartsCount,
  onNavigateTab,
  onOpenAddItem,
  onOpenCashMemoStudio,
  onOpenDailySummary,
  onOpenExpenseModal,
  onOpenAddDue,
  onReprintReceipt,
  onShareWhatsApp
}) => {
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 1. Executive Welcome & Shift Pulse Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                লাইভ শপ ড্যাশবোর্ড
              </span>
              <span className="text-xs text-slate-400">
                অপারেটর: <strong className="text-slate-200">{activeSeller}</strong>
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-100 mt-1">
              স্বাগতম, {isMainAdmin ? 'অনিক টেলিকম অ্যাডমিন' : 'পারভেজ (সেলস ম্যানেজার)'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              আজকের রিয়েল-টাইম সেলস, পার্টস স্টক সামারি ও কুইক কন্ট্রোল সেন্টার
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCashMemoStudio}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Receipt className="w-4 h-4 stroke-[2.5]" />
              <span>ক্যাশ মেমো স্টুডিও</span>
            </button>
            <button
              onClick={onOpenDailySummary}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>দৈনিক সামারি</span>
            </button>
          </div>
        </div>

        {/* Executive Pulse 4-Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4 relative z-10">
          {/* Today's Sales */}
          <div className="bg-slate-950/70 border border-emerald-900/30 p-3 sm:p-4 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-400 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                আজকের মোট বিক্রি
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {todaySummary.todaySalesCount} টি ইনভয়েস
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {todaySummary.todaySalesRev.toLocaleString()} ৳
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                মোট {todaySummary.todaySalesUnits} পিস মালামাল বিক্রয়
              </div>
            </div>
          </div>

          {/* Today's Net Profit - Main Admin */}
          {isMainAdmin && (
            <div className="bg-slate-950/70 border border-cyan-900/30 p-3 sm:p-4 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase text-cyan-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  আজকের নেট লাভ
                </span>
                <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded font-mono">
                  সার্ভিস সহ
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                  {isPrivacyMode ? '••••••••' : `৳ ${todaySummary.todayNetProfit.toLocaleString()}`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  খরচ বাদে আজকের চূড়ান্ত লাভ
                </div>
              </div>
            </div>
          )}

          {/* Customer Dues */}
          <div
            onClick={() => onNavigateTab('dues')}
            className="bg-slate-950/70 border border-amber-900/30 p-3 sm:p-4 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-amber-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                বর্তমান কাস্টমার বাকি
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {duesSummary.totalDue.toLocaleString()} ৳
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {duesSummary.debtorCount} জন কাস্টমারের কাছে বাকি
              </div>
            </div>
          </div>

          {/* Mobile Parts & Stock Count */}
          <div
            onClick={() => onNavigateTab('mobile_parts')}
            className="bg-slate-950/70 border border-blue-900/30 p-3 sm:p-4 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-cyan-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-blue-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                মোবাইল পার্টস স্টক
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded font-bold font-mono">
                {mobilePartsCount} আইটেম
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-200">
                {stockSummary.totalUnits} <span className="text-sm font-sans font-normal text-slate-400">পিস মালামাল</span>
              </div>
              <div className="text-[10px] text-cyan-400 mt-0.5 flex items-center gap-1">
                <span>পার্টস দেখতে ক্লিক করুন</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Launcher Hub (পরিষ্কার প্রফেশনাল শর্টকাট হাব) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">কুইক অ্যাকশন হাব (Quick Launcher)</h3>
          </div>
          <span className="text-[11px] text-slate-500">এক ক্লিকে মূল ফিচারসমূহ</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Option 1: Mobile Parts View (সরাসরি শুধু মোবাইল পার্টস) */}
          <button
            onClick={() => onNavigateTab('mobile_parts')}
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/40 hover:border-cyan-500/60 text-left transition-all group flex flex-col justify-between space-y-2 shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                <span>🔧 মোবাইল পার্টস</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">
                শুধুমাত্র ডিসপ্লে, ব্যাটারি ও পার্টস
              </div>
            </div>
          </button>

          {/* Option 2: All Inventory & POS */}
          <button
            onClick={() => onNavigateTab('inventory')}
            className="p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-left transition-all group flex flex-col justify-between space-y-2"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                <span>📦 সব স্টক ও সেলস</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                এক্সেসরিজ ও সকল আইটেম
              </div>
            </div>
          </button>

          {/* Option 3: Add Item / Part */}
          <button
            onClick={() => onOpenAddItem()}
            className="p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group flex flex-col justify-between space-y-2"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                <span>+ নতুন পণ্য এন্ট্রি</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                নতুন পার্টস বা এক্সেসরিজ যোগ
              </div>
            </div>
          </button>

          {/* Option 4: Dues Entry */}
          <button
            onClick={onOpenAddDue}
            className="p-3 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 text-left transition-all group flex flex-col justify-between space-y-2"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                <span>+ নতুন বাকি এন্ট্রি</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                কাস্টমার বাকি বৃদ্ধি বা জমা
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Urgent Low Stock Warning Widget (যদি ৩ পিসের কম থাকে) */}
      {stockSummary.lowStockCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                সতর্কবার্তা: {stockSummary.lowStockCount} টি পণ্যের স্টক শেষের পথে (&lt; ৩ পিস)!
              </h4>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                মার্কেটে অর্ডার দিতে এখনই কম স্টক মালামালের লিস্ট চেক করুন
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            কম স্টক লিস্ট দেখুন
          </button>
        </div>
      )}

      {/* 4. Today's Live Sales Feed & Fast Reprint */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">
              আজকের সাম্প্রতিক বিক্রয় রেকর্ড ({todaySummary.todaySalesList.length} টি)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
          >
            <span>সব রিপোর্ট দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todaySummary.todaySalesList.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-400 text-xs">
            আজকে এখনো কোনো বিক্রয় রেকর্ড হয়নি। স্টক পেজ বা ক্যাশ মেমো থেকে বিক্রি শুরু করুন।
          </div>
        ) : (
          <div className="space-y-2">
            {todaySummary.todaySalesList.slice(0, 5).map((sale, idx) => (
              <div
                key={`today_sale_${sale.id || idx}`}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{sale.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {sale.qty || 1} পিস
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>বিক্রেতা: {sale.seller || 'স্টোর'}</span>
                      {(sale.customerName || sale.customer) && (
                        <span>&bull; ক্রেতা: {sale.customerName || sale.customer}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {((sale.qty || 1) * (sale.sell || 0)).toLocaleString()} ৳
                    </div>
                    <div className="text-[10px] text-slate-500">
                      দর: {sale.sell} ৳
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onReprintReceipt(sale)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="ক্যাশ মেমো প্রিন্ট / দেখুন"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onShareWhatsApp(sale)}
                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 transition-colors"
                      title="হোয়াটসঅ্যাপে স্লিপ পাঠান"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
