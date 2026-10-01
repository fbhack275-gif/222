import React, { useState } from 'react';
import { X, Wrench, Smartphone, User, Phone, Check, Calendar, DollarSign } from 'lucide-react';
import { RepairJob } from '../types';

interface RepairJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSeller: string;
  onSaveJob: (jobData: Omit<RepairJob, 'id'>) => void;
  nextJobNumber: number;
}

export const RepairJobModal: React.FC<RepairJobModalProps> = ({
  isOpen,
  onClose,
  activeSeller,
  onSaveJob,
  nextJobNumber
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [problem, setProblem] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [deliveryDate, setDeliveryDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceModel.trim()) {
      alert('মোবাইল মডেলের নাম লিখুন!');
      return;
    }
    if (!customerName.trim()) {
      alert('কাস্টমারের নাম লিখুন!');
      return;
    }

    const tokenNo = `TK-${nextJobNumber}`;
    const todayStr = new Date().toLocaleDateString('en-GB');

    onSaveJob({
      tokenNo,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deviceModel: deviceModel.trim(),
      problem: problem.trim() || 'সাধারণ রিপেয়ারিং',
      estimatedCost: parseFloat(estimatedCost) || 0,
      advancePaid: parseFloat(advancePaid) || 0,
      status: 'pending',
      date: todayStr,
      deliveryDate: deliveryDate.trim() || 'আজকের মধ্যেই',
      seller: activeSeller
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                নতুন মোবাইল সার্ভিসিং জব কার্ড (টোকেন #TK-{nextJobNumber})
              </h3>
              <p className="text-[10px] text-slate-400">কাস্টমারের ফোন জমা নেওয়ার এন্ট্রি</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>কাস্টমারের নাম</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="যেমন: সাকিব ভাই"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>মোবাইল নম্বর</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>মোবাইলের ব্র্যান্ড ও মডেল (Device Model)</span>
            </label>
            <input
              type="text"
              value={deviceModel}
              onChange={e => setDeviceModel(e.target.value)}
              placeholder="যেমন: Samsung Galaxy A12, Vivo Y20, iPhone 11"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              সমস্যা / কি কাজ করতে হবে? (Problem Details)
            </label>
            <input
              type="text"
              value={problem}
              onChange={e => setProblem(e.target.value)}
              placeholder="যেমন: ডিসপ্লে পরিবর্তন, টাচ কাজ করে না, চার্জিং পোর্ট ঠিক করা"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>সম্ভাব্য মোট খরচ (৳)</span>
              </label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                অগ্রিম জমা (৳)
              </label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={e => setAdvancePaid(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>ডেলিভারির সম্ভাব্য তারিখ বা সময়</span>
            </label>
            <input
              type="text"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              placeholder="যেমন: আজ বিকেল ৫টায়, বা কাল দুপুর ২টায়"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>জব কার্ড সেভ ও টোকেন রসিদ তৈরি</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
