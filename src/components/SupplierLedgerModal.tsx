import React, { useState } from 'react';
import { X, Building2, Phone, Plus, DollarSign, Calendar, AlertTriangle, CheckCircle2, Share2, Trash2 } from 'lucide-react';
import { SupplierDue, DueHistoryItem } from '../types';

interface SupplierLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierDue[];
  onSaveSupplier: (supplier: SupplierDue) => void;
  onDeleteSupplier: (supplierId: string) => void;
  isAdmin: boolean;
  activeSeller: string;
}

export const SupplierLedgerModal: React.FC<SupplierLedgerModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSaveSupplier,
  onDeleteSupplier,
  isAdmin,
  activeSeller,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDue | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // New Supplier Form
  const [name, setName] = useState('');
  const [market, setMarket] = useState('');
  const [phone, setPhone] = useState('');
  const [openingBill, setOpeningBill] = useState(0);
  const [openingPaid, setOpeningPaid] = useState(0);
  const [note, setNote] = useState('');

  // Bill & Payment Form
  const [amount, setAmount] = useState(0);
  const [transactionNote, setTransactionNote] = useState('');

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('en-GB');

  // Total Supplier Debt Summary
  let totalSupplierPurchased = 0;
  let totalSupplierPaid = 0;
  suppliers.forEach(s => {
    totalSupplierPurchased += s.totalAmount || 0;
    totalSupplierPaid += s.paidAmount || 0;
  });
  const totalMohajonDue = Math.max(0, totalSupplierPurchased - totalSupplierPaid);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const suppId = 'supp_' + Date.now();
    const history: DueHistoryItem[] = [];

    if (openingBill > 0) {
      history.push({
        date: todayStr,
        type: 'due',
        amount: openingBill,
        note: note || 'প্রাথমিক পাইকারি বাকি মাল চালান',
        seller: activeSeller,
      });
    }

    if (openingPaid > 0) {
      history.push({
        date: todayStr,
        type: 'payment',
        amount: openingPaid,
        note: 'শুরুর নগদ পরিশোধ',
        seller: activeSeller,
      });
    }

    const newSupplier: SupplierDue = {
      id: suppId,
      name: name.trim(),
      market: market.trim(),
      phone: phone.trim(),
      note: note.trim(),
      totalAmount: openingBill,
      paidAmount: openingPaid,
      date: todayStr,
      history,
    };

    onSaveSupplier(newSupplier);
    setName('');
    setMarket('');
    setPhone('');
    setOpeningBill(0);
    setOpeningPaid(0);
    setNote('');
    setIsAddSupplierOpen(false);
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || amount <= 0) return;

    const updatedHistory = selectedSupplier.history ? [...selectedSupplier.history] : [];
    updatedHistory.push({
      date: todayStr,
      type: 'due',
      amount: amount,
      note: transactionNote || 'নতুন পাইকারি মালামাল ক্রয়',
      seller: activeSeller,
    });

    const updated: SupplierDue = {
      ...selectedSupplier,
      totalAmount: (selectedSupplier.totalAmount || 0) + amount,
      history: updatedHistory,
      updatedAt: todayStr,
    };

    onSaveSupplier(updated);
    setSelectedSupplier(updated);
    setAmount(0);
    setTransactionNote('');
    setIsAddBillOpen(false);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || amount <= 0) return;

    const updatedHistory = selectedSupplier.history ? [...selectedSupplier.history] : [];
    updatedHistory.push({
      date: todayStr,
      type: 'payment',
      amount: amount,
      note: transactionNote || 'মহাজনকে পাওনা পরিশোধ',
      seller: activeSeller,
    });

    const updated: SupplierDue = {
      ...selectedSupplier,
      paidAmount: (selectedSupplier.paidAmount || 0) + amount,
      history: updatedHistory,
      updatedAt: todayStr,
    };

    onSaveSupplier(updated);
    setSelectedSupplier(updated);
    setAmount(0);
    setTransactionNote('');
    setIsPaymentOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>পাইকারি মহাজন ও সাপ্লায়ার খাতা</span>
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-full font-bold">
                  {suppliers.length} জন মহাজন
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                মোতালেব প্লাজা / সুন্দরবন ও পাইকারি পার্টির বাকি এবং দেনা-পাওনা খতিয়ান
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

        {/* Top Summary Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/70 border border-red-900/40 p-3 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              মহাজনদের কাছে মোট দেনা (Payable)
            </span>
            <span className="text-xl font-black font-mono text-red-400 block mt-1">
              ৳ {totalMohajonDue.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-purple-900/40 p-3 rounded-2xl">
            <span className="text-[10px] font-bold uppercase text-purple-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              মোট মালামাল ক্রয়
            </span>
            <span className="text-xl font-black font-mono text-purple-300 block mt-1">
              ৳ {totalSupplierPurchased.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/40 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                মোট পরিশোধিত টাকা
              </span>
              <span className="text-xl font-black font-mono text-emerald-400 block mt-1">
                ৳ {totalSupplierPaid.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন মহাজন</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {suppliers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl p-6">
              <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>কোনো মহাজন বা পাইকারি পার্টির খাতা নেই।</p>
              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="mt-3 text-xs text-purple-400 font-bold underline"
              >
                + প্রথম মহাজন প্রোফাইল তৈরি করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {suppliers.map(supp => {
                const due = Math.max(0, (supp.totalAmount || 0) - (supp.paidAmount || 0));
                const isCleared = due <= 0;

                return (
                  <div
                    key={supp._fbKey || supp.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 shadow-md transition-all flex flex-col justify-between ${
                      isCleared ? 'border-slate-800 bg-slate-900/50' : 'border-purple-800/40 bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <span>{supp.name}</span>
                            {supp.market && (
                              <span className="text-[10px] text-purple-300 bg-purple-950/80 border border-purple-800/50 px-2 py-0.5 rounded font-normal">
                                {supp.market}
                              </span>
                            )}
                          </h4>
                          {supp.phone && (
                            <p className="text-xs text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <a href={`tel:${supp.phone}`} className="hover:underline">
                                {supp.phone}
                              </a>
                            </p>
                          )}
                          {supp.note && <p className="text-[11px] text-slate-400 mt-1">{supp.note}</p>}
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isCleared
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                : 'bg-red-950 text-red-400 border border-red-800/50'
                            }`}
                          >
                            {isCleared ? 'পরিশোধিত ✅' : 'দেনা আছে'}
                          </span>
                          <span className="block text-base font-black font-mono text-red-400 mt-1">
                            ৳ {due.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/70 font-mono">
                        <span>মোট ক্রয়: ৳{supp.totalAmount}</span>
                        <span>পরিশোধ: ৳{supp.paidAmount || 0}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSupplier(supp);
                            setIsAddBillOpen(true);
                          }}
                          className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
                        >
                          + চালান যোগ
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupplier(supp);
                            setIsPaymentOpen(true);
                          }}
                          className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
                        >
                          টাকা পরিশোধ
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {supp.phone && (
                          <button
                            onClick={() => {
                              const clean = supp.phone?.replace(/[^0-9]/g, '') || '';
                              const intl = clean.startsWith('0') ? '88' + clean : clean;
                              const msg = `আসসালামু আলাইকুম ${supp.name} ভাই,\nঅনিক টেলিকম থেকে যোগাযোগ করা হচ্ছে। আপনার খাতার হিসাব সম্পর্কিত আলোচনা করতে চাই।\nধন্যবাদ।`;
                              window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="p-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900 rounded-xl transition-colors"
                            title="হোয়াটসঅ্যাপ মেসেজ পাঠান"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`'${supp.name}' মহাজনের খাতা ডিলিট করতে চান?`)) {
                                onDeleteSupplier(supp.id);
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/30 rounded-xl transition-colors"
                            title="ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal 1: Create New Supplier */}
        {isAddSupplierOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>নতুন পাইকারি মহাজন যোগ</span>
                </h4>
                <button onClick={() => setIsAddSupplierOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">মহাজন / দোকানের নাম</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="যেমন: ইউনিক টেলিকম (মোতালেব প্লাজা)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">মার্কেট / ঠিকানা</label>
                    <input
                      type="text"
                      value={market}
                      onChange={e => setMarket(e.target.value)}
                      placeholder="যেমন: মোতালেব প্লাজা"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">পূর্বের বাকি চালান (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={openingBill || ''}
                      onChange={e => setOpeningBill(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-red-400 font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">পূর্বের জমা দেওয়া (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={openingPaid || ''}
                      onChange={e => setOpeningPaid(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">নোট / পার্টস বিবরণ</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="যেমন: ডিসপ্লে ও ব্যাটারি সাপ্লায়ার"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
                  >
                    মহাজন সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Add Bill to Supplier */}
        {isAddBillOpen && selectedSupplier && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>নতুন চালান যোগ ({selectedSupplier.name})</span>
                </h4>
                <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleAddBill} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">চালানের মোট মূল্য (৳)</label>
                  <input
                    type="number"
                    min="1"
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">চালান বিবরণ / ইনভয়েস নম্বর</label>
                  <input
                    type="text"
                    value={transactionNote}
                    onChange={e => setTransactionNote(e.target.value)}
                    placeholder="যেমন: ১০ পিস Vivo Y20 Display"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs"
                >
                  চালান সেভ করুন
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Record Payment to Supplier */}
        {isPaymentOpen && selectedSupplier && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>মহাজনকে টাকা পরিশোধ ({selectedSupplier.name})</span>
                </h4>
                <button onClick={() => setIsPaymentOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handlePayment} className="space-y-3">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-400">বর্তমান বকেয়া দেনা:</span>
                  <span className="font-mono font-bold text-red-400">
                    ৳ {Math.max(0, (selectedSupplier.totalAmount || 0) - (selectedSupplier.paidAmount || 0)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">পরিশোধের পরিমাণ (৳)</label>
                  <input
                    type="number"
                    min="1"
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">পরিশোধের মাধ্যম / নোট</label>
                  <input
                    type="text"
                    value={transactionNote}
                    onChange={e => setTransactionNote(e.target.value)}
                    placeholder="যেমন: বিকাশ / ব্যাংক / ক্যাশ জমা"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  পরিশোধ রেকর্ড করুন
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
