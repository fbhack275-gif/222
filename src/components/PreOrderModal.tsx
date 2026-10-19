import React, { useState, useEffect } from 'react';
import {
  X,
  PackagePlus,
  User,
  Phone,
  Calendar,
  DollarSign,
  ClipboardList,
  ShoppingBag,
  Store,
  CheckCircle,
  CreditCard,
  Percent,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ProductPreOrder } from '../types';

interface PreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSeller: string;
  onSave: (order: Omit<ProductPreOrder, 'id'>, existingId?: string) => void;
  editingOrder?: ProductPreOrder | null;
  existingCustomers?: { name: string; phone?: string }[];
}

const commonPurposes = [
  'ডিসপ্লে পরিবর্তন',
  'টাচ ও গ্লাস পরিবর্তন',
  'ব্যাটারি রিপ্লেসমেন্ট',
  'চার্জিং পোর্ট / পিন কাজ',
  'ক্যামেরা / লেন্স কাজ',
  'মাদারবোর্ড / আইসি রিপেয়ার',
  'বডি / হাউজিং ও ব্যাকশেল',
  'কাস্টমার স্পেশাল এক্সেসরিজ',
  'দোকানের সাধারণ স্টক'
];

const advanceMethods = [
  'নগদ ক্যাশ',
  'বিকাশ (bKash)',
  'নগদ (Nagad)',
  'রকেট (Rocket)',
  'ব্যাংক ট্রান্সফার'
];

