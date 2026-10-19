import React from 'react';
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
  Plug,
  Headphones,
  Disc,
  HardDrive,
  Package,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import {
  CATEGORY_DEFINITIONS,
  getCategoryDisplay,
  isMobilePartItem
} from '../utils/categoryHelpers';

interface ProfessionalCategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  categoryScope: 'all' | 'parts' | 'accessories';
  onSelectCategoryScope: (scope: 'all' | 'parts' | 'accessories') => void;
  partsTotalCount: number;
  accessoriesTotalCount: number;
  allTotalCount: number;
  availableCategories: string[];
}

export const ProfessionalCategoryBar: React.FC<ProfessionalCategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categoryScope,
  onSelectCategoryScope,
  partsTotalCount,
  accessoriesTotalCount,
  allTotalCount,
  availableCategories
}) => {
  // Render Lucide icon dynamically
  const renderIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Battery': return <Battery className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Camera': return <Camera className={className} />;
      case 'Volume2': return <Volume2 className={className} />;
      case 'Radio': return <Radio className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'Plug': return <Plug className={className} />;
      case 'Headphones': return <Headphones className={className} />;
      case 'Disc': return <Disc className={className} />;
      case 'HardDrive': return <HardDrive className={className} />;
      default: return <Package className={className} />;
    }
  };

  // Filter categories to show based on scope
  const filteredCategories = CATEGORY_DEFINITIONS.filter(cat => {
    if (categoryScope === 'parts') return cat.type === 'part';
    if (categoryScope === 'accessories') return cat.type === 'accessory';
    return true;
  });

  // Also include any custom categories that user might have added that are not in default list
  const customCategories = availableCategories.filter(
    cat => !CATEGORY_DEFINITIONS.some(d => d.id.toLowerCase() === cat.toLowerCase())
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-3 sm:p-4 shadow-xl space-y-3">
      {/* 1. Header: Scope Switcher (আলাদা অপশন: শুধু মোবাইল পার্টস vs এক্সেসরিজ vs সব) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => onSelectCategoryScope('parts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryScope === 'parts'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>🔧 শুধু মোবাইল পার্টস</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              categoryScope === 'parts' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400'
            }`}>
              {partsTotalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategoryScope('accessories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryScope === 'accessories'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>🎧 এক্সেসরিজ ও গ্যাজেট</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              categoryScope === 'accessories' ? 'bg-white/20 text-white font-black' : 'bg-slate-800 text-violet-400'
            }`}>
              {accessoriesTotalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectCategoryScope('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              categoryScope === 'all'
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>📦 সব মালামাল</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              categoryScope === 'all' ? 'bg-slate-900 text-cyan-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {allTotalCount}
            </span>
          </button>
        </div>

        {/* Selected Category Clear / Info Pill */}
        {selectedCategory ? (
          <div className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-xl text-xs text-cyan-300">
            <span>ক্যাটাগরি: <strong>{getCategoryDisplay(selectedCategory).nameBn}</strong></span>
            <button
              onClick={() => onSelectCategory('')}
              className="p-0.5 hover:bg-cyan-900/60 rounded-full text-cyan-300 hover:text-white transition-colors"
              title="ফিল্টার মুছুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            {categoryScope === 'parts' 
              ? 'মোবাইল মেরামতের যন্ত্রাংশ দেখতে নিচের ক্যাটাগরিতে ক্লিক করুন' 
              : 'নির্দিষ্ট ক্যাটাগরি দেখতে নিচে ক্লিক করুন'}
          </span>
        )}
      </div>

      {/* 2. Interactive Horizontal Category Cards / Badges Showcase */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          {/* 'All Categories' Reset Pill */}
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              !selectedCategory
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${!selectedCategory ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block leading-none">
                {categoryScope === 'parts' ? 'সব পার্টস' : categoryScope === 'accessories' ? 'সব এক্সেসরিজ' : 'সব ক্যাটাগরি'}
              </span>
              <span className={`text-[9px] block mt-0.5 ${!selectedCategory ? 'text-slate-900/80 font-mono font-bold' : 'text-slate-500'}`}>
                {categoryScope === 'parts' ? `${partsTotalCount} টি আইটেম` : categoryScope === 'accessories' ? `${accessoriesTotalCount} টি` : `${allTotalCount} টি`}
              </span>
            </div>
          </button>

          {/* Standard Defined Categories for Selected Scope */}
          {filteredCategories.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();

            return (
              <button
                key={`cat_chip_${cat.id}`}
                type="button"
                onClick={() => onSelectCategory(isSelected ? '' : cat.id)}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-transform group-hover:scale-105 ${
                  isSelected 
                    ? 'bg-slate-950/20 text-slate-950' 
                    : cat.type === 'part' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'bg-violet-950/60 text-violet-400 border border-violet-800/40'
                }`}>
                  {renderIcon(cat.iconName, "w-4 h-4")}
                </div>

                <div className="text-left">
                  <span className="block leading-none text-xs">
                    {cat.nameBn}
                  </span>
                  <span className={`text-[9px] block mt-0.5 ${isSelected ? 'text-slate-900/80 font-mono font-bold' : 'text-slate-500'}`}>
                    {cat.nameEn} • <strong className={isSelected ? 'text-slate-950' : 'text-slate-400 font-mono'}>{count}</strong> টি
                  </span>
                </div>
              </button>
            );
          })}

          {/* Any Custom Categories outside standard list */}
          {customCategories.map(cat => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={`custom_cat_${cat}`}
                type="button"
                onClick={() => onSelectCategory(isSelected ? '' : cat)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="block leading-none">{cat}</span>
                  <span className={`text-[9px] block mt-0.5 ${isSelected ? 'text-slate-900/80' : 'text-slate-500'}`}>
                    {count} টি
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
