import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Check, Calendar, FileText, Plus, Clock } from 'lucide-react';
import { ShopExpense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSeller: string;
  onSaveExpense: (expense: Omit<ShopExpense, 'id'>, existingId?: string) => void;
  recentExpenses?: ShopExpense[];
  editingExpense?: ShopExpense | null;
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

const quickAmounts = [20, 50, 100, 200, 500, 1000];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  activeSeller,
  onSaveExpense,
  recentExpenses = [],
  editingExpense = null
}) => {
  const [category, setCategory] = useState(expenseCategories[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        if (expenseCategories.includes(editingExpense.category)) {
          setCategory(editingExpense.category);
          setCustomCategory('');
        } else {
          setCategory('অন্যান্য বিবিধ খরচ');
          setCustomCategory(editingExpense.category || '');
        }
        setAmount(String(editingExpense.amount || ''));
        setNote(editingExpense.note || '');
        const parts = (editingExpense.date || '').split('/');
        if (parts.length === 3) {
          setDate(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        } else {
          setDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        setCategory(expenseCategories[0]);
        setCustomCategory('');
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().split('T')[0]);
      }
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, editingExpense]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      setError('সঠিক খরচের পরিমাণ (টাকা) লিখুন!');
      return;
    }

    const finalCategory = (category === 'অন্যান্য বিবিধ খরচ' && customCategory.trim())
      ? customCategory.trim()
      : category;

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [y, m, d] = date.split('-');
    const formattedDate = (y && m && d) ? `${d}/${m}/${y}` : (editingExpense?.date || new Date().toLocaleDateString('en-GB'));

    setIsSubmitting(true);
    setError('');

    try {
      onSaveExpense(
        {
          category: finalCategory,
          amount: numAmount,
          note: note.trim() || finalCategory,
          date: formattedDate,
          seller: editingExpense?.seller || activeSeller || 'অপারেটর'
        },
        editingExpense?.id
      );

      setAmount('');
      setNote('');
      onClose();
    } catch (err) {
      setError('খরচ সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100">
                {editingExpense ? 'দোকান খরচ এডিট ও সংশোধন করুন' : 'দৈনিক দোকান খরচ এন্ট্রি'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {editingExpense ? 'ভুল খরচের তথ্য পরিবর্তন করে আপডেট করুন' : 'লাভের হিসাব থেকে স্বয়ংক্রিয় বাদ যাবে ও ক্যাশে মিলবে'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-bold text-center animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>খরচের খাত (Category)</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500 font-medium"
            >
              {expenseCategories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
            {category === 'অন্যান্য বিবিধ খরচ' && (
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                placeholder="খরচের খাতের নির্দিষ্ট নাম লিখুন (যেমন: চক বাজার বাজার)"
                className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            )}
          </div>

          {/* Amount input & Quick preset buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-red-400" />
                <span>খরচের পরিমাণ (৳) *</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">টাকায় লিখুন</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-black text-red-400 text-base">৳</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-lg font-mono font-black text-red-400 focus:outline-none focus:border-red-500 shadow-inner"
                required
                autoFocus
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {quickAmounts.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500/50 text-[11px] font-mono text-slate-300 hover:text-white transition-all active:scale-95"
                >
                  +{preset}৳
                </button>
              ))}
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>বিবরণ / মন্তব্য (Note)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="যেমন: দুপুরের খাবার, চা বিস্কুট বা গাড়ি ভাড়া"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Date & Operator */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>তারিখ</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>খরচকারী / স্টাফ</span>
              </label>
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 truncate font-semibold">
                {activeSeller || 'অপারেটর'}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs shadow-lg shadow-red-950/40 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'সেভ হচ্ছে...' : editingExpense ? 'খরচ আপডেট সম্পন্ন করুন' : 'দোকান খরচ সেভ করুন'}</span>
            </button>
          </div>
        </form>

        {/* Recent Expenses Footer Preview */}
        {recentExpenses.length > 0 && (
          <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="font-semibold">আজকের সাম্প্রতিক খরচসমূহ:</span>
              <span className="font-mono text-red-400 font-bold">
                মোট {recentExpenses.length} টি
              </span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {recentExpenses.slice(0, 3).map((exp, idx) => (
                <div
                  key={exp.id || `re_${idx}`}
                  className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                >
                  <span className="truncate max-w-[180px]">{exp.category} · {exp.note}</span>
                  <span className="font-mono font-bold text-red-400">- ৳{exp.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
