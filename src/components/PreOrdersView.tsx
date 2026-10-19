import React, { useState } from 'react';
import {
  PackagePlus,
  Search,
  Plus,
  ShoppingBag,
  Store,
  Phone,
  MessageSquare,
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Check,
  Copy,
  Share2,
  Calendar,
  DollarSign,
  CreditCard,
  Sparkles,
  ArrowRight,
  X,
  Send
} from 'lucide-react';
import { ProductPreOrder, ReceiptData } from '../types';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface PreOrdersViewProps {
  orders: ProductPreOrder[];
  onOpenAdd: () => void;
  onOpenEdit: (order: ProductPreOrder) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: 'pending' | 'arrived' | 'delivered' | 'cancelled') => void;
  onPrintSlip: (receipt: ReceiptData) => void;
  activeSeller: string;
  onAddExtraAdvance?: (orderId: string, additionalAmount: number, method: string) => void;
  onSettleBalance?: (orderId: string) => void;
}

export const PreOrdersView: React.FC<PreOrdersViewProps> = ({
  orders,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onUpdateStatus,
  onPrintSlip,
  activeSeller,
  onAddExtraAdvance,
  onSettleBalance
}) => {
  const [filterType, setFilterType] = useState<
    'all' | 'customer' | 'shop' | 'pending' | 'arrived' | 'delivered' | 'fully_paid' | 'has_due'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMarketList, setCopiedMarketList] = useState(false);

  // Quick Advance Modal State
  const [extraAdvanceTargetOrder, setExtraAdvanceTargetOrder] = useState<ProductPreOrder | null>(null);
  const [extraAdvanceAmount, setExtraAdvanceAmount] = useState('');
  const [extraAdvanceMethod, setExtraAdvanceMethod] = useState('নগদ ক্যাশ');
  const [extraAdvanceError, setExtraAdvanceError] = useState('');

  // Filtered orders
  const filteredOrders = orders.filter(ord => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ord.itemName.toLowerCase().includes(q);
      const matchBrand = (ord.brand || '').toLowerCase().includes(q);
      const matchModel = (ord.modelOrCode || '').toLowerCase().includes(q);
      const matchCust = (ord.customerName || '').toLowerCase().includes(q);
      const matchPhone = (ord.customerPhone || '').includes(q);
      const matchPurpose = (ord.purpose || '').toLowerCase().includes(q);
      const matchSeller = (ord.seller || '').toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchModel && !matchCust && !matchPhone && !matchPurpose && !matchSeller) {
        return false;
      }
    }

    // Type / Status / Payment filters
    if (filterType === 'customer') return ord.type === 'customer_order';
    if (filterType === 'shop') return ord.type === 'shop_demand';
    if (filterType === 'pending') return ord.status === 'pending';
    if (filterType === 'arrived') return ord.status === 'arrived';
    if (filterType === 'delivered') return ord.status === 'delivered';
    if (filterType === 'fully_paid') return ord.type === 'customer_order' && ord.dueAmount <= 0;
    if (filterType === 'has_due') return ord.type === 'customer_order' && ord.dueAmount > 0;

    return true;
  });

  // Summary Metrics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const arrivedOrdersCount = orders.filter(o => o.status === 'arrived').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;

  const customerOrders = orders.filter(o => o.type === 'customer_order' && o.status !== 'cancelled');
  const totalAdvanceHeld = customerOrders
    .filter(o => o.status !== 'delivered')
    .reduce((sum, o) => sum + (o.advancePaid || 0), 0);
  const totalDueToCollect = customerOrders
    .filter(o => o.status !== 'delivered')
    .reduce((sum, o) => sum + (o.dueAmount || 0), 0);

  // Generate Customer Arrival WhatsApp Notice
  const handleNotifyCustomer = (order: ProductPreOrder) => {
    if (!order.customerPhone) {
      alert('কাস্টমারের মোবাইল নম্বর নেই। এডিট বাটনে ক্লিক করে নম্বর যোগ করুন।');
      return;
    }
    const msg =
      `*অনিক টেলিকম - পণ্য আগমন নোটিফিকেশন*\n` +
      `আসসালামু আলাইকুম ${order.customerName || 'গ্রাহক'},\n` +
      `আপনার অর্ডার করা মালামালটি দোকানে এসে পৌঁছেছে!\n` +
      `---------------------------\n` +
      `পণ্য: ${order.itemName} ${order.modelOrCode ? `(${order.modelOrCode})` : ''}\n` +
      `কাজের বিবরণ: ${order.purpose}\n` +
      `মোট চুক্তি মূল্য: ৳${order.estimatedPrice}\n` +
      `অগ্রিম বায়না জমা ছিল: ৳${order.advancePaid}\n` +
      `*ডেলিভারির সময় অবশিষ্ট প্রদেয় বাকি: ৳${order.dueAmount}*\n` +
      `---------------------------\n` +
      `দয়া করে দোকানে এসে আপনার পণ্যটি সংগ্রহ করুন।\n` +
      `- অনিক টেলিকম (মোবাইল সার্ভিসিং ও পার্টস বিক্রয় কেন্দ্র)`;

    sendWhatsAppMessage(order.customerPhone, msg);
  };

  // Generate Wholesale Market Purchase List (পাইকারি বাজার কেনাকাটার ফর্দ)
  const generateWholesaleMarketList = () => {
    const pendingItems = orders.filter(o => o.status === 'pending');
    let text = `*অনিক টেলিকম - পাইকারি বাজার মালামাল ফর্দ*\n`;
    text += `তারিখ: ${new Date().toLocaleDateString('en-GB')}\n`;
    text += `মোট প্রয়োজন: ${pendingItems.length} টি পার্টস/আইটেম\n`;
    text += `------------------------------------\n`;

    pendingItems.forEach((it, idx) => {
      text += `${idx + 1}. ${it.itemName}`;
      if (it.brand || it.modelOrCode) {
        text += ` [${[it.brand, it.modelOrCode].filter(Boolean).join(' - ')}]`;
      }
      text += ` - পরিমাণ: ${it.qty || 1} পিস\n`;
      if (it.type === 'customer_order') {
        text += `   (কাস্টমার বায়না করা: ${it.customerName ? it.customerName : 'কাস্টমার'} - কাজ: ${it.purpose})\n`;
      } else {
        text += `   (দোকানের নিজস্ব স্টক)\n`;
      }
    });

    text += `------------------------------------\n`;
    text += `দয়া করে জরুরি ভিত্তিতে মালামাল সরবরাহ করুন।\n- মোঃ অনিক হোসেন, অনিক টেলিকম`;
    return text;
  };

  const handleCopyMarketList = () => {
    navigator.clipboard.writeText(generateWholesaleMarketList());
    setCopiedMarketList(true);
    setTimeout(() => setCopiedMarketList(false), 2000);
  };

  const handleShareMarketListWhatsApp = () => {
    sendWhatsAppMessage('', generateWholesaleMarketList());
  };

  // Generate Token Slip
  const handlePrintSlip = (order: ProductPreOrder) => {
    const receipt: ReceiptData = {
      title: order.type === 'customer_order' ? 'কাস্টমার প্রি-অর্ডার ও বায়না রসিদ' : 'দোকান মালামাল রিকুইজিশন',
      type: 'preorder_token',
      date: order.orderDate || new Date().toLocaleDateString('en-GB'),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: [
        {
          name: `${order.itemName} ${order.modelOrCode ? `(${order.modelOrCode})` : ''} - [${order.purpose}]`,
          qty: order.qty || 1,
          rate: order.estimatedPrice,
          amount: order.estimatedPrice
        }
      ],
      subtotal: order.estimatedPrice,
      paid: order.advancePaid,
      due: order.dueAmount,
      seller: order.seller || activeSeller,
      note: `সম্ভাব্য ডেলিভারি: ${order.expectedDate || 'শীঘ্রই'} | পেমেন্ট মাধ্যম: ${order.advancePaymentMethod || 'ক্যাশ'} | স্ট্যাটাস: ${
        order.status === 'pending' ? 'মার্কেট থেকে আনার বাকি' : 'দোকানে রেডি'
      }`
    };
    onPrintSlip(receipt);
  };

  // Submit Extra Advance
  const handleExtraAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraAdvanceTargetOrder) return;
    const amt = parseFloat(extraAdvanceAmount) || 0;
    if (amt <= 0) {
      setExtraAdvanceError('টাকার পরিমাণ ০ এর বেশি হতে হবে');
      return;
    }
    if (amt > extraAdvanceTargetOrder.dueAmount) {
      setExtraAdvanceError(`বাকি আছে মাত্র ৳${extraAdvanceTargetOrder.dueAmount}! এর বেশি গ্রহণ করা যাবে না।`);
      return;
    }

    if (onAddExtraAdvance) {
      onAddExtraAdvance(extraAdvanceTargetOrder.id, amt, extraAdvanceMethod);
    }
    setExtraAdvanceTargetOrder(null);
    setExtraAdvanceAmount('');
    setExtraAdvanceError('');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-10 animate-in fade-in duration-200">
      {/* 1. Summary Bento Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <PackagePlus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                  প্রোডাক্ট চাহিদা ও কাস্টমার প্রি-অর্ডার খাতা
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                  ADVANCE HUB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                কাস্টমার অগ্রিম টাকা দিয়ে অর্ডার করা মালামাল ও দোকানের চাহিদা লিস্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyMarketList}
              className="px-3 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="মার্কেট থেকে আনার জন্য পেন্ডিং সকল মালামালের তালিকা কপি করুন"
            >
              {copiedMarketList ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedMarketList ? 'ফর্দ কপি হয়েছে' : 'বাজার ফর্দ কপি'}</span>
            </button>

            <button
              onClick={handleShareMarketListWhatsApp}
              className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
              title="মহাজন বা পার্টস সাপ্লায়ারকে হোয়াটসঅ্যাপে বাজার ফর্দ পাঠান"
            >
              <Share2 className="w-4 h-4" />
              <span>মহাজন ফর্দ পাঠান</span>
            </button>

            <button
              onClick={onOpenAdd}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ নতুন অর্ডার / চাহিদা যোগ</span>
            </button>
          </div>
        </div>

        {/* 4-Column Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-4">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 block">মোট এন্ট্রি ও চাহিদা</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-100">
                {totalOrdersCount}
              </span>
              <span className="text-[10px] text-slate-400">টি আইটেম</span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>মার্কেট থেকে আনার বাকি</span>
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                {pendingOrdersCount}
              </span>
              <span className="text-[10px] text-amber-400">টি পেন্ডিং</span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>কাস্টমার অগ্রিম বায়না জমা</span>
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
                ৳{totalAdvanceHeld.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ডেলিভারিতে বাকি আদায়যোগ্য</span>
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                ৳{totalDueToCollect.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="কাস্টমার নাম, মোবাইল, পণ্যের নাম, মডেল বা উদ্দেশ্য দিয়ে সার্চ করুন..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
            >
              মুছুন
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            সব ({orders.length})
          </button>

          <button
            onClick={() => setFilterType('customer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'customer'
                ? 'bg-cyan-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>কাস্টমার বায়না ({orders.filter(o => o.type === 'customer_order').length})</span>
          </button>

          <button
            onClick={() => setFilterType('shop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'shop'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>দোকান চাহিদা ({orders.filter(o => o.type === 'shop_demand').length})</span>
          </button>

          <button
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>🟡 পেন্ডিং ({pendingOrdersCount})</span>
          </button>

          <button
            onClick={() => setFilterType('arrived')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'arrived'
                ? 'bg-emerald-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>🟢 দোকানে এসেছে ({arrivedOrdersCount})</span>
          </button>

          <button
            onClick={() => setFilterType('delivered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'delivered'
                ? 'bg-blue-600 text-white shadow font-black'
                : 'bg-slate-900 text-blue-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>🔵 ডেলিভারি সম্পন্ন ({deliveredOrdersCount})</span>
          </button>

          <button
            onClick={() => setFilterType('has_due')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'has_due'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>⏳ বাকি আছে ({orders.filter(o => o.type === 'customer_order' && o.dueAmount > 0).length})</span>
          </button>

          <button
            onClick={() => setFilterType('fully_paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filterType === 'fully_paid'
                ? 'bg-emerald-500 text-slate-950 shadow font-black'
                : 'bg-slate-900 text-emerald-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>💳 ফুল পেইড ({orders.filter(o => o.type === 'customer_order' && o.dueAmount <= 0).length})</span>
          </button>
        </div>
      </div>

      {/* 3. Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <PackagePlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            {searchQuery ? 'সার্চের সাথে কোনো মিল পাওয়া যায়নি' : 'এখনো কোনো প্রি-অর্ডার বা চাহিদা তালিকা নেই'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            কাস্টমার কোনো পণ্য আগে টাকা দিয়ে অর্ডার করলে বা দোকানের জন্য কোনো পার্টস দরকার হলে উপরের বাটনে ক্লিক করে লিস্ট করুন।
          </p>
          <button
            onClick={onOpenAdd}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-black text-xs inline-flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>নতুন প্রি-অর্ডার এন্ট্রি করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredOrders.map(order => {
            const isCustomer = order.type === 'customer_order';
            const isPending = order.status === 'pending';
            const isArrived = order.status === 'arrived';
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled';
            const isFullyPaid = isCustomer && order.dueAmount <= 0;

            return (
              <div
                key={order.id}
                className={`rounded-3xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all shadow-lg hover:border-slate-700 ${
                  isDelivered
                    ? 'bg-slate-950/40 border-slate-900 opacity-85'
                    : isArrived
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Card Top: Badges & Title */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isCustomer ? (
                        <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-black flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>কাস্টমার প্রি-অর্ডার</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>দোকান স্টক চাহিদা</span>
                        </span>
                      )}

                      {/* Status Tag */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black border flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isArrived
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse'
                            : isDelivered
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {isPending && '🟡 আনতে হবে'}
                        {isArrived && '🟢 দোকানে এসেছে (রেডি)'}
                        {isDelivered && '🔵 ডেলিভারি সম্পন্ন'}
                        {isCancelled && '🔴 বাতিল'}
                      </span>

                      {/* Payment Status Tag */}
                      {isCustomer && (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                            isFullyPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : order.advancePaid > 0
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isFullyPaid ? '✓ ফুল পেইড' : order.advancePaid > 0 ? `৳${order.advancePaid} বায়না` : 'বিনা বায়না'}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      📅 {order.orderDate}
                    </span>
                  </div>

                  {/* Product Title */}
                  <div>
                    <h3 className="text-base font-black text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{order.itemName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold">
                        {order.qty || 1} পিস
                      </span>
                    </h3>
                    {(order.brand || order.modelOrCode) && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[order.brand, order.modelOrCode].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Purpose Box (কি কাজের জন্য অর্ডার দিয়েছে) */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 text-xs flex items-start gap-2">
                    <span className="font-bold text-cyan-400 shrink-0 mt-0.5">কাজের উদ্দেশ্য:</span>
                    <span className="text-slate-200 font-semibold">{order.purpose}</span>
                  </div>

                  {/* Customer Information if customer order */}
                  {isCustomer && (
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">কাস্টমার:</span>
                          <span className="text-white font-black">{order.customerName || 'নামহীন'}</span>
                        </div>
                        {order.customerPhone && (
                          <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                            📞 {order.customerPhone}
                          </div>
                        )}
                      </div>

                      {order.customerPhone && (
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all active:scale-95"
                            title="সরাসরি কল দিন"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleNotifyCustomer(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                            title="কাস্টমারকে হোয়াটসঅ্যাপে জানান যে মাল এসে গেছে"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>মেসেজ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price & Advance Matrix */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/50 rounded-2xl p-2.5 border border-slate-800/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">মোট মূল্য</span>
                      <strong className="text-xs font-mono text-slate-200">
                        ৳{order.estimatedPrice || 0}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block flex items-center justify-center gap-0.5">
                        <span>অগ্রিম বায়না</span>
                      </span>
                      <strong className="text-xs font-mono text-emerald-300 font-black">
                        ৳{order.advancePaid || 0}
                      </strong>
                      {order.advancePaymentMethod && order.advancePaid > 0 && (
                        <span className="text-[9px] text-emerald-400/80 block mt-0.5 font-sans">
                          ({order.advancePaymentMethod})
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-400 font-bold block">বাকি প্রদেয়</span>
                      <strong className={`text-xs font-mono font-black ${order.dueAmount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                        ৳{order.dueAmount || 0}
                      </strong>
                      {order.dueAmount <= 0 && isCustomer && (
                        <span className="text-[9px] text-emerald-400 block mt-0.5 font-bold">
                          ফুল পেইড
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Advance Options Quick Action Bar (If due amount > 0) */}
                  {isCustomer && order.dueAmount > 0 && !isDelivered && (
                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>বায়না / বাকি অপশন:</span>
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Add More Advance */}
                        <button
                          onClick={() => {
                            setExtraAdvanceTargetOrder(order);
                            setExtraAdvanceAmount('');
                            setExtraAdvanceMethod('নগদ ক্যাশ');
                            setExtraAdvanceError('');
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all active:scale-95"
                          title="কাস্টমার থেকে আরও অতিরিক্ত বায়না জমা নিন"
                        >
                          + অতিরিক্ত বায়না
                        </button>

                        {/* Settle Remaining Due */}
                        {onSettleBalance && (
                          <button
                            onClick={() => onSettleBalance(order.id)}
                            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition-all active:scale-95"
                            title="বাকি সম্পূর্ণ আদায় করে ডেলিভারি মার্ক করুন"
                          >
                            বাকি পরিশোধ (৳{order.dueAmount})
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Expectation & Notes */}
                  {(order.expectedDate || order.note) && (
                    <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                      {order.expectedDate && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>সম্ভাব্য ডেলিভারি: <strong className="text-white">{order.expectedDate}</strong></span>
                        </div>
                      )}
                      {order.note && (
                        <div className="text-slate-400 italic">
                          নোট: {order.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom: Status Quick Select & Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
                  {/* Status Toggle Buttons */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold shrink-0">স্ট্যাটাস:</span>
                    <div className="grid grid-cols-3 gap-1 flex-1">
                      <button
                        onClick={() => onUpdateStatus(order.id, 'pending')}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          order.status === 'pending'
                            ? 'bg-amber-500 text-slate-950 font-black shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        পেন্ডিং
                      </button>

                      <button
                        onClick={() => onUpdateStatus(order.id, 'arrived')}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          order.status === 'arrived'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        এসেছে
                      </button>

                      <button
                        onClick={() => onUpdateStatus(order.id, 'delivered')}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
                          order.status === 'delivered'
                            ? 'bg-blue-600 text-white font-black shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        ডেলিভারি
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[10px] text-slate-500">
                      অপারেটর: <span className="text-slate-400">{order.seller}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Print Token/Receipt */}
                      <button
                        onClick={() => handlePrintSlip(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                        title="বায়না বা প্রি-অর্ডার স্লিপ প্রিন্ট করুন"
                      >
                        <Printer className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">স্লিপ</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => onOpenEdit(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                        title="এন্ট্রি এডিট ও সংশোধন করুন"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>এডিট</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (confirm(`আপনি কি নিশ্চিত "${order.itemName}" তালিকা থেকে মুছে ফেলতে চান?`)) {
                            onDelete(order.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-all active:scale-95"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK MODAL: ADD EXTRA ADVANCE PAYMENT */}
      {extraAdvanceTargetOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">অতিরিক্ত বায়না জমা নিন</h3>
              </div>
              <button
                onClick={() => setExtraAdvanceTargetOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <div className="font-bold text-white flex justify-between">
                <span>{extraAdvanceTargetOrder.itemName}</span>
                <span className="text-cyan-400">৳{extraAdvanceTargetOrder.estimatedPrice}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>কাস্টমার: {extraAdvanceTargetOrder.customerName}</span>
                <span>জমা ছিল: ৳{extraAdvanceTargetOrder.advancePaid}</span>
              </div>
              <div className="text-amber-400 font-bold flex justify-between pt-1 border-t border-slate-800/80">
                <span>অবশিষ্ট বাকি আছে:</span>
                <span className="font-mono">৳{extraAdvanceTargetOrder.dueAmount}</span>
              </div>
            </div>

            {extraAdvanceError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-3 py-2 rounded-xl">
                {extraAdvanceError}
              </div>
            )}

            <form onSubmit={handleExtraAdvanceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  এখন কত টাকা বায়না দিচ্ছেন (৳)
                </label>
                <input
                  type="number"
                  min="1"
                  max={extraAdvanceTargetOrder.dueAmount}
                  step="any"
                  autoFocus
                  required
                  value={extraAdvanceAmount}
                  onChange={e => setExtraAdvanceAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-black font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setExtraAdvanceAmount(String(extraAdvanceTargetOrder.dueAmount))}
                  className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                >
                  সম্পূর্ণ বাকি (৳{extraAdvanceTargetOrder.dueAmount})
                </button>
                {extraAdvanceTargetOrder.dueAmount >= 200 && (
                  <button
                    type="button"
                    onClick={() => setExtraAdvanceAmount('200')}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono"
                  >
                    ৳২০০
                  </button>
                )}
                {extraAdvanceTargetOrder.dueAmount >= 500 && (
                  <button
                    type="button"
                    onClick={() => setExtraAdvanceAmount('500')}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono"
                  >
                    ৳৫০০
                  </button>
                )}
                {extraAdvanceTargetOrder.dueAmount >= 1000 && (
                  <button
                    type="button"
                    onClick={() => setExtraAdvanceAmount('1000')}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-mono"
                  >
                    ৳১০০০
                  </button>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['নগদ ক্যাশ', 'বিকাশ (bKash)', 'নগদ (Nagad)', 'রকেট (Rocket)'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExtraAdvanceMethod(m)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        extraAdvanceMethod === m
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setExtraAdvanceTargetOrder(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>জমা করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
