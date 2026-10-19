import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  User,
  Phone,
  Search,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { InventoryItem, CustomerDue, ReceiptData } from '../types';

export interface CartItem {
  item: InventoryItem;
  qty: number;
  price: number; // selling unit price
}

interface PosCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  inventory: InventoryItem[];
  onAddToCart: (item: InventoryItem) => void;
  existingCustomers: CustomerDue[];
  activeSeller: string;
  onCheckout: (checkoutData: {
    cart: CartItem[];
    customerName: string;
    customerPhone: string;
    discount: number;
    paidAmount: number;
    isBaki: boolean;
    note: string;
  }) => void;
  onOpenCashMemoStudio?: () => void;
}

export const PosCartModal: React.FC<PosCartModalProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  inventory,
  onAddToCart,
  existingCustomers,
  activeSeller,
  onCheckout,
  onOpenCashMemoStudio,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isBaki, setIsBaki] = useState(false);
  const [note, setNote] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  if (!isOpen) return null;

  // Cart calculations
  const subtotal = cart.reduce((sum, ci) => sum + ci.qty * ci.price, 0);
  const numDiscount = Math.max(0, parseFloat(discount) || 0);
  const numPaidAmount = Math.max(0, parseFloat(paidAmount) || 0);
  const finalTotal = Math.max(0, subtotal - numDiscount);
  const effectivePaid = isBaki ? Math.min(finalTotal, numPaidAmount) : finalTotal;
  const dueAmount = Math.max(0, finalTotal - effectivePaid);

  // Quick product search for cart
  const searchResults = itemSearch.trim()
    ? inventory
        .filter(i => {
          const q = itemSearch.toLowerCase();
          return (
            String(i.name || '').toLowerCase().includes(q) ||
            String(i.brand || '').toLowerCase().includes(q) ||
            String(i.sku || '').toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  // Filtered customer suggestions
  const customerSuggestions = customerSearch.trim()
    ? existingCustomers
        .filter(c => {
          const q = customerSearch.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q))
          );
        })
        .slice(0, 4)
    : [];

  const handleSelectCustomer = (c: CustomerDue) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    onCheckout({
      cart,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      discount: numDiscount,
      paidAmount: effectivePaid,
      isBaki: isBaki && dueAmount > 0,
      note: note.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
              <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>মাল্টি-আইটেম ক্যাশ মেমো ও কার্ট</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-mono font-bold">
                  {cart.length} টি পার্টস
                </span>
              </h3>
              <p className="text-xs text-slate-400">একসাথে একাধিক পার্টস বিক্রির দ্রুত বিলিং</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 transition-all font-semibold"
                title="কার্ট খালি করুন"
              >
                খালি করুন
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Search & Add product to cart */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                placeholder="কার্টে আরও পার্টস বা ডিসপ্লে যোগ করতে নাম / মডেল লিখুন..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
              />
              {itemSearch && (
                <button
                  type="button"
                  onClick={() => setItemSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl space-y-1">
                {searchResults.map(item => (
                  <div
                    key={`search_${item.id}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.brand} · স্টক: {item.stock} টি · ৳{item.sellingPrice}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(item);
                        setItemSearch('');
                      }}
                      className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> যোগ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-3xl border border-slate-800/80 space-y-2">
              <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">কার্ট বর্তমানে খালি</p>
              <p className="text-xs text-slate-500">
                উপরের সার্চ বক্স বা স্টক তালিকা থেকে "কার্টে যোগ" বাটনে চাপ দিয়ে পার্টস যোগ করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(ci => {
                const maxStock = ci.item.stock || 999;
                return (
                  <div
                    key={`cart_${ci.item.id}`}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition-all hover:border-slate-700"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{ci.item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{ci.item.brand}</span>
                        <span>·</span>
                        <span>দর: ৳{ci.price}</span>
                        <span>·</span>
                        <span className="text-cyan-400">স্টক আছে: {maxStock} টি</span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(ci.item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200 active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-cyan-300">
                        {ci.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (ci.qty < maxStock) {
                            onUpdateQty(ci.item.id, 1);
                          }
                        }}
                        disabled={ci.qty >= maxStock}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center active:scale-95 ${
                          ci.qty >= maxStock
                            ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[70px]">
                      <span className="block text-xs font-black font-mono text-emerald-400">
                        ৳{(ci.qty * ci.price).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(ci.item.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 mt-0.5 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        বাদ দিন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Checkout Details (Customer, Discount, Baki) */}
          {cart.length > 0 && (
            <form onSubmit={handleSubmitCheckout} className="space-y-4 pt-2 border-t border-slate-800/80">
              {/* Customer Info */}
              <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ক্রেতার তথ্য (Customer Info)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ঐচ্ছিক / বাকি থাকলে আবশ্যক</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => {
                        setCustomerName(e.target.value);
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="কাস্টমারের নাম (যেমন: করিম ভাই)"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />

                    {/* Customer autocomplete */}
                    {showCustomerDropdown && customerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-xl space-y-1">
                        {customerSuggestions.map(cs => (
                          <div
                            key={`cs_${cs.id}`}
                            onClick={() => handleSelectCustomer(cs)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs"
                          >
                            <span className="font-bold text-slate-200">{cs.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono">
                              বাকি: ৳{Math.max(0, cs.totalAmount - (cs.paidAmount || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="মোবাইল নম্বর (017XXXXXXXX)"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Discount & Totals Grid */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>মোট পার্টস মূল্য (Subtotal):</span>
                  <span className="font-mono font-bold text-slate-200">৳{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">বিশেষ ছাড় / ডিসকাউন্ট (৳):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-mono font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-right font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">সর্বমোট প্রদেয় বিল (Net Payable):</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    ৳{finalTotal.toLocaleString()}
                  </span>
                </div>

                {/* Baki Toggle */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBaki}
                      onChange={e => setIsBaki(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-400">
                      বাকি বিল / আংশিক পরিশোধ (Add to Baki Khata)
                    </span>
                  </label>

                  {isBaki && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">নগদ জমা:</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        max={finalTotal}
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        placeholder="0"
                        className="w-24 bg-slate-900 border border-amber-600/60 rounded-xl px-2.5 py-1 text-xs text-right font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                {isBaki && dueAmount > 0 && (
                  <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/50 flex justify-between items-center text-xs">
                    <span className="text-red-300 font-bold">বাকি অ্যাকাউন্টে যুক্ত হবে:</span>
                    <span className="font-mono font-black text-red-400">৳{dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Checkout Submit Button & Custom Cash Memo Studio Button */}
              <div className="space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>বিল কনফার্ম ও মেমো প্রিন্ট করুন (৳{finalTotal.toLocaleString()})</span>
                </button>

                {onOpenCashMemoStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCashMemoStudio();
                    }}
                    className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>🧾 কার্টের সব আইটেম কাস্টম প্রো ক্যাশ মেমোতে নিয়ে যান</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
