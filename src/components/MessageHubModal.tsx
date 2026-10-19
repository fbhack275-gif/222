import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Share2,
  Copy,
  Check,
  User,
  Phone,
  Send,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { CustomerDue } from '../types';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface MessageHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerDue[];
  onOpenQrCode?: (name: string, phone: string, due: number) => void;
}

export const MessageHubModal: React.FC<MessageHubModalProps> = ({
  isOpen,
  onClose,
  customers,
  onOpenQrCode,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customPhone, setCustomPhone] = useState('');
  const [templateType, setTemplateType] = useState<
    'due_reminder' | 'repair_ready' | 'new_stock' | 'custom'
  >('due_reminder');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const activePhone = selectedCustomer?.phone || customPhone;
  const currentDue = selectedCustomer
    ? Math.max(0, selectedCustomer.totalAmount - (selectedCustomer.paidAmount || 0))
    : 0;

  // Build message
  let generatedMsg = '';
  if (templateType === 'due_reminder') {
    generatedMsg = `আসসালামু আলাইকুম ${selectedCustomer ? selectedCustomer.name : 'গ্রাহক'} ভাই,\n`;
    generatedMsg += `অনিক টেলিকম থেকে যোগাযোগ করা হচ্ছে।\n`;
    if (currentDue > 0) {
      generatedMsg += `*আপনার বর্তমান বকেয়া বাকি রয়েছে ৳${currentDue.toLocaleString()} টাকা।*\n`;
      generatedMsg += `অনুগ্রহ করে সুবিধাজনক সময়ে দোকানে এসে বকেয়া পরিশোধ করার অনুরোধ করা হচ্ছে।\n`;
    } else {
      generatedMsg += `আপনার পূর্বের সকল হিসাব পরিশোধিত রয়েছে। ধন্যবাদ আমাদের পাশে থাকার জন্য!\n`;
    }
    generatedMsg += `ধন্যবাদান্তে - মোঃ অনিক হোসেন, অনিক টেলিকম।`;
  } else if (templateType === 'repair_ready') {
    generatedMsg = `আসসালামু আলাইকুম ${selectedCustomer ? selectedCustomer.name : 'গ্রাহক'} ভাই,\n`;
    generatedMsg += `*আপনার সার্ভিসিংয়ের জন্য জমা দেওয়া মোবাইলটির কাজ সম্পন্ন হয়েছে।* 📱✅\n`;
    generatedMsg += `অনুগ্রহ করে অনিক টেলিকম দোকানে এসে আপনার ডিভাইসটি ডেলিভারি নেওয়ার জন্য অনুরোধ করা হচ্ছে।\n`;
    generatedMsg += `ধন্যবাদান্তে - অনিক টেলিকম।`;
  } else if (templateType === 'new_stock') {
    generatedMsg = `আসসালামু আলাইকুম!\n`;
    generatedMsg += `অনিক টেলিকমে সকল প্রিমিয়াম কোয়ালিটি মোবাইল ডিসপ্লে, অরিজিনাল ব্যাটারি, ফাস্ট চার্জার এবং এক্সেসরিজের নতুন কালেকশন এসেছে। ⚡\n`;
    generatedMsg += `যেকোনো মোবাইল সার্ভিসিং বা পার্টসের জন্য চলে আসুন আমাদের দোকানে।\n`;
    generatedMsg += `প্রোপ্রাইটর: অনিক হোসেন, অনিক টেলিকম।`;
  } else {
    generatedMsg = customText;
  }

  const handleSend = () => {
    sendWhatsAppMessage(activePhone, generatedMsg);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>গ্রাহক যোগাযোগ ও হোয়াটসঅ্যাপ সেন্টার</span>
              </h3>
              <p className="text-xs text-slate-400">
                বাকি তাগাদা, সার্ভিসিং রেডি নোটিফিকেশন ও মেসেজ
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

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Target Customer Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              গ্রাহক নির্বাচন করুন (ঐচ্ছিক):
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                const found = customers.find(c => c.id === e.target.value);
                if (found?.phone) setCustomPhone(found.phone);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- বাকি খাতার তালিকা থেকে বেছে নিন --</option>
              {customers.map(c => {
                const due = Math.max(0, c.totalAmount - (c.paidAmount || 0));
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} - বাকি: ৳{due}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Custom Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              মোবাইল নম্বর (হোয়াটসঅ্যাপ):
            </label>
            <input
              type="tel"
              value={customPhone}
              onChange={e => setCustomPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Template Selection Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">মেসেজ টেমপ্লেট:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('due_reminder')}
                className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                  templateType === 'due_reminder'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚠️ বাকি তাগাদা মেসেজ
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('repair_ready')}
                className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                  templateType === 'repair_ready'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📱 সার্ভিসিং ডেলিভারি প্রস্তুত
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('new_stock')}
                className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                  templateType === 'new_stock'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ নতুন স্টক আগমন অফার
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('custom')}
                className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                  templateType === 'custom'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ✏️ নিজের মতো লিখুন
              </button>
            </div>
          </div>

          {/* Message Preview or Custom input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">মেসেজ প্রিভিউ:</label>
            {templateType === 'custom' ? (
              <textarea
                rows={4}
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder="আপনার কাঙ্ক্ষিত মেসেজ লিখুন..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            ) : (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {generatedMsg}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSend}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>হোয়াটসঅ্যাপে পাঠান</span>
            </button>

            {onOpenQrCode && (
              <button
                type="button"
                onClick={() => onOpenQrCode(selectedCustomer?.name || 'গ্রাহক', activePhone, currentDue)}
                className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-2xl active:scale-98 transition-all flex items-center gap-1.5"
                title="গ্রাহকের WhatsApp QR কোড প্রদর্শন করুন"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR কোড</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl active:scale-98 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