export const PreOrderModal: React.FC<PreOrderModalProps> = ({
  isOpen,
  onClose,
  activeSeller,
  onSave,
  editingOrder,
  existingCustomers = []
}) => {
  const [orderType, setOrderType] = useState<'customer_order' | 'shop_demand'>('customer_order');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [modelOrCode, setModelOrCode] = useState('');
  const [qty, setQty] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('নগদ ক্যাশ');
  const [expectedDate, setExpectedDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'arrived' | 'delivered' | 'cancelled'>('pending');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingOrder) {
        setOrderType(editingOrder.type || 'customer_order');
        setItemName(editingOrder.itemName || '');
        setBrand(editingOrder.brand || '');
        setModelOrCode(editingOrder.modelOrCode || '');
        setQty(String(editingOrder.qty || 1));
        setPurpose(editingOrder.purpose || '');
        setCustomerName(editingOrder.customerName || '');
        setCustomerPhone(editingOrder.customerPhone || '');
        setEstimatedPrice(editingOrder.estimatedPrice ? String(editingOrder.estimatedPrice) : '');
        setAdvancePaid(editingOrder.advancePaid ? String(editingOrder.advancePaid) : '0');
        setAdvancePaymentMethod(editingOrder.advancePaymentMethod || 'নগদ ক্যাশ');
        setExpectedDate(editingOrder.expectedDate || '');
        setStatus(editingOrder.status || 'pending');
        setNote(editingOrder.note || '');
      } else {
        setOrderType('customer_order');
        setItemName('');
        setBrand('');
        setModelOrCode('');
        setQty('1');
        setPurpose('ডিসপ্লে পরিবর্তন');
        setCustomerName('');
        setCustomerPhone('');
        setEstimatedPrice('');
        setAdvancePaid('0');
        setAdvancePaymentMethod('নগদ ক্যাশ');
        setExpectedDate('কালকের মধ্যে');
        setStatus('pending');
        setNote('');
      }
      setErrorMessage('');
      setShowCustomerDropdown(false);
    }
  }, [isOpen, editingOrder]);

  if (!isOpen) return null;

  const totalNum = parseFloat(estimatedPrice) || 0;
  const advanceNum = parseFloat(advancePaid) || 0;
  const calculatedDue = Math.max(0, totalNum - advanceNum);

  // Quick Advance Calculation Handlers
  const handleSetAdvanceZero = () => {
    setAdvancePaid('0');
  };

  const handleSetAdvanceHalf = () => {
    if (totalNum > 0) {
      setAdvancePaid(String(Math.round(totalNum * 0.5)));
    }
  };

  const handleSetAdvanceFull = () => {
    if (totalNum > 0) {
      setAdvancePaid(String(totalNum));
    }
  };

  const handleAddAdvanceAmount = (amt: number) => {
    const cur = parseFloat(advancePaid) || 0;
    const next = cur + amt;
    setAdvancePaid(String(next));
  };

  // Filtered customer suggestions
  const customerSuggestions = customerName.trim()
    ? existingCustomers.filter(c =>
        c.name.toLowerCase().includes(customerName.toLowerCase()) ||
        (c.phone && c.phone.includes(customerName))
      ).slice(0, 5)
    : [];

  const handleSelectCustomer = (c: { name: string; phone?: string }) => {
    setCustomerName(c.name);
    if (c.phone) setCustomerPhone(c.phone);
    setShowCustomerDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMessage('পণ্যের নাম বা পার্টস এর নাম দেওয়া আবশ্যক');
      return;
    }

    if (orderType === 'customer_order' && !customerName.trim()) {
      setErrorMessage('কাস্টমারের নাম দেওয়া আবশ্যক');
      return;
    }

    setErrorMessage('');

    const parsedQty = Math.max(1, parseInt(qty) || 1);
    const todayStr = editingOrder?.orderDate || new Date().toLocaleDateString('en-GB');

    // Manage advance payment history
    let updatedHistory = editingOrder?.advanceHistory ? [...editingOrder.advanceHistory] : [];
    if (!editingOrder && advanceNum > 0) {
      updatedHistory.push({
        date: todayStr,
        amount: advanceNum,
        method: advancePaymentMethod,
        note: 'প্রাথমিক অর্ডার বুকিং বায়না'
      });
    } else if (editingOrder && advanceNum !== editingOrder.advancePaid) {
      const diff = advanceNum - editingOrder.advancePaid;
      if (diff !== 0) {
        updatedHistory.push({
          date: new Date().toLocaleDateString('en-GB'),
          amount: Math.abs(diff),
          method: advancePaymentMethod,
          note: diff > 0 ? `অতিরিক্ত বায়না জমা (+৳${diff})` : `বায়না সংশোধন (-৳${Math.abs(diff)})`
        });
      }
    }

    onSave(
      {
        type: orderType,
        itemName: itemName.trim(),
        brand: brand.trim(),
        modelOrCode: modelOrCode.trim(),
        qty: parsedQty,
        purpose: purpose.trim() || (orderType === 'customer_order' ? 'সার্ভিসিং কাজ' : 'দোকানের স্টক'),
        customerName: orderType === 'customer_order' ? customerName.trim() : '',
        customerPhone: orderType === 'customer_order' ? customerPhone.trim() : '',
        estimatedPrice: totalNum,
        advancePaid: advanceNum,
        dueAmount: calculatedDue,
        advancePaymentMethod: advanceNum > 0 ? advancePaymentMethod : undefined,
        advanceHistory: updatedHistory,
        status: editingOrder ? status : 'pending',
        orderDate: todayStr,
        expectedDate: expectedDate.trim() || 'জরুরি',
        note: note.trim(),
        seller: editingOrder?.seller || activeSeller
      },
      editingOrder?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-md">
              <PackagePlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100">
                {editingOrder
                  ? 'প্রি-অর্ডার / চাহিদা এন্ট্রি আপডেট করুন'
                  : 'নতুন পণ্য চাহিদা ও কাস্টমার প্রি-অর্ডার'}
              </h3>
              <p className="text-xs text-slate-400">
                কাস্টমার বায়না দিয়ে অর্ডার করেছে বা দোকানের মালামাল লাগবে
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-3 py-2 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              অর্ডারের ধরণ নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('customer_order')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'customer_order'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 shadow-md font-black'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>কাস্টমার অগ্রিম অর্ডার (বায়না)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('shop_demand')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  orderType === 'shop_demand'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>দোকানের স্টক চাহিদা (ফর্দ)</span>
              </button>
            </div>
          </div>

          {/* Customer Details Segment (Only if customer order) */}
          {orderType === 'customer_order' && (
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <User className="w-3.5 h-3.5" />
                <span>কাস্টমারের তথ্য (বায়না দিয়েছেন যিনি)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    কাস্টমারের নাম <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required={orderType === 'customer_order'}
                    value={customerName}
                    onChange={e => {
                      setCustomerName(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="যেমন: রাশেদ ভাই / মোঃ সুমন"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />

                  {/* Existing Customer Auto-Suggest Dropdown */}
                  {showCustomerDropdown && customerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                      <div className="text-[10px] text-slate-400 px-2.5 py-1 bg-slate-950/80 border-b border-slate-800">
                        পরিচিত কাস্টমার নির্বাচন করুন:
                      </div>
                      {customerSuggestions.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-800/50 last:border-0"
                        >
                          <span className="font-bold text-slate-200">{c.name}</span>
                          {c.phone && <span className="font-mono text-cyan-400 text-[11px]">{c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>মোবাইল নম্বর</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                পণ্যের নাম / কি পার্টস লাগবে <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="যেমন: Vivo Y20 Original Display / Samsung M21 Battery"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ব্র্যান্ড
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Vivo, Oppo..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  মডেল / কোড
                </label>
                <input
                  type="text"
                  value={modelOrCode}
                  onChange={e => setModelOrCode(e.target.value)}
                  placeholder="Y20 / BN53"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  পরিমাণ (Qty)
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-center font-bold"
                />
              </div>
            </div>

            {/* Purpose / কি কাজের জন্য অর্ডার দিয়েছে */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
                  <span>কি কাজের জন্য অর্ডার দিয়েছে (উদ্দেশ্য / সার্ভিস বিবরণ)</span>
                </span>
                <span className="text-[10px] text-slate-400">ক্লিক করে বেছে নিন</span>
              </label>

              {/* Quick Purpose Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonPurposes.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      purpose === p
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="যেমন: কাস্টমারের ফোন ডিসপ্লে ভেঙে গেছে পরিবর্তন করবে..."
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Pricing & ADVANCE PAYMENT OPTIONS SEGMENT */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>টাকা ও অগ্রিম বায়না অপশন (Advance System)</span>
              </span>
              {orderType === 'customer_order' && totalNum > 0 && (
                <span className="text-[11px] font-bold">
                  বাকি থাকবে: <strong className="text-amber-400 font-mono">৳{calculatedDue}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {orderType === 'customer_order' ? 'মোট চুক্তি মূল্য (৳)' : 'আনুমানিক কেনা মূল্য (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={estimatedPrice}
                  onChange={e => setEstimatedPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-base font-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {orderType === 'customer_order' ? 'অগ্রিম / বায়না জমা (৳)' : 'অগ্রিম দেওয়া হয়েছে (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={advancePaid}
                  onChange={e => setAdvancePaid(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-base font-black"
                />
              </div>
            </div>

            {/* Quick Advance Selector Buttons */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1.5 font-semibold">
                ⚡ দ্রুত অগ্রিম বায়না নির্ধারণ বাটন:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleSetAdvanceZero}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-bold transition-all"
                >
                  বিনা বায়না (৳০)
                </button>
                {totalNum > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSetAdvanceHalf}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 font-bold transition-all"
                    >
                      ৫০% বায়না (৳{Math.round(totalNum * 0.5)})
                    </button>
                    <button
                      type="button"
                      onClick={handleSetAdvanceFull}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 font-bold transition-all"
                    >
                      ফুল পেইড (৳{totalNum})
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleAddAdvanceAmount(200)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-mono font-bold"
                >
                  +৳২০০
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAdvanceAmount(500)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-mono font-bold"
                >
                  +৳৫০০
                </button>
                <button
                  type="button"
                  onClick={() => handleAddAdvanceAmount(1000)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-mono font-bold"
                >
                  +৳১০০০
                </button>
              </div>
            </div>

            {/* Advance Payment Method Selector (ক্যাশ / বিকাশ / ইত্যাদি) */}
            {advanceNum > 0 && (
              <div className="pt-1 border-t border-slate-800/80">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>অগ্রিম বায়না গ্রহণের মাধ্যম (Payment Method)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {advanceMethods.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAdvancePaymentMethod(m)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                        advancePaymentMethod === m
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/50 font-black shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advance Status Card */}
            {orderType === 'customer_order' && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  {advanceNum >= totalNum && totalNum > 0 ? (
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>ফুল পেইড (সম্পূর্ণ পরিশোধিত)</span>
                    </span>
                  ) : advanceNum > 0 ? (
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>বায়না জমা: ৳{advanceNum} ({advancePaymentMethod})</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      কোনো অগ্রিম বায়না নেই (বাকি প্রদেয়)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">ডেলিভারিতে প্রাপ্য</span>
                  <span className="text-amber-400 font-mono font-black text-sm">
                    ৳{calculatedDue}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Date & Status (When editing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>সম্ভাব্য পাওয়ার / ডেলিভারি তারিখ</span>
              </label>
              <input
                type="text"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                placeholder="যেমন: আজকের মধ্যে / কাল সকাল ১০টায়"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {editingOrder && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বর্তমান স্ট্যাটাস
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="pending">🟡 আনতে হবে (মার্কেট পেন্ডিং)</option>
                  <option value="arrived">🟢 দোকানে এসেছে (রেডি)</option>
                  <option value="delivered">🔵 ডেলিভারি সম্পন্ন (ক্যাশ আদায়)</option>
                  <option value="cancelled">🔴 বাতিল / রিফান্ড</option>
                </select>
              </div>
            )}
          </div>

          {/* Additional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              বিশেষ নোট বা তথ্য
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="যেমন: অরিজিনাল ফোল্ডার ছাড়া আনা যাবে না / কাস্টমার রিসিট চেয়েছে..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 rounded-2xl text-xs transition-all shadow-lg shadow-cyan-500/20 active:scale-98 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{editingOrder ? 'পরিবর্তন সংরক্ষণ করুন' : 'তালিকায় এন্ট্রি সেভ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
