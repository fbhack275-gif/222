import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  Wallet
} from 'lucide-react';
import { SaleRecord, ServiceRecord, ShopExpense, CustomerDue, SupplierDue, CashPurchaseRecord } from '../types';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  services: ServiceRecord[];
  expenses: ShopExpense[];
  dues: CustomerDue[];
  supplierDues: SupplierDue[];
  cashPurchases?: CashPurchaseRecord[];
  activeSeller: string;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  isOpen,
  onClose,
  sales,
  services,
  expenses,
  dues,
  supplierDues,
  cashPurchases = [],
  activeSeller,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-GB');
  });

  if (!isOpen) return null;

  // Calculate day-specific metrics
  const dayStats = useMemo(() => {
    let daySalesTotal = 0;
    let daySalesBuyTotal = 0;
    let daySalesCount = 0;
    let daySalesCash = 0;
    let daySalesBaki = 0;

    sales.forEach(s => {
      if (s.date === selectedDate) {
        const itemTotal = (s.qty || 1) * (s.sell || 0);
        const itemBuy = (s.qty || 1) * (s.buy || 0);
        daySalesTotal += itemTotal;
        daySalesBuyTotal += itemBuy;
        daySalesCount += s.qty || 1;
        if (s.isBaki) {
          daySalesBaki += itemTotal;
        } else {
          daySalesCash += itemTotal;
        }
      }
    });

    const dayGrossProfit = Math.max(0, daySalesTotal - daySalesBuyTotal);

    // Servicing & Load
    let dayServicesTotal = 0;
    let dayServicesCash = 0;
    let dayServicesCount = 0;
    services.forEach(srv => {
      if (srv.date === selectedDate) {
        dayServicesTotal += srv.cost || 0;
        dayServicesCash += srv.paid || 0;
        dayServicesCount += 1;
      }
    });

    // Expenses
    let dayExpensesTotal = 0;
    expenses.forEach(e => {
      if (e.date === selectedDate) {
        dayExpensesTotal += e.amount || 0;
      }
    });

    // Baki collected from debtors
    let dayBakiCollected = 0;
    dues.forEach(d => {
      if (d.history) {
        d.history.forEach(h => {
          if (h.date === selectedDate && h.type === 'payment') {
            dayBakiCollected += h.amount || 0;
          }
        });
      }
    });

    // Supplier payments made
    let daySupplierPaid = 0;
    supplierDues.forEach(s => {
      if (s.history) {
        s.history.forEach(h => {
          if (h.date === selectedDate && h.type === 'payment') {
            daySupplierPaid += h.amount || 0;
          }
        });
      }
    });

    // Cash spent on buying outside parts / restock from sales cash
    let dayCashPurchasesTotal = 0;
    cashPurchases.forEach(p => {
      if (p.date === selectedDate) {
        dayCashPurchasesTotal += p.totalCost || 0;
      }
    });

    // Net Shop Profit = (Parts Gross Profit + Servicing Income) - Expenses
    const netProfit = dayGrossProfit + dayServicesTotal - dayExpensesTotal;
    const netCashInflow = daySalesCash + dayServicesCash + dayBakiCollected - dayExpensesTotal - daySupplierPaid - dayCashPurchasesTotal;

    return {
      daySalesTotal,
      daySalesBuyTotal,
      daySalesCount,
      daySalesCash,
      daySalesBaki,
      dayGrossProfit,
      dayServicesTotal,
      dayServicesCash,
      dayServicesCount,
      dayExpensesTotal,
      dayBakiCollected,
      daySupplierPaid,
      dayCashPurchasesTotal,
      netProfit,
      netCashInflow,
    };
  }, [sales, services, expenses, dues, supplierDues, cashPurchases, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let msg = `*📊 অনিক টেলিকম - দৈনিক ব্যবসায়িক রিপোর্ট*\n`;
    msg += `তারিখ: ${selectedDate}\n`;
    msg += `অপারেটর: ${activeSeller}\n`;
    msg += `------------------------------------\n`;
    msg += `📦 পার্টস বিক্রি: ৳${dayStats.daySalesTotal.toLocaleString()} (${dayStats.daySalesCount} পিস)\n`;
    msg += `   - নগদ বিক্রি: ৳${dayStats.daySalesCash.toLocaleString()}\n`;
    if (dayStats.daySalesBaki > 0) {
      msg += `   - বাকি বিক্রি: ৳${dayStats.daySalesBaki.toLocaleString()}\n`;
    }
    msg += `💎 পার্টসের গ্রস লাভ: ৳${dayStats.dayGrossProfit.toLocaleString()}\n`;
    msg += `🔧 সার্ভিসিং ও লোড আয়: ৳${dayStats.dayServicesTotal.toLocaleString()} (${dayStats.dayServicesCount} টি কাজ)\n`;
    msg += `💰 পুরাতন বাকি আদায়: ৳${dayStats.dayBakiCollected.toLocaleString()}\n`;
    msg += `💸 দোকান খরচ: ৳${dayStats.dayExpensesTotal.toLocaleString()}\n`;
    if (dayStats.daySupplierPaid > 0) {
      msg += `🏢 মহাজন পরিশোধ: ৳${dayStats.daySupplierPaid.toLocaleString()}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `🔥 *আজকের নিট লাভ: ৳${dayStats.netProfit.toLocaleString()}*\n`;
    msg += `💵 *ক্যাশ ড্রয়ারে নিট টাকা: ৳${dayStats.netCashInflow.toLocaleString()}*\n`;
    msg += `------------------------------------\n`;
    msg += `রিপোর্ট প্রেরক: অনিক টেলিকম পিওএস`;

    sendWhatsAppMessage('', msg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>আজকের সামগ্রিক লাভ-ক্ষতি ও সারসংক্ষেপ</span>
              </h3>
              <p className="text-xs text-slate-400">
                বিক্রি, সার্ভিসিং আয়, দোকান খরচ ও নিট লাভের সম্পূর্ণ খতিয়ান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">তারিখ:</span>
            <span className="font-mono font-bold text-cyan-300">{selectedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp এ পাঠান</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main Profit Highlights */}
          <div className="grid grid-cols-2 gap-3">
            {/* Net Profit Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                আজকের নিট লাভ (Net Profit)
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 block mt-1">
                ৳{dayStats.netProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                পার্টস লাভ + সার্ভিস - খরচ
              </span>
            </div>

            {/* Net Cash In Hand Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                আজকের নিট ক্যাশ ইনফ্লো
              </span>
              <span className="text-2xl font-black font-mono text-cyan-400 block mt-1">
                ৳{dayStats.netCashInflow.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                নগদ জমা ও আদায় - মোট প্রদান
              </span>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
            <h4 className="font-bold text-slate-300 pb-2 border-b border-slate-800 text-xs flex items-center justify-between">
              <span>বিস্তারিত খতিয়ান বিবরণী</span>
              <span className="text-[10px] font-mono text-slate-500">পরিমাণ / সংখ্যা</span>
            </h4>

            {/* Sales */}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                মোট পার্টস বিক্রি:
              </span>
              <span className="font-mono font-bold text-slate-100">
                ৳{dayStats.daySalesTotal.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({dayStats.daySalesCount} টি)
                </span>
              </span>
            </div>

            {/* Buy cost */}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                বিক্রিত মালের কেনা খরচ:
              </span>
              <span className="font-mono font-semibold text-slate-400">
                ৳{dayStats.daySalesBuyTotal.toLocaleString()}
              </span>
            </div>

            {/* Gross Profit from sales */}
            <div className="flex justify-between items-center py-1 bg-emerald-950/20 px-2 rounded-lg">
              <span className="text-emerald-400 font-semibold">পার্টসের গ্রস লাভ:</span>
              <span className="font-mono font-bold text-emerald-400">
                + ৳{dayStats.dayGrossProfit.toLocaleString()}
              </span>
            </div>

            {/* Servicing & load */}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                সার্ভিসিং ও লোড আয়:
              </span>
              <span className="font-mono font-bold text-blue-400">
                + ৳{dayStats.dayServicesTotal.toLocaleString()}{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({dayStats.dayServicesCount} টি)
                </span>
              </span>
            </div>

            {/* Dues collected */}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                পুরাতন বাকি আদায় (নগদ):
              </span>
              <span className="font-mono font-bold text-amber-400">
                + ৳{dayStats.dayBakiCollected.toLocaleString()}
              </span>
            </div>

            {/* Expenses */}
            <div className="flex justify-between items-center py-1 bg-red-950/20 px-2 rounded-lg">
              <span className="text-red-400 font-semibold">দোকান খরচ (চা, বিদ্যুৎ, ইত্যাদি):</span>
              <span className="font-mono font-bold text-red-400">
                - ৳{dayStats.dayExpensesTotal.toLocaleString()}
              </span>
            </div>

            {/* Cash Purchases / Reinvestment */}
            <div className="flex justify-between items-center py-1 bg-purple-950/25 px-2 rounded-lg border border-purple-500/20">
              <span className="text-purple-300 font-semibold">বিক্রির টাকায় পুনরায় মাল ক্রয় / বাহিরের পার্টস কেনা:</span>
              <span className="font-mono font-bold text-purple-400">
                - ৳{dayStats.dayCashPurchasesTotal.toLocaleString()}
              </span>
            </div>

            {/* Supplier paid */}
            {dayStats.daySupplierPaid > 0 && (
              <div className="flex justify-between items-center py-1 bg-purple-950/20 px-2 rounded-lg">
                <span className="text-purple-400 font-semibold">মহাজনকে পাওনা পরিশোধ:</span>
                <span className="font-mono font-bold text-purple-400">
                  - ৳{dayStats.daySupplierPaid.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
