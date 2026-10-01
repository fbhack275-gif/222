import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, Receipt } from 'lucide-react';
import { CustomerDue } from '../types';

interface CollectPaymentModalProps {
  customer: CustomerDue | null;
  onClose: () => void;
  activeSeller: string;
  onCollect: (customerId: string, amount: number, note: string) => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  customer,
  onClose,
  activeSeller,
  onCollect
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (customer) {
      const currentDue = customer.totalAmount - (customer.paidAmount || 0);
      setAmount(currentDue > 0 ? String(currentDue) : '');
      setNote('');
    }
  }, [customer]);

  if (!customer) return null;

  const currentDue = Math.max(0, customer.totalAmount - (customer.paidAmount || 0));

  const handleFullPay = () => {
    setAmount(String(currentDue));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      alert('সঠিক জমার পরিমাণ লিখুন!');
      return;
    }
    if (numAmount > currentDue) {
      if (!confirm(`জমার পরিমাণ (৳${numAmount}) বর্তমান বাকি (৳${currentDue})-র চেয়ে বেশি। আপনি কি নিশ্চিত?`)) {
        return;
      }
    }

    onCollect(customer.id, numAmount, note.trim() || 'নগদ পরিশোধ');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">বাকির টাকা জমা গ্রহণ</h3>
              <p className="text-[10px] text-slate-400">কাস্টমারের খতিয়ান আপডেট হবে</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Customer Summary Card */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">গ্রাহক:</span>
              <span className="text-sm font-bold text-slate-100">{customer.name}</span>
            </div>
            {customer.phone && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">মোবাইল:</span>
                <span className="font-mono text-cyan-400">{customer.phone}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">বর্তমান বকেয়া বাকি:</span>
              <span className="text-base font-black font-mono text-red-400">৳ {currentDue.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                জমা টাকার পরিমাণ (৳)
              </label>
              <button
                type="button"
                onClick={handleFullPay}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-0.5 rounded font-bold transition-colors"
              >
                পুরো টাকা (৳{currentDue})
              </button>
            </div>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-mono font-black text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পেমেন্ট নোট / মন্তব্য (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="যেমন: ক্যাশ জমা / বিকাশ 017..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Remaining After Preview */}
          {parseFloat(amount) > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">জমার পর অবশিষ্ট বাকি থাকবে:</span>
              <span className="font-mono font-bold text-slate-200">
                ৳ {Math.max(0, currentDue - (parseFloat(amount) || 0)).toLocaleString()}
              </span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              টাকা জমা কনফার্ম করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
