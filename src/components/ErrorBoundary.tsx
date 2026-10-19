import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-100">সাময়িক ত্রুটি পরিলক্ষিত হয়েছে</h2>
              <p className="text-xs text-slate-400 mt-1">
                অ্যাপ্লিকেশনের কোনো ডেটা হারায়নি। নিচের রিলোড বাটনে চাপ দিলে স্বাভাবিকভাবে কাজ করবে।
              </p>
              {this.state.error?.message && (
                <div className="mt-2.5 p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-red-300 break-all text-left">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পেজ রিলোড করুন</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs active:scale-95 transition-all"
              >
                পুনরায় চেষ্টা
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
