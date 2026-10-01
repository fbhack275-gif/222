import React, { useState } from 'react';
import { X, Calculator, Percent, TrendingUp, DollarSign } from 'lucide-react';

interface ProfitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfitCalculatorModal: React.FC<ProfitCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  if (!isOpen) return null;

  const discountedSellPrice = discountPercent > 0 
    ? sellPrice - (sellPrice * (discountPercent / 100))
    : sellPrice;

  const profitAmount = discountedSellPrice - costPrice;
  const profitMarginPercent = costPrice > 0 ? (profitAmount / costPrice) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">দ্রুত লাভ ও ডিসকাউন্ট ক্যালকুলেটর</h3>
              <p className="text-[10px] text-slate-400">পার্টস বিক্রির সম্ভাব্য লাভ যাচাই</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">ক্রয়মূল্য / কেনা দাম (৳)</label>
            <input
              type="number"
              min="0"
              value={costPrice || ''}
              onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">প্রত্যাশিত বিক্রয়মূল্য (৳)</label>
            <input
              type="number"
              min="0"
              value={sellPrice || ''}
              onChange={e => setSellPrice(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">কাস্টমারকে ডিসকাউন্ট (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-1">
                {[5, 10, 15].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDiscountPercent(p)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded-lg text-slate-300 font-mono font-bold"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">ডিসকাউন্টের পর বিক্রয় মূল্য:</span>
              <span className="font-mono font-bold text-slate-100">
                ৳ {discountedSellPrice.toFixed(0)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">মোট নীট লাভ (Profit):</span>
              <span className={`font-mono font-black text-base ${profitAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {profitAmount >= 0 ? '+ ' : ''}৳ {profitAmount.toFixed(0)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">লাভের মার্জিন (Margin):</span>
              <span className={`font-mono font-bold ${profitMarginPercent >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {profitMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
