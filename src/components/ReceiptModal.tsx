import React from 'react';
import { Printer, X, CheckCircle, Share2 } from 'lucide-react';
import { ReceiptData } from '../types';

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!receipt.customerPhone) {
      alert('গ্রাহকের মোবাইল নম্বর পাওয়া যায়নি!');
      return;
    }
    const cleanPhone = receipt.customerPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
    
    let msg = `*অনিক টেলিকম - ক্যাশ মেমো*\n`;
    msg += `তারিখ: ${receipt.date}\n`;
    if (receipt.customerName) msg += `গ্রাহক: ${receipt.customerName}\n`;
    msg += `--------------------------\n`;
    receipt.items.forEach(it => {
      msg += `${it.name} ${it.qty ? `(x${it.qty})` : ''}: ৳${it.amount}\n`;
    });
    msg += `--------------------------\n`;
    msg += `মোট বিল: ৳${receipt.subtotal}\n`;
    msg += `জমা: ৳${receipt.paid}\n`;
    if (receipt.due > 0) {
      msg += `*অবশিষ্ট বাকি: ৳${receipt.due}*\n`;
    }
    msg += `\nধন্যবাদ! আবার আসবেন - অনিক টেলিকম।`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">ক্যাশ মেমো / রসিদ</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt" className="p-5 bg-white text-slate-900 font-sans text-xs">
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">ANIK TELECOM</h2>
            <p className="text-[10px] text-slate-600 font-medium">মোবাইল সার্ভিসিং ও পার্টস বিক্রয় কেন্দ্র</p>
            <p className="text-[9px] text-slate-500 mt-0.5">প্রোপ্রাইটর: মোঃ অনিক হোসেন</p>
            <p className="text-[10px] font-mono text-slate-700 font-bold">হেল্পলাইন: 017XXXXXXXX</p>
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>তারিখ: <strong className="text-slate-900">{receipt.date}</strong></span>
              <span>টাইপ: <strong className="text-slate-900 uppercase">{receipt.type}</strong></span>
            </div>
            {receipt.customerName && (
              <div className="flex justify-between text-slate-700">
                <span>গ্রাহক:</span>
                <span className="font-bold text-slate-950">{receipt.customerName}</span>
              </div>
            )}
            {receipt.customerPhone && (
              <div className="flex justify-between text-slate-700">
                <span>মোবাইল:</span>
                <span className="font-mono text-slate-950 font-bold">{receipt.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>অপারেটর:</span>
              <span>{receipt.seller}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-600 border-b border-slate-200">
                  <th className="pb-1">বিবরণ</th>
                  <th className="pb-1 text-center">পরিমাণ</th>
                  <th className="pb-1 text-right">মূল্য (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items.map((it, idx) => (
                  <tr key={`rcpt_it_${it.name}_${idx}`} className="text-[11px]">
                    <td className="py-1 pr-1 font-semibold text-slate-800">{it.name}</td>
                    <td className="py-1 text-center font-mono text-slate-600">{it.qty || 1}</td>
                    <td className="py-1 text-right font-mono font-bold text-slate-950">৳{it.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-400">
            <div className="flex justify-between text-slate-700">
              <span>মোট বিল:</span>
              <span className="font-mono font-bold text-slate-950">৳{receipt.subtotal}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>জমা প্রদান:</span>
              <span className="font-mono">৳{receipt.paid}</span>
            </div>
            {receipt.due > 0 ? (
              <div className="flex justify-between text-red-700 font-bold bg-red-50 p-1 rounded">
                <span>অবশিষ্ট বাকি:</span>
                <span className="font-mono text-xs">৳{receipt.due}</span>
              </div>
            ) : (
              <div className="text-center py-1 text-emerald-700 font-bold text-[10px]">
                ★ সম্পূর্ণ বিল পরিশোধিত ★
              </div>
            )}
          </div>

          {receipt.note && (
            <div className="py-1.5 border-b border-dashed border-slate-300 text-[10px] text-slate-700">
              <span>ওয়ারেন্টি / নোট: </span>
              <strong className="text-slate-900">{receipt.note}</strong>
            </div>
          )}

          <div className="text-center pt-3 space-y-1">
            <p className="text-[9px] text-slate-500">বিক্রিত মাল ফেরত নেওয়া হয় না। পার্টস চেক করে নিন।</p>
            <p className="text-[10px] font-bold text-slate-800">অনিক টেলিকমে আসার জন্য ধন্যবাদ!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
          {receipt.customerPhone && (
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp মেমো
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg"
          >
            <Printer className="w-4 h-4" />
            প্রিন্ট / রসিদ কপি
          </button>
        </div>
      </div>
    </div>
  );
};
