import React, { useState } from 'react';
import { X, DollarSign, Tag, Check, Calendar, FileText } from 'lucide-react';
import { ShopExpense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSeller: string;
  onSaveExpense: (expense: Omit<ShopExpense, 'id'>) => void;
}

const expenseCategories = [
  'নাস্তা ও চা-পানি',
  'দোকান ভাড়া',
  'বিদ্যুৎ ও ওয়াইফাই বিল',
  'পার্টস পরিবহন ও যাতায়াত',
  'স্টাফ বেতন / বোনাস',
  'মেরামত যন্ত্রপাতি ও কেমিক্যাল',
  'অন্যান্য বিবিধ খরচ'
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  activeSeller,
  onSaveExpense
}) => {
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      alert('সঠিক খরচের পরিমাণ লিখুন!');
      return;
    }

    onSaveExpense({
      category,
      amount: numAmount,
      note: note.trim() || category,
      date: new Date().toLocaleDateString('en-GB'),
      seller: activeSeller
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">দৈনিক দোকান খরচ এন্ট্রি</h3>
              <p className="text-[10px] text-slate-400">লাভের হিসাব থেকে স্বয়ংক্রিয় বাদ যাবে</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>খরচের খাত (Category)</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
            >
              {expenseCategories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>খরচের পরিমাণ (৳)</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono font-bold text-red-400 focus:outline-none focus:border-red-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>বিবরণ / মন্তব্য (Note)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="যেমন: দুপুরের খাবার ও বিস্কুট"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>খরচ সেভ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
