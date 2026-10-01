import React from 'react';
import { X, Copy, Share2, Printer, AlertTriangle, Check } from 'lucide-react';
import { InventoryItem } from '../types';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockItems: InventoryItem[];
}

export const ReorderModal: React.FC<ReorderModalProps> = ({
  isOpen,
  onClose,
  lowStockItems
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const generateTextList = () => {
    let text = `*অনিক টেলিকম - পাইকারি মালামাল ক্রয়ের ফর্দ*\n`;
    text += `তারিখ: ${new Date().toLocaleDateString('en-GB')}\n`;
    text += `মোট প্রয়োজন: ${lowStockItems.length} প্রকারের পার্টস\n`;
    text += `------------------------------------\n`;
    lowStockItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.brand})\n`;
      text += `   বর্তমান স্টক: ${item.stock} পিস | প্রয়োজন: ৫-১০ পিস\n`;
      if (item.models && item.models.length > 0) {
        text += `   মডেল: ${item.models.slice(0, 4).join(', ')}\n`;
      }
    });
    text += `------------------------------------\n`;
    text += `জরুরি ভিত্তিতে ডেলিভারি দেওয়ার অনুরোধ।\n- অনিক টেলিকম`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateTextList());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = generateTextList();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                পাইকারি কেনাকাটার ফর্দ (মার্কেট রিকুইজিশন)
              </h3>
              <p className="text-xs text-slate-400">
                ৩ পিসের নিচে থাকা মালামালের স্বয়ংক্রিয় বাজার লিস্ট
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

        {/* Action Toolbar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
            <span>স্টক খালি বা শেষ হওয়ার মুখে:</span>
            <strong className="font-mono text-sm">{lowStockItems.length} টি</strong>
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'লিস্ট কপি'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>মহাজনকে পাঠান</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-colors"
              title="প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              আলহামদুলিল্লাহ! কোনো মালামালের স্টক কম নেই। সব পণ্যের পর্যাপ্ত স্টক আছে।
            </div>
          ) : (
            lowStockItems.map((item, idx) => (
              <div
                key={item._fbKey || `reorder_${item.id}_${idx}`}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded uppercase">
                      {item.brand}
                    </span>
                  </div>
                  {item.models && item.models.length > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      মডেল: {item.models.slice(0, 5).join(', ')}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold block text-sm ${
                      item.stock === 0 ? 'text-red-400' : 'text-amber-400'
                    }`}
                  >
                    স্টক: {item.stock} পিস
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold">
                    কেনা প্রয়োজন: ৫+ পিস
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
