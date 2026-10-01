import React, { useState } from 'react';
import { X, Calculator, ArrowRight, RotateCcw } from 'lucide-react';

interface ShopCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopCalculatorModal: React.FC<ShopCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [billAmount, setBillAmount] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [calcDisplay, setCalcDisplay] = useState('0');

  if (!isOpen) return null;

  const numBill = parseFloat(billAmount) || 0;
  const numCash = parseFloat(cashGiven) || 0;
  const changeToReturn = Math.max(0, numCash - numBill);
  const remainingDue = Math.max(0, numBill - numCash);

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      return;
    }
    if (val === '=') {
      try {
        // Safe evaluation of basic math expressions
        const sanitized = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(res));
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }

    if (calcDisplay === '0' || calcDisplay === 'Error') {
      setCalcDisplay(val);
    } else {
      setCalcDisplay(prev => prev + val);
    }
  };

  const keypad = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['C', '0', '=', '+']
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">দোকানের হিসাব ও দ্রুত ক্যালকুলেটর</h3>
              <p className="text-[10px] text-slate-400">কাস্টমারের ফেরত টাকা ও ডিসকাউন্ট হিসাব</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Change Calculator (ফেরত টাকা হিসাব) */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              ক্যাশ লেনদেন ও ফেরত টাকা হিসাব:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">মোট বিল (৳)</label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={e => setBillAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">কাস্টমার দিল (৳)</label>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-400 font-mono font-bold"
                />
              </div>
            </div>

            {numBill > 0 && numCash > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                {numCash >= numBill ? (
                  <>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      <span>কাস্টমারকে ফেরত দিন:</span>
                    </span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      ৳ {changeToReturn.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      <span>কাস্টমারের বাকি থাকবে:</span>
                    </span>
                    <span className="text-base font-black font-mono text-red-400">
                      ৳ {remainingDue.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mini Standard Keypad Calculator */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right font-mono text-lg font-bold text-cyan-400 overflow-x-auto">
              {calcDisplay}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {keypad.flat().map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCalcClick(btn)}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition-transform active:scale-95 ${
                    btn === '='
                      ? 'bg-cyan-500 text-slate-950 col-span-1 shadow-md'
                      : btn === 'C'
                      ? 'bg-red-950/60 text-red-400 border border-red-900/50 hover:bg-red-900'
                      : ['+', '-', '*', '/'].includes(btn)
                      ? 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
                      : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
