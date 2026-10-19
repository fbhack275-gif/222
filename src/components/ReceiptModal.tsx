import React, { useState } from 'react';
import { Printer, X, CheckCircle, Share2, Copy, Check } from 'lucide-react';
import { ReceiptData, ShopSettings } from '../types';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  settings?: ShopSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose, settings }) => {
  const [copied, setCopied] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState(false);

  if (!receipt) return null;

  const shopName = settings?.shopName || 'ANIK TELECOM';
  const tagline = settings?.tagline || 'মোবাইল সার্ভিসিং ও পার্টস বিক্রয় কেন্দ্র';
  const ownerName = settings?.ownerName || 'মোঃ অনিক হোসেন';
  const phone = settings?.phone || '';
  const address = settings?.address || '';
  const footerNote = settings?.receiptFooterNote || 'আমাদের সেবা গ্রহণ করার জন্য আন্তরিক ধন্যবাদ!';

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptText = () => {
    const isPreOrder = receipt.type === 'preorder_token';
    const isRepair = receipt.type === 'repair_token';
    let titleStr = isPreOrder
      ? 'কাস্টমার প্রি-অর্ডার ও বায়না রসিদ'
      : isRepair
      ? 'সার্ভিসিং জব কার্ড ও টোকেন'
      : receipt.type === 'due_payment'
      ? 'বাকি পরিশোধ রসিদ'
      : 'ক্যাশ মেমো / ইনভয়েস';

    let msg = `*অনিক টেলিকম - ${titleStr}*\n`;
    msg += `তারিখ: ${receipt.date}\n`;
    if (receipt.customerName) msg += `গ্রাহক: ${receipt.customerName}\n`;
    if (receipt.customerPhone) msg += `মোবাইল: ${receipt.customerPhone}\n`;
    msg += `--------------------------\n`;
    receipt.items.forEach(it => {
      msg += `${it.name} ${it.qty ? `(x${it.qty})` : ''}: ৳${it.amount}\n`;
    });
    msg += `--------------------------\n`;
    if (isPreOrder) {
      msg += `মোট চুক্তি মূল্য: ৳${receipt.subtotal}\n`;
      msg += `অগ্রিম বায়না জমা: ৳${receipt.paid}\n`;
      if (receipt.due > 0) {
        msg += `*পণ্য নেওয়ার সময় অবশিষ্ট বাকি: ৳${receipt.due}*\n`;
      } else {
        msg += `*অবস্থা: সম্পূর্ণ পরিশোধিত (ফুল পেইড)*\n`;
      }
    } else {
      msg += `মোট বিল: ৳${receipt.subtotal}\n`;
      msg += `জমা: ৳${receipt.paid}\n`;
      if (receipt.due > 0) {
        msg += `*অবশিষ্ট বাকি: ৳${receipt.due}*\n`;
      }
    }
    if (receipt.note) {
      msg += `নোট: ${receipt.note}\n`;
    }
    msg += `\nধন্যবাদ! আবার আসবেন - অনিক টেলিকম।`;
    return msg;
  };

  const handleShareWhatsApp = () => {
    if (!receipt.customerPhone) {
      setPhoneWarning(true);
      setTimeout(() => setPhoneWarning(false), 3000);
      return;
    }
    sendWhatsAppMessage(receipt.customerPhone, generateReceiptText());
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {phoneWarning && (
          <div className="bg-amber-950/80 border-b border-amber-800 text-amber-300 text-xs px-4 py-2 text-center font-bold">
            ⚠️ কাস্টমারের মোবাইল নম্বর নেই। আপনি নিচে 'কপি' বাটনে ট্যাপ করে কপি করতে পারেন।
          </div>
        )}

        {/* Printable Area */}
        <div id="printable-receipt" className="p-5 bg-white text-slate-900 font-sans text-xs">
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">{shopName}</h2>
            <p className="text-[10px] text-slate-600 font-medium">{tagline}</p>
            {ownerName && <p className="text-[9px] text-slate-500 mt-0.5">প্রোপ্রাইটর: {ownerName}</p>}
            {phone && <p className="text-[9px] font-mono text-slate-600">মোবাইল: {phone}</p>}
            {address && <p className="text-[9px] text-slate-500">{address}</p>}
          </div>

          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>তারিখ: <strong className="text-slate-900">{receipt.date}</strong></span>
              <span>
                টাইপ:{' '}
                <strong className="text-slate-900 font-bold">
                  {receipt.type === 'preorder_token'
                    ? 'প্রি-অর্ডার বায়না টোকেন'
                    : receipt.type === 'repair_token'
                    ? 'সার্ভিসিং জব কার্ড'
                    : receipt.type === 'due_payment'
                    ? 'বাকি পরিশোধ'
                    : 'বিক্রয় ক্যাশ মেমো'}
                </strong>
              </span>
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
                  <tr key={idx} className="text-[11px]">
                    <td className="py-1 font-medium">{it.name}</td>
                    <td className="py-1 text-center font-mono">{it.qty || 1}</td>
                    <td className="py-1 text-right font-mono font-bold">৳{it.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="pt-2.5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{receipt.type === 'preorder_token' ? 'মোট চুক্তি মূল্য:' : 'মোট বিল:'}</span>
              <span className="font-mono font-bold">৳{receipt.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-800">
              <span>{receipt.type === 'preorder_token' ? 'অগ্রিম বায়না জমা:' : 'নগদ জমা:'}</span>
              <span className="font-mono font-bold text-emerald-700">৳{receipt.paid}</span>
            </div>
            {receipt.due > 0 ? (
              <div className="flex justify-between text-red-700 font-bold border-t border-slate-200 pt-1">
                <span>{receipt.type === 'preorder_token' ? 'পণ্য নেওয়ার সময় প্রদেয় বাকি:' : 'অবশিষ্ট বাকি:'}</span>
                <span className="font-mono">৳{receipt.due}</span>
              </div>
            ) : receipt.type === 'preorder_token' ? (
              <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1 text-[11px]">
                <span>অবস্থা:</span>
                <span>সম্পূর্ণ পরিশোধিত (ফুল পেইড)</span>
              </div>
            ) : null}
          </div>

          {receipt.note && (
            <div className="mt-3 p-1.5 bg-slate-100 rounded text-[10px] text-slate-600 italic text-center">
              নোট: {receipt.note}
            </div>
          )}

          <div className="text-center pt-4 border-t border-dashed border-slate-300 mt-3 text-[9px] text-slate-500">
            <p>{footerNote}</p>
            <p className="font-mono mt-0.5 font-semibold text-slate-700">Software by {shopName} POS</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট মেমো</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপ</span>
          </button>

          <button
            onClick={handleCopyText}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95"
            title="মেমো লেখা কপি করুন"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
