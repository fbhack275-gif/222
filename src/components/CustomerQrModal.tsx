import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  Share2,
  User,
  Phone,
  MessageSquare,
  UserPlus,
  Check,
  Copy,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface CustomerQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerName?: string;
  initialPhone?: string;
  initialDue?: number;
}

export const CustomerQrModal: React.FC<CustomerQrModalProps> = ({
  isOpen,
  onClose,
  initialCustomerName = '',
  initialPhone = '',
  initialDue = 0,
}) => {
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [phone, setPhone] = useState(initialPhone);
  const [qrType, setQrType] = useState<'whatsapp' | 'vcard'>('whatsapp');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setCustomerName(initialCustomerName || '');
      setPhone(initialPhone || '');
      setCustomMsg(
        initialCustomerName
          ? `আসসালামু আলাইকুম ${initialCustomerName} ভাই, অনিক টেলিকম থেকে মেসেজ পাঠানো হচ্ছে।`
          : 'আসসালামু আলাইকুম, অনিক টেলিকম থেকে মেসেজ পাঠানো হচ্ছে।'
      );
    }
  }, [isOpen, initialCustomerName, initialPhone]);

  // Clean phone number for WhatsApp
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('0')
    ? '88' + cleanPhone
    : cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone
    ? '88' + cleanPhone
    : '';

  // Generate QR string based on selected mode
  const qrRawValue = React.useMemo(() => {
    if (!cleanPhone) return '';

    if (qrType === 'whatsapp') {
      const msgEncoded = encodeURIComponent(customMsg.trim());
      return `https://wa.me/${intlPhone}${msgEncoded ? `?text=${msgEncoded}` : ''}`;
    } else {
      // vCard format for phone contacts scanner
      const safeName = (customerName || 'গ্রাহক').trim();
      const note = initialDue > 0 ? `বাকি পাওনা: ৳${initialDue}` : 'অনিক টেলিকম কাস্টমার';
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${safeName}`,
        `TEL;TYPE=CELL:${cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone}`,
        'ORG:Anik Telecom',
        `NOTE:${note}`,
        'END:VCARD'
      ].join('\n');
    }
  }, [cleanPhone, intlPhone, qrType, customerName, customMsg, initialDue]);

  // Render QR Code image
  useEffect(() => {
    if (!qrRawValue) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(qrRawValue, {
      width: 320,
      margin: 2,
      color: {
        dark: qrType === 'whatsapp' ? '#064e3b' : '#0f172a', // deep emerald for WA, slate for vCard
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('QR code generation error:', err);
      });
  }, [qrRawValue, qrType]);

  if (!isOpen) return null;

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const filename = `QR_${(customerName || 'Customer').replace(/\s+/g, '_')}_${phone || 'phone'}.png`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (qrType === 'whatsapp') {
      navigator.clipboard.writeText(qrRawValue);
    } else {
      navigator.clipboard.writeText(phone);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenDirectWhatsApp = () => {
    if (!phone) return;
    sendWhatsAppMessage(phone, customMsg);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>কাস্টমার QR কোড জেনারেটর</span>
              </h3>
              <p className="text-xs text-slate-400">
                মোবাইলে স্ক্যান করে সহজে কন্টাক্ট সেভ ও সরাসরি চ্যাট
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
          {/* Customer Input Fields */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                <span>গ্রাহকের নাম</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="যেমন: সাকিব ভাই"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>মোবাইল নম্বর</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* QR Type Selector Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setQrType('whatsapp')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                qrType === 'whatsapp'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp চ্যাট QR</span>
            </button>

            <button
              type="button"
              onClick={() => setQrType('vcard')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                qrType === 'vcard'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>মোবাইল কন্টাক্ট সেভ</span>
            </button>
          </div>

          {/* QR Code Display Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
            {qrDataUrl ? (
              <div className="space-y-3 flex flex-col items-center">
                {/* White Frame for high contrast camera scanner */}
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/40 border-4 border-slate-800/40 relative group">
                  <img
                    src={qrDataUrl}
                    alt="Customer WhatsApp QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                  <div className="text-center mt-1 text-[10px] font-black tracking-wider text-slate-900 uppercase">
                    ANIK TELECOM · {qrType === 'whatsapp' ? 'WHATSAPP CHAT' : 'SAVE CONTACT'}
                  </div>
                </div>

                {/* Scan instruction info */}
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {qrType === 'whatsapp'
                        ? 'ক্যামেরা বা WhatsApp দিয়ে স্ক্যান করলেই সরাসরি চ্যাট ওপেন হবে'
                        : 'যেকোনো ফোনের ক্যামেরা দিয়ে স্ক্যান করলেই কন্টাক্ট লিস্টে সেভ হবে'}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {customerName || 'গ্রাহক'} ({phone || 'নম্বর'})
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 space-y-2">
                <QrCode className="w-12 h-12 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400">
                  উপরে গ্রাহকের মোবাইল নম্বর লিখলে স্বয়ংক্রিয়ভাবে QR কোড তৈরি হবে।
                </p>
              </div>
            )}
          </div>

          {/* Optional: Pre-filled message for WhatsApp mode */}
          {qrType === 'whatsapp' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                প্রারম্ভিক মেসেজ (চ্যাট ওপেন হলে লেখা থাকবে):
              </label>
              <input
                type="text"
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="যেমন: আসসালামু আলাইকুম..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Action Buttons Toolbar */}
          {qrDataUrl && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'কপি হয়েছে' : 'লিঙ্ক কপি'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>চ্যাট খুলুন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
