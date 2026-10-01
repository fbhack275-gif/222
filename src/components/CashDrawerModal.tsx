import React, { useState, useMemo } from 'react';
import { X, DollarSign, Calculator, Printer, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { SaleRecord, ServiceRecord, ShopExpense, CustomerDue } from '../types';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  services: ServiceRecord[];
  expenses: ShopExpense[];
  dues: CustomerDue[];
  activeSeller: string;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
  sales,
  services,
  expenses,
  dues,
  activeSeller,
}) => {
  const [openingBalance, setOpeningBalance] = useState<number>(() => {
    return parseFloat(localStorage.getItem('anik_opening_cash') || '0');
  });

  // Cash note denominations count
  const [notes, setNotes] = useState({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0,
  });

  const todayStr = new Date().toLocaleDateString('en-GB');

  // Calculate today's cash flow
  const cashCalculations = useMemo(() => {
    // 1. Cash from product sales today
    let partsCash = 0;
    sales.forEach(s => {
      if (s.date === todayStr) {
        if (!s.isBaki) {
          partsCash += (s.qty || 1) * (s.sell || 0);
        }
      }
    });

    // 2. Cash from servicing today
    let servicesCash = 0;
    services.forEach(srv => {
      if (srv.date === todayStr) {
        servicesCash += srv.paid || 0;
      }
    });

    // 3. Cash from due collections today
    let dueCollectionsCash = 0;
    dues.forEach(d => {
      if (d.history) {
        d.history.forEach(h => {
          if (h.date === todayStr && h.type === 'payment') {
            dueCollectionsCash += h.amount || 0;
          }
        });
      }
    });

    // 4. Shop cash expenses today
    let expensesCash = 0;
    expenses.forEach(e => {
      if (e.date === todayStr) {
        expensesCash += e.amount || 0;
      }
    });

    const totalCashIn = partsCash + servicesCash + dueCollectionsCash;
    const expectedClosingCash = openingBalance + totalCashIn - expensesCash;

    return {
      partsCash,
      servicesCash,
      dueCollectionsCash,
      expensesCash,
      totalCashIn,
      expectedClosingCash,
    };
  }, [sales, services, expenses, dues, todayStr, openingBalance]);

  // Physical notes count
  const physicalCount = useMemo(() => {
    return (
      notes[1000] * 1000 +
      notes[500] * 500 +
      notes[200] * 200 +
      notes[100] * 100 +
      notes[50] * 50 +
      notes[20] * 20 +
      notes[10] * 10 +
      (notes.coins || 0)
    );
  }, [notes]);

  const difference = physicalCount - cashCalculations.expectedClosingCash;

  if (!isOpen) return null;

  const handleSaveOpening = (val: number) => {
    setOpeningBalance(val);
    localStorage.setItem('anik_opening_cash', String(val));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>আজকের ক্যাশ বাক্স ও ড্রয়ার হিসাব</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
                  {todayStr}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                দিনের শেষে ক্যাশ ড্রয়ারের টাকা গণনা ও হিসাব মিলানো
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Opening Cash Input */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300">
                সকালের ওপেনিং ক্যাশ (Opening Balance)
              </label>
              <span className="text-[11px] text-slate-500">
                সকালে দোকান খোলার সময় ক্যাশ বাক্সে যা ছিল
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-cyan-400 font-mono">৳</span>
              <input
                type="number"
                min="0"
                value={openingBalance || ''}
                onChange={e => handleSaveOpening(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-right"
              />
            </div>
          </div>

          {/* 2. Today's Cash Flow Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                পার্টস বিক্রি (নগদ)
              </span>
              <span className="block text-base font-black font-mono text-emerald-400 mt-1">
                + ৳{cashCalculations.partsCash.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-blue-400" />
                সার্ভিসিং নগদ
              </span>
              <span className="block text-base font-black font-mono text-blue-400 mt-1">
                + ৳{cashCalculations.servicesCash.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-amber-400" />
                বাকি আদায় নগদ
              </span>
              <span className="block text-base font-black font-mono text-amber-400 mt-1">
                + ৳{cashCalculations.dueCollectionsCash.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-red-400" />
                আজকের খরচ (নগদ)
              </span>
              <span className="block text-base font-black font-mono text-red-400 mt-1">
                - ৳{cashCalculations.expensesCash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Expected Cash in Drawer Result Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-950 border border-emerald-800/40 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">
                ক্যাশ বাক্সে প্রত্যাশিত মোট টাকা (Expected Cash):
              </span>
              <span className="text-[11px] text-slate-500">
                (ওপেনিং ৳{openingBalance} + মোট আগমন ৳{cashCalculations.totalCashIn} - মোট খরচ ৳{cashCalculations.expensesCash})
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              ৳ {cashCalculations.expectedClosingCash.toLocaleString()}
            </span>
          </div>

          {/* 3. Physical Note Counter */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>ড্রয়ারের নোট গণনা (Denomination Counter)</span>
              </h4>
              <button
                onClick={() => setNotes({ 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0 })}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
              >
                রিসেট
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[1000, 500, 200, 100, 50, 20, 10].map(val => (
                <div key={val} className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-300">৳{val} x</span>
                  <input
                    type="number"
                    min="0"
                    value={notes[val as keyof typeof notes] || ''}
                    onChange={e => {
                      const count = parseInt(e.target.value) || 0;
                      setNotes(prev => ({ ...prev, [val]: count }));
                    }}
                    placeholder="0"
                    className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-right font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ))}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">কয়েন / খুচরা</span>
                <input
                  type="number"
                  min="0"
                  value={notes.coins || ''}
                  onChange={e => {
                    const c = parseFloat(e.target.value) || 0;
                    setNotes(prev => ({ ...prev, coins: c }));
                  }}
                  placeholder="0"
                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-right font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Reconciliation Comparison Bar */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs text-slate-400">
                  গণনাকৃত মোট ক্যাশ: <strong className="font-mono text-slate-100 text-sm">৳ {physicalCount.toLocaleString()}</strong>
                </div>
                <div className="text-xs">
                  {difference === 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ক্যাশ ড্রয়ার একদম নিখুঁতভাবে মিলেছে! ✅
                    </span>
                  ) : difference > 0 ? (
                    <span className="text-blue-400 font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      ক্যাশ বেশি আছে: + ৳{difference.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ক্যাশ ঘাটতি আছে: - ৳{Math.abs(difference).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>রিপোর্ট প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
