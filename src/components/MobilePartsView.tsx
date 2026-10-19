import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Battery,
  Zap,
  Shield,
  Camera,
  Volume2,
  Radio,
  Layers,
  Cpu,
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Filter,
  Check,
  Package,
  Layers as LayersIcon,
  Tag,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { InventoryItem } from '../types';
import {
  CATEGORY_DEFINITIONS,
  getCategoryDisplay,
  isMobilePartItem
} from '../utils/categoryHelpers';

interface MobilePartsViewProps {
  inventory: InventoryItem[];
  isMainAdmin: boolean;
  isSubAdmin: boolean;
  isPrivacyMode: boolean;
  onOpenAddItem: (defaultCategory?: string) => void;
  onOpenEditItem: (item: InventoryItem) => void;
  onAddToCart: (item: InventoryItem) => void;
  onQuickSell: (item: InventoryItem) => void;
  onOpenStockAdjust: (item: InventoryItem) => void;
  onOpenReorder: () => void;
  onInquireWhatsApp?: (item: InventoryItem) => void;
  shopPhone?: string;
  shopName?: string;
}

export const MobilePartsView: React.FC<MobilePartsViewProps> = ({
  inventory,
  isMainAdmin,
  isSubAdmin,
  isPrivacyMode,
  onOpenAddItem,
  onOpenEditItem,
  onAddToCart,
  onQuickSell,
  onOpenStockAdjust,
  onOpenReorder,
  onInquireWhatsApp,
  shopPhone = '01700000000',
  shopName = 'অনিক টেলিকম'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'stock_high' | 'stock_low' | 'price_high' | 'price_low'>('default');

  // Filter ONLY mobile parts
  const mobileParts = useMemo(() => {
    return inventory.filter(item => isMobilePartItem(item));
  }, [inventory]);

  // Available brands specifically from mobile parts
  const availableBrands = useMemo(() => {
    const defaultBrands = ['Samsung', 'Xiaomi', 'Redmi', 'Vivo', 'Oppo', 'Realme', 'Infinix', 'Tecno', 'Apple', 'itel'];
    const partsBrands = mobileParts.map(p => p.brand).filter(Boolean);
    return Array.from(new Set([...defaultBrands, ...partsBrands]));
  }, [mobileParts]);

  // Category counts within mobile parts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mobileParts.forEach(item => {
      const cat = item.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [mobileParts]);

  // Mobile parts metrics
  const partsSummary = useMemo(() => {
    let totalQty = 0;
    let totalCostVal = 0;
    let totalRetailVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const modelSet = new Set<string>();

    mobileParts.forEach(item => {
      const stock = item.stock || 0;
      totalQty += stock;
      totalCostVal += stock * (item.price || 0);
      totalRetailVal += stock * (item.sellingPrice || 0);
      if (stock === 0) outOfStockCount++;
      else if (stock < 3) lowStockCount++;

      (item.models || []).forEach(m => {
        if (m.trim()) modelSet.add(m.trim().toLowerCase());
      });
    });

    return {
      totalItems: mobileParts.length,
      totalQty,
      totalCostVal,
      totalRetailVal,
      potentialProfit: totalRetailVal - totalCostVal,
      lowStockCount,
      outOfStockCount,
      supportedModelsCount: modelSet.size
    };
  }, [mobileParts]);

  // Filtered Parts List
  const filteredParts = useMemo(() => {
    let list = [...mobileParts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const brandMatch = (item.brand || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const skuMatch = (item.sku || '').toLowerCase().includes(q);
        const modelMatch = (item.models || []).some(m => m.toLowerCase().includes(q));
        return nameMatch || brandMatch || catMatch || skuMatch || modelMatch;
      });
    }

    if (selectedBrand) {
      list = list.filter(item => (item.brand || '').toLowerCase() === selectedBrand.toLowerCase());
    }

    if (selectedCategory) {
      list = list.filter(item => (item.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (stockFilter === 'in_stock') {
      list = list.filter(item => item.stock > 0);
    } else if (stockFilter === 'low_stock') {
      list = list.filter(item => item.stock > 0 && item.stock < 3);
    } else if (stockFilter === 'out_of_stock') {
      list = list.filter(item => item.stock <= 0);
    }

    if (sortBy === 'stock_high') {
      list.sort((a, b) => b.stock - a.stock);
    } else if (sortBy === 'stock_low') {
      list.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
    } else if (sortBy === 'price_low') {
      list.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
    }

    return list;
  }, [mobileParts, searchQuery, selectedBrand, selectedCategory, stockFilter, sortBy]);

  // Parts categories definitions
  const partsCategories = CATEGORY_DEFINITIONS.filter(c => c.type === 'part');

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Specialized Mobile Parts Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-l from-cyan-500/10 via-blue-500/5 to-transparent blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-100">
                  মোবাইল পার্টস হাব (Mobile Spare Parts)
                </h1>
                <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                  শুধুমাত্র পার্টস
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ডিসপ্লে, ব্যাটারি, চার্জিং পোর্ট, ব্যাকশেল ও রিপেয়ার যন্ত্রাংশ স্টক
              </p>
            </div>
          </div>

          {(isMainAdmin || isSubAdmin) ? (
            <button
              type="button"
              onClick={() => onOpenAddItem(selectedCategory || 'Display')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ নতুন মোবাইল পার্টস যোগ</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-bold">
              <span>🌐 পাবলিক ক্যাটালগ ভিউ</span>
            </div>
          )}
        </div>

        {/* 2. Parts Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-3 relative z-10">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl">
            <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              মোট পার্টস ভ্যারাইটি
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
                {partsSummary.totalItems}
              </span>
              <span className="text-xs text-slate-500">
                {(isMainAdmin || isSubAdmin) ? `আইটেম (${partsSummary.totalQty} পিস)` : 'আইটেম তালিকা'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl">
            <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              সম্ভাব্য বিক্রয় মূল্য
            </span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {partsSummary.totalRetailVal.toLocaleString()} ৳
              </span>
            </div>
          </div>

          {isMainAdmin ? (
            <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                পার্টসে মোট ইনভেস্টমেন্ট
              </span>
              <div className="mt-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-blue-400">
                  {isPrivacyMode ? '••••••••' : `${partsSummary.totalCostVal.toLocaleString()} ৳`}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <LayersIcon className="w-3.5 h-3.5 text-blue-400" />
                ব্র্যান্ড কাভারেজ
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-blue-400">
                  {availableBrands.length}
                </span>
                <span className="text-xs text-slate-500">টি মোবাইল ব্র্যান্ড</span>
              </div>
            </div>
          )}

          <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl">
            <span className="block text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {(isMainAdmin || isSubAdmin) ? 'কম স্টক পার্টস' : 'স্টক স্ট্যাটাস'}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              {(isMainAdmin || isSubAdmin) ? (
                <>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                    {partsSummary.lowStockCount}
                  </span>
                  <span className="text-xs text-slate-500">আইটেম (&lt; ৩ পিস)</span>
                </>
              ) : (
                <span className="text-sm font-bold text-emerald-400">
                  সরাসরি সংগ্রহযোগ্য
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Repair Category Selector Ribbon (শুধুমাত্র মোবাইল পার্টসের ক্যাটাগরি) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">মোবাইল পার্টস ক্যাটাগরি নির্বাচন করুন:</span>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
            >
              সব পার্টস দেখান
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              !selectedCategory
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>সকল পার্টস ({mobileParts.length})</span>
          </button>

          {partsCategories.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={`parts_cat_${cat.id}`}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/30'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <span className="text-xs">{cat.nameBn}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-900 text-cyan-400 border border-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Smart Search, Mobile Brand Filter, and Stock Status */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="w-5 h-5 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="মোবাইলের মডেল বা পার্টস দিয়ে খুঁজুন (যেমন: Samsung A15, Y20, Note 10, Display, ব্যাটারি)..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Brand Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedBrand('')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
              !selectedBrand
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            সব ব্র্যান্ড
          </button>
          {availableBrands.map((b, idx) => (
            <button
              key={`parts_brand_${b}_${idx}`}
              onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedBrand === b
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Stock Status Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">স্টক ফিল্টার:</span>
            {[
              { id: 'all', label: 'সব পার্টস' },
              { id: 'in_stock', label: 'স্টকে আছে' },
              { id: 'low_stock', label: 'কম স্টক (<৩)' },
              { id: 'out_of_stock', label: 'স্টক খালি (০)' },
            ].map(f => (
              <button
                key={`parts_sf_${f.id}`}
                onClick={() => setStockFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  stockFilter === f.id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] text-slate-300 focus:outline-none cursor-pointer font-semibold"
            >
              <option value="default" className="bg-slate-900 text-slate-200">ডিফল্ট ক্রম</option>
              <option value="stock_high" className="bg-slate-900 text-slate-200">স্টক: বেশি থেকে কম</option>
              <option value="stock_low" className="bg-slate-900 text-slate-200">স্টক: কম থেকে বেশি</option>
              <option value="price_high" className="bg-slate-900 text-slate-200">দাম: বেশি থেকে কম</option>
              <option value="price_low" className="bg-slate-900 text-slate-200">দাম: কম থেকে বেশি</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Mobile Parts Item Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
          <span>
            প্রদর্শিত মোবাইল পার্টস: <strong className="text-cyan-400 font-mono font-bold">{filteredParts.length}</strong> টি
            {selectedBrand && <span> ({selectedBrand})</span>}
            {selectedCategory && <span> &bull; {getCategoryDisplay(selectedCategory).nameBn}</span>}
          </span>
          <span className="text-[10px] text-slate-500">
            কার্ড থেকে সরাসরি কার্ট বা সেল করুন
          </span>
        </div>

        {filteredParts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 flex items-center justify-center">
              <Smartphone className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">কোন মোবাইল পার্টস পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              খোঁজার ফিল্টার পরিবর্তন করুন অথবা নতুন মোবাইল পার্টস ইনভেন্টরিতে যোগ করুন।
            </p>
            <button
              onClick={() => onOpenAddItem(selectedCategory || 'Display')}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>নতুন মোবাইল পার্টস যোগ করুন</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredParts.map(item => {
              const catDisplay = getCategoryDisplay(item.category);
              const isLow = item.stock > 0 && item.stock < 3;
              const isOut = item.stock <= 0;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-lg hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Top: Category & Stock Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 font-bold">
                          {catDisplay.nameBn}
                        </span>
                        {item.brand && (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold">
                            {item.brand}
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isOut
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                          : isLow
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                      }`}>
                        {isOut ? 'স্টক খালি' : isLow ? `কম স্টক (${item.stock})` : `স্টক: ${item.stock}`}
                      </span>
                    </div>

                    {/* Item Name */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 leading-snug">
                        {item.name}
                      </h4>
                      {item.sku && (
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>

                    {/* Compatible Models List */}
                    {item.models && item.models.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.models.slice(0, 4).map((m, idx) => (
                          <span
                            key={`m_${item.id}_${idx}`}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            {m}
                          </span>
                        ))}
                        {item.models.length > 4 && (
                          <span className="text-[9px] text-cyan-400 self-center">
                            +{item.models.length - 4} টি মডেল
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-400">বিক্রয় মূল্য:</div>
                      <div className="text-base font-black font-mono text-emerald-400">
                        {item.sellingPrice?.toLocaleString() || 0} ৳
                      </div>
                      {isMainAdmin && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          কেনা: {isPrivacyMode ? '•••' : `${item.price || 0} ৳`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        disabled={item.stock <= 0}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 transition-colors"
                        title="কার্টে যোগ করুন"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onQuickSell(item)}
                        disabled={item.stock <= 0}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs disabled:opacity-40 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                      >
                        বিক্রি করুন
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditItem(item)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="এডিট করুন"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
