import React from 'react';
import { X, Calendar, ArrowUpRight, ArrowDownLeft, PlusCircle, DollarSign, Share2, Printer, Trash2 } from 'lucide-react';
import { CustomerDue } from '../types';

interface CustomerLedgerModalProps {
  customer: CustomerDue | null;
  onClose: () => void;
  onAddMoreDue: (customer: CustomerDue) => void;
  onCollectPayment: (customer: CustomerDue) => void;
  onPrintStatement: (customer: CustomerDue) => void;
  onDeleteCustomer?: (customerId: string) => void;
  isAdmin: boolean;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  onClose,
  onAddMoreDue,
  onCollectPayment,
  onPrintStatement,
  onDeleteCustomer,
  isAdmin
}) => {
  if (!customer) return null;

  const currentDue = Math.max(0, customer.totalAmount - (customer.paidAmount || 0));
  const isPaidFull = currentDue === 0;

  const handleWhatsApp = () => {
    if (!customer.phone) {
      alert('গ্রাহকের মোবাইল নম্বর পাওয়া যায়নি!');
      return;
    }
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
    
    let msg = `আসসালামু আলাইকুম ${customer.name} ভাই,\n`;
    msg += `অনিক টেলিকমে আপনার সর্বমোট বিল ৳${customer.totalAmount}, যার মধ্যে জমা দিয়েছেন ৳${customer.paidAmount}।\n`;
    if (currentDue > 0) {
      msg += `*বর্তমানে আপনার অবশিষ্ট বাকি রয়েছে ৳${currentDue} টাকা।*\n`;
      msg += `অনুগ্রহ করে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।\n`;
    } else {
      msg += `আপনার কোনো বকেয়া বাকি নেই। সম্পূর্ণ পরিশোধিত।\n`;
    }
    msg += `ধন্যবাদ - অনিক টেলিকম।`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const history = customer.history || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">{customer.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isPaidFull ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-red-950 text-red-400 border border-red-800/60'
              }`}>
                {isPaidFull ? 'পরিশোধিত ✅' : 'বাকি আছে ⚠️'}
              </span>
            </div>
            {customer.phone && (
              <p className="text-xs text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                <span>📞</span>
                <a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Highlights */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-950/40 border-b border-slate-800/60">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">মোট হিসাব</span>
            <span className="block text-sm font-black font-mono text-slate-200 mt-0.5">৳ {customer.totalAmount.toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
            <span className="block text-[9px] uppercase tracking-wider text-emerald-400 font-bold">মোট জমা</span>
            <span className="block text-sm font-black font-mono text-emerald-400 mt-0.5">৳ {(customer.paidAmount || 0).toLocaleString()}</span>
          </div>
          <div className="bg-slate-900/90 border border-red-900/40 p-2.5 rounded-xl text-center bg-red-950/20">
            <span className="block text-[9px] uppercase tracking-wider text-red-400 font-bold">বর্তমান বাকি</span>
            <span className="block text-sm font-black font-mono text-red-400 mt-0.5">৳ {currentDue.toLocaleString()}</span>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onAddMoreDue(customer)}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              + আরো বাকি যোগ
            </button>
            {!isPaidFull && (
              <button
                onClick={() => onCollectPayment(customer)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <DollarSign className="w-3.5 h-3.5" />
                টাকা জমা নিন
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {customer.phone && (
              <button
                onClick={handleWhatsApp}
                title="WhatsApp তাগাদা পাঠান"
                className="p-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onPrintStatement(customer)}
              title="স্টেটমেন্ট বা রসিদ"
              className="p-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            {isAdmin && onDeleteCustomer && (
              <button
                onClick={() => {
                  if (confirm(`'${customer.name}'-এর বাকির খাতাটি ডিলিট করতে চান?`)) {
                    onDeleteCustomer(customer.id);
                    onClose();
                  }
                }}
                title="রেকর্ড মুছে ফেলুন"
                className="p-1.5 text-red-400 bg-red-950/40 border border-red-800/60 hover:bg-red-900 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Ledger History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              লেনদেনের ইতিহাস ও খতিয়ান ({history.length} টি এন্ট্রি):
            </span>
            <span className="text-[10px] text-slate-500">শুরুর তারিখ: {customer.date}</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl p-4">
              কোনো পূর্ববর্তী এন্ট্রি নেই। মূল নোট: &ldquo;{customer.note || 'কোনো বিবরণ দেওয়া হয়নি'}&rdquo;
            </div>
          ) : (
            history.map((item, idx) => {
              const isDue = item.type === 'due' || (!item.type && !item.note?.includes('জমা'));
              return (
                <div
                  key={`ledger_entry_${customer.id}_${item.date}_${item.amount}_${idx}`}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    isDue
                      ? 'bg-amber-950/15 border-amber-500/25'
                      : 'bg-emerald-950/15 border-emerald-500/25'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 ${
                        isDue ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isDue ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">
                        {item.note || (isDue ? 'বাকি নেওয়া হয়েছে' : 'নগদ জমা দেওয়া হয়েছে')}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                        {item.seller && (
                          <span className="text-cyan-400 bg-slate-950 px-1 rounded">
                            অপারেটর: {item.seller}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm block ${
                        isDue ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {isDue ? '+ ৳' : '- ৳'} {item.amount.toLocaleString()}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                      {isDue ? 'বাকি যোগ' : 'জমা আদায়'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
