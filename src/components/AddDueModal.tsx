import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, FileText, Check, PlusCircle, AlertCircle } from 'lucide-react';
import { CustomerDue } from '../types';

interface AddDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: CustomerDue[];
  preSelectedCustomer?: CustomerDue | null;
  activeSeller: string;
  onSave: (dueData: {
    customerId?: string;
    isExisting: boolean;
    name: string;
    phone: string;
    note: string;
    amount: number;
    advancePaid: number;
  }) => void;
}

export const AddDueModal: React.FC<AddDueModalProps> = ({
  isOpen,
  onClose,
  existingCustomers,
  preSelectedCustomer,
  activeSeller,
  onSave
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDue | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [searchSuggestions, setSearchSuggestions] = useState<CustomerDue[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (preSelectedCustomer) {
      setSelectedCustomer(preSelectedCustomer);
      setName(preSelectedCustomer.name);
      setPhone(preSelectedCustomer.phone || '');
    } else {
      setSelectedCustomer(null);
      setName('');
      setPhone('');
    }
    setNote('');
    setAmount('');
    setAdvancePaid('0');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  }, [preSelectedCustomer, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!selectedCustomer && val.trim().length > 0) {
      const q = val.toLowerCase().trim();
      const matches = existingCustomers.filter(c => 
        c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
      );
      setSearchSuggestions(matches.slice(0, 5));
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectExisting = (cust: CustomerDue) => {
    setSelectedCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setShowSuggestions(false);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setName('');
    setPhone('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    const numAdvance = parseFloat(advancePaid) || 0;

    if (numAmount <= 0) {
      alert('সঠিক বাকি টাকার পরিমাণ লিখুন!');
      return;
    }

    if (!name.trim()) {
      alert('কাস্টমারের নাম লিখুন!');
      return;
    }

    onSave({
      customerId: selectedCustomer?.id,
      isExisting: !!selectedCustomer,
      name: name.trim(),
      phone: phone.trim(),
      note: note.trim() || 'সাধারণ বাকি',
      amount: numAmount,
      advancePaid: numAdvance
    });

    onClose();
  };

  const currentDueOfSelected = selectedCustomer 
    ? (selectedCustomer.totalAmount - (selectedCustomer.paidAmount || 0))
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {selectedCustomer ? 'কাস্টমারের অ্যাকাউন্টে আরো বাকি যোগ' : 'বাকির খাতা এন্ট্রি'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {selectedCustomer ? 'পূর্ববর্তী হিসাবের সাথে যুক্ত হবে' : 'নতুন বা পূর্ববর্তী কাস্টমার সিলেক্ট করুন'}
              </p>
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
          {/* If existing customer is selected */}
          {selectedCustomer ? (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> সিলেক্টেড কাস্টমার (আগের রেকর্ড আছে)
                  </span>
                  <h4 className="text-base font-bold text-slate-100 mt-0.5">{selectedCustomer.name}</h4>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-slate-400 font-mono">📞 {selectedCustomer.phone}</p>
                  )}
                </div>
                {!preSelectedCustomer && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] text-slate-400 hover:text-red-400 underline"
                  >
                    বদলান
                  </button>
                )}
              </div>
              <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center text-xs">
                <span className="text-slate-400">আগের বর্তমান বাকি:</span>
                <span className="font-mono font-bold text-red-400">৳ {currentDueOfSelected.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>গ্রাহকের নাম বা সার্চ (Customer Name)</span>
                <span className="text-[10px] text-cyan-400 font-normal">আগের নাম লিখলে নিচে সাজেস্ট আসবে</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="যেমন: রহিম ভাই / কাওসার..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all font-medium"
                  required
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-800">
                  <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    মিল পাওয়া কাস্টমার ({searchSuggestions.length}) - সিলেক্ট করতে ক্লিক করুন:
                  </div>
                  {searchSuggestions.map((cust, sIdx) => {
                    const pending = cust.totalAmount - (cust.paidAmount || 0);
                    const suggestionKey = cust._fbKey ? `sug_${cust._fbKey}` : `${cust.id || 'cust'}_${sIdx}`;
                    return (
                      <button
                        key={suggestionKey}
                        type="button"
                        onClick={() => handleSelectExisting(cust)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-800/80 flex justify-between items-center transition-colors group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400">
                            {cust.name}
                          </div>
                          {cust.phone && (
                            <div className="text-[10px] text-slate-400 font-mono">📞 {cust.phone}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">বর্তমান বাকি</span>
                          <span className="text-xs font-mono font-bold text-red-400">৳{pending}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Customer Phone (Editable if new) */}
          {!selectedCustomer && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>মোবাইল নম্বর (Customer Mobile)</span>
                <span className="text-[10px] text-slate-500">(ঐচ্ছিক)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
              />
            </div>
          )}

          {/* Details / Item Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>বাকির বিবরণ / মালামালের নাম (Item / Service Details)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="যেমন: Vivo Y20 Universal Display + Fitting"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              required
            />
          </div>

          {/* Amount and Immediate Cash Advance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                নতুন বাকির টাকা (৳)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                নগদ জমা দিল (৳)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={advancePaid}
                onChange={e => setAdvancePaid(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Preview Calculated Due */}
          {parseFloat(amount) > 0 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">এই এন্ট্রির পর নিট নতুন বাকি যোগ হবে:</span>
              <span className="font-mono font-black text-amber-400 text-sm">
                + ৳ {(Math.max(0, (parseFloat(amount) || 0) - (parseFloat(advancePaid) || 0))).toLocaleString()}
              </span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              {selectedCustomer ? 'হিসাবে বাকি যুক্ত করুন' : 'নতুন বাকি সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
