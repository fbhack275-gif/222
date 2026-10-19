import React, { useState } from 'react';
import {
  X,
  Settings,
  Store,
  Printer,
  Bell,
  Users,
  Database,
  Sliders,
  CheckCircle2,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Trash2,
  Plus,
  RefreshCw,
  QrCode,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Lock,
  Key,
  Eye,
  EyeOff,
  UserPlus,
  Globe,
  Copy
} from 'lucide-react';
import { ShopSettings, DEFAULT_SHOP_SETTINGS, UserRole, AppUser } from '../types';
import { playCashRegisterSound, sendBrowserSaleNotification } from '../utils/audioNotification';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  sellers: string[];
  onAddSeller: (name: string) => void;
  onDeleteSeller?: (name: string) => void;
  appUsers: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserPin: (userId: string, newPin: string) => void;
  userRole: UserRole;
  isFirebaseConnected: boolean;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSVInventory: () => void;
  onExportCSVSales: () => void;
  onExportCSVDues: () => void;
  onClearRecentSearches: () => void;
  onEnableBrowserNotifications: () => void;
  isBrowserNotificationEnabled: boolean;
  onCopyPublicLink: () => void;
}

type SettingsTab = 'shop' | 'users' | 'pos' | 'alerts' | 'operators' | 'backup' | 'appearance';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  sellers,
  onAddSeller,
  onDeleteSeller,
  userRole,
  isFirebaseConnected,
  onExportJSON,
  onImportJSON,
  onExportCSVInventory,
  onExportCSVSales,
  onExportCSVDues,
  onClearRecentSearches,
  onEnableBrowserNotifications,
  isBrowserNotificationEnabled,
  appUsers = [],
  onAddUser,
  onDeleteUser,
  onUpdateUserPin,
  onCopyPublicLink
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('shop');
  const [form, setForm] = useState<ShopSettings>({ ...settings });
  const [newSellerName, setNewSellerName] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // User & Access Management State
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'sub_admin' | 'main_admin'>('sub_admin');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Sync state if external settings change
  React.useEffect(() => {
    setForm({ ...settings });
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdateSettings(form);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_SHOP_SETTINGS });
    onUpdateSettings(DEFAULT_SHOP_SETTINGS);
    setResetConfirm(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1200);
  };

  const handleAddSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSellerName.trim();
    if (!trimmed) return;
    onAddSeller(trimmed);
    setNewSellerName('');
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPin.trim()) return;
    onAddUser({
      name: newUserName.trim(),
      role: newUserRole,
      pin: newUserPin.trim(),
      phone: newUserPhone.trim(),
      shopName: form.shopName
    });
    setNewUserName('');
    setNewUserPin('');
    setNewUserPhone('');
    setNewUserRole('sub_admin');
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'shop', label: 'দোকান প্রোফাইল', icon: <Store className="w-4 h-4" /> },
    { id: 'users', label: 'ব্যবহারকারী ও পাসওয়ার্ড', icon: <Lock className="w-4 h-4" /> },
    { id: 'pos', label: 'রসিদ ও প্রিন্টিং', icon: <Printer className="w-4 h-4" /> },
    { id: 'alerts', label: 'সাউন্ড ও অ্যালার্ট', icon: <Bell className="w-4 h-4" /> },
    { id: 'operators', label: 'অপারেটর ও কর্মী', icon: <Users className="w-4 h-4" /> },
    { id: 'backup', label: 'ডাটা ও ব্যাকআপ', icon: <Database className="w-4 h-4" /> },
    { id: 'appearance', label: 'ডিসপ্লে ও লেআউট', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100">দোকান ও সিস্টেম সেটিংস</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                দোকানের নাম, প্রিন্ট রসিদ, সাউন্ড ও ব্যাকআপ কনফিগারেশন পরিচালনা করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveToast && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>সংরক্ষিত হয়েছে!</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Tab Sidebar + Right Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Tabs (Mobile Top Horizontal / Desktop Left Vertical) */}
          <div className="w-full md:w-56 bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-800 p-2 sm:p-3 flex md:flex-col gap-1 overflow-x-auto no-scrollbar flex-shrink-0">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                  }`}
                >
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Connection Pill at bottom of sidebar on desktop */}
            <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/60 px-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isFirebaseConnected ? 'Firebase ক্লাউড সিঙ্ক' : 'অফলাইন মোড'}</span>
              </div>
            </div>
          </div>

          {/* Right Scrollable Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* 1. SHOP PROFILE */}
            {activeTab === 'shop' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Store className="w-4 h-4 text-cyan-400" />
                    দোকানের মূল পরিচিতি ও ব্র্যান্ডিং
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    এই তথ্যগুলো রসিদ প্রিন্ট, ক্যাশ মেমো এবং হোয়াটসঅ্যাপ মেসেজের উপরে স্বয়ংক্রিয়ভাবে দেখাবে।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      দোকানের নাম (Shop Name) *
                    </label>
                    <input
                      type="text"
                      value={form.shopName}
                      onChange={e => handleChange('shopName', e.target.value)}
                      placeholder="যেমন: Anik Telecom"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      মালিক / প্রোপ্রাইটরের নাম
                    </label>
                    <input
                      type="text"
                      value={form.ownerName}
                      onChange={e => handleChange('ownerName', e.target.value)}
                      placeholder="যেমন: মোঃ অনিক হোসেন"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      স্লোগান / কাজের বিবরণ
                    </label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={e => handleChange('tagline', e.target.value)}
                      placeholder="যেমন: মোবাইল সার্ভিসিং ও পার্টস শপ"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      প্রধান মোবাইল ও হোয়াটসঅ্যাপ নম্বর *
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="যেমন: 017XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      বিকল্প ফোন নম্বর (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.altPhone || ''}
                      onChange={e => handleChange('altPhone', e.target.value)}
                      placeholder="যেমন: 018XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      বিকাশ / নগদ নম্বর (পেমেন্ট গ্রহণের জন্য)
                    </label>
                    <input
                      type="text"
                      value={form.bkashNumber || ''}
                      onChange={e => {
                        handleChange('bkashNumber', e.target.value);
                        if (!form.nagadNumber) handleChange('nagadNumber', e.target.value);
                      }}
                      placeholder="যেমন: 017XXXXXXXX (Personal/Merchant)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      দোকানের পূর্ণ ঠিকানা ও অবস্থান
                    </label>
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={e => handleChange('address', e.target.value)}
                      placeholder="যেমন: তালুকদার মার্কেট (২য় তলা), কাঁচাবাজার মোড়, মোবাইল মার্কেট"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= 2. USERS & ACCESS MANAGEMENT (ব্যবহারকারী ও পাসওয়ার্ড) ================= */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    ব্যবহারকারী ও পাসওয়ার্ড এক্সেস কন্ট্রোল (User Management)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    মেইন অ্যাডমিন ও সাব-অ্যাডমিনদের পাসওয়ার্ড তৈরি, পরিবর্তন এবং পাবলিক স্টক গোপনীয়তা নিয়ন্ত্রণ
                  </p>
                </div>

                {/* Section 1: Public Catalog & Individual Stock Privacy */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-950 border border-cyan-800/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          <span>পাবলিক ক্যাটালগ ও স্টক গোপনীয়তা</span>
                          <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.2 rounded-full font-bold">
                            পাবলিকলি পাবলিশ
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          অ্যাপটি অনলাইনে পাবলিশ করলে যে কেউ ক্যাটালগ দেখতে পারবে, তবে স্টকের পিস সংখ্যা থাকবে ব্যক্তিগত
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChange('hideStockCountForPublic', !form.hideStockCountForPublic)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                        form.hideStockCountForPublic ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                      title={form.hideStockCountForPublic ? 'গোপনীয়তা চালু আছে' : 'গোপনীয়তা বন্ধ'}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                          form.hideStockCountForPublic ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-300 text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        {form.hideStockCountForPublic
                          ? 'পাবলিক ভিজিটরদের কাছে শুধু "স্টকে আছে" দেখাবে, স্টকে কয় পিস মাল আছে তা শুধু আপনি দেখতে পাবেন।'
                          : 'সতর্কতা: সাধারণ ভিজিটররাও দেখতে পারবে দোকানে ঠিক কত পিস মাল রয়েছে।'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onCopyPublicLink}
                      className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>পাবলিক লিংক কপি করুন</span>
                    </button>
                  </div>
                </div>

                {/* Section 2: Create New User / Sub Admin (Main Admin Only) */}
                {userRole === 'main_admin' ? (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-emerald-400" />
                        <span>নতুন এক্সেস / সাব-অ্যাডমিন তৈরি করুন</span>
                      </h4>
                      <span className="text-[10px] text-slate-500">Settings থেকে সরাসরি সংরক্ষণ</span>
                    </div>

                    <form onSubmit={handleCreateNewUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          ব্যবহারকারীর নাম (User Name) *
                        </label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={e => setNewUserName(e.target.value)}
                          placeholder="যেমন: Parvej, Rony, Sumon"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          এক্সেস রোল ও ক্ষমতা (Role) *
                        </label>
                        <select
                          value={newUserRole}
                          onChange={e => setNewUserRole(e.target.value as 'sub_admin' | 'main_admin')}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="sub_admin">🛡️ Sub Admin (সেলস, স্টক ও বাকি এন্ট্রি)</option>
                          <option value="main_admin">👑 Main Admin (পূর্ণ ক্ষমতা ও সেটিংস)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          লগইন পাসওয়ার্ড / পিন (PIN) *
                        </label>
                        <input
                          type="text"
                          value={newUserPin}
                          onChange={e => setNewUserPin(e.target.value)}
                          placeholder="যেমন: 8797 বা 1234"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          মোবাইল নম্বর (ঐচ্ছিক)
                        </label>
                        <input
                          type="text"
                          value={newUserPhone}
                          onChange={e => setNewUserPhone(e.target.value)}
                          placeholder="যেমন: 017XXXXXXXX"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-1 flex justify-end">
                        <button
                          type="submit"
                          disabled={!newUserName.trim() || !newUserPin.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>এক্সেস তৈরি ও সংরক্ষণ করুন</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>নতুন সাব-অ্যাডমিন তৈরি ও পাসওয়ার্ড পরিবর্তন শুধুমাত্র Main Admin করতে পারবেন।</span>
                  </div>
                )}

                {/* Section 3: Registered Users List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      সক্রিয় ইউজার ও পাসওয়ার্ড তালিকা ({appUsers.length} জন):
                    </label>
                    <span className="text-[11px] text-slate-500">এই পাসওয়ার্ড দিয়ে লগইন হবে</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {appUsers.map(u => {
                      const isMain = u.role === 'main_admin';
                      return (
                        <div
                          key={`user_card_${u.id}`}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between space-y-2.5 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isMain
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {isMain ? '👑' : '🛡️'}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {u.isDefault && (
                                    <span className="text-[9px] text-slate-500 font-normal">(ডিফল্ট)</span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold ${isMain ? 'text-cyan-400' : 'text-amber-400'}`}>
                                  {isMain ? 'Main Admin (পূর্ণ ক্ষমতা)' : 'Sub Admin (সেলস ও স্টক)'}
                                </span>
                              </div>
                            </div>

                            {userRole === 'main_admin' && !u.isDefault && (
                              <button
                                type="button"
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                                title="ইউজার এক্সেস মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Password / PIN Section */}
                          <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">লগইন পিন:</span>
                              <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {revealedPins[u.id] ? u.pin : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRevealedPins(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                                className="text-slate-500 hover:text-slate-300"
                                title={revealedPins[u.id] ? 'লুকান' : 'দেখুন'}
                              >
                                {revealedPins[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {userRole === 'main_admin' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newP = prompt(`'${u.name}' এর জন্য নতুন পাসওয়ার্ড/পিন দিন:`, u.pin);
                                  if (newP && newP.trim()) {
                                    onUpdateUserPin(u.id, newP.trim());
                                  }
                                }}
                                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold"
                              >
                                পাসওয়ার্ড বদলান
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECEIPT & POS PRINTING */}
            {activeTab === 'pos' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-cyan-400" />
                    রসিদ, ক্যাশ মেমো ও প্রিন্টার ফরম্যাট
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    থার্মাল পিওএস প্রিন্টার (৫৮ মিমি / ৮০ মিমি) ও নরমাল মেমো সাইজ নির্ধারণ করুন
                  </p>
                </div>

                {/* Paper Size Radio Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    ডিফল্ট প্রিন্ট সাইজ (Default Paper Size)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        size: '80mm' as const,
                        title: '80mm Standard POS',
                        desc: 'সাধারণত দোকানের বড় ব্লুটুথ/ইউএসবি থার্মাল প্রিন্টারের জন্য আদর্শ',
                        badge: 'জনপ্রিয়'
                      },
                      {
                        size: '58mm' as const,
                        title: '58mm Mini POS',
                        desc: 'ছোট পোর্টেবল বা হ্যান্ডহেল্ড মিনি থার্মাল স্লিপ প্রিন্টার',
                        badge: 'পোর্টেবল'
                      },
                      {
                        size: 'a4' as const,
                        title: 'A4 / A5 ফুল পেজ',
                        desc: 'কম্পিউটার প্রিন্টারে পূর্ণাঙ্গ ক্যাশ মেমো ও চালান প্রিন্ট',
                        badge: 'ইনভয়েস'
                      }
                    ].map(opt => {
                      const selected = form.defaultPaperSize === opt.size;
                      return (
                        <button
                          key={opt.size}
                          type="button"
                          onClick={() => handleChange('defaultPaperSize', opt.size)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            selected
                              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-slate-100">{opt.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-200">বিক্রির সাথে সাথে অটো-প্রিন্ট ডায়ালগ</div>
                      <div className="text-[11px] text-slate-400">
                        সেল কনফার্ম বা কার্ট চেকআউট করার পর স্বয়ংক্রিয়ভাবে রসিদ ডায়ালগ ওপেন হবে
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('autoPrintReceipt', !form.autoPrintReceipt)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        form.autoPrintReceipt ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                          form.autoPrintReceipt ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                        রসিদে দোকানের পেমেন্ট কিউআর কোড (Shop QR Code)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        গ্রাহক যেন সরাসরি রসিদ থেকে স্ক্যান করে বিকাশ/নগদে টাকা পরিশোধ করতে পারে
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('showShopQrOnReceipt', !form.showShopQrOnReceipt)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        form.showShopQrOnReceipt ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                          form.showShopQrOnReceipt ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        পার্টসের নামের পাশে সিক্রেট কস্ট কোড (Cost Code)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        দোকানদারের চেনার জন্য কেনা দাম কোড আকারে গোপনভাবে প্রদর্শন (যেমন: ALM = ৳125)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('showCostCodeOnReceipt', !form.showCostCodeOnReceipt)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        form.showCostCodeOnReceipt ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                          form.showCostCodeOnReceipt ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Footer notes & Warranty */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      ডিফল্ট ওয়ারেন্টি বার্তা (Default Warranty Note)
                    </label>
                    <input
                      type="text"
                      value={form.defaultWarrantyNote}
                      onChange={e => handleChange('defaultWarrantyNote', e.target.value)}
                      placeholder="যেমন: ৭ দিনের ডিসপ্লে চেকিং গ্যারান্টি (ফিটিং ছাড়া)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      রসিদ ও মেমোর শর্তাবলী এবং ফুটার টেক্সট (Terms & Footer Note)
                    </label>
                    <textarea
                      rows={3}
                      value={form.receiptFooterNote}
                      onChange={e => handleChange('receiptFooterNote', e.target.value)}
                      placeholder="যেমন: ধন্যবাদ! বিক্রিত পণ্য উপযুক্ত কারণ ছাড়া ফেরত নেওয়া হয় না। ডিসপ্লে সোল্ডারিং এর পর কোনো গ্যারান্টি নেই।"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. ALERTS & SOUND */}
            {activeTab === 'alerts' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    নোটিফিকেশন, সাউন্ড ও অ্যালার্ট সিস্টেম
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    নতুন বিক্রি, কম স্টক এবং ডেস্কটপ/মোবাইল ব্রাউজার নোটিফিকেশন নিয়ন্ত্রণ করুন
                  </p>
                </div>

                {/* Cash Chime Sound */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        {form.soundAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">বিক্রির ক্যাশ রেজিস্টার বেল সাউন্ড</div>
                        <div className="text-[11px] text-slate-400">
                          বিক্রি সম্পন্ন হওয়ার সাথে সাথে মিষ্টি ঘণ্টা (Chime) বাজবে
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playCashRegisterSound()}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                        title="শব্দটি পরীক্ষা করুন"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>টেস্ট সাউন্ড</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('soundAlertsEnabled', !form.soundAlertsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                          form.soundAlertsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                            form.soundAlertsEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Push Notification */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">ব্রাউজার সিস্টেম পুশ নোটিফিকেশন</div>
                        <div className="text-[11px] text-slate-400">
                          অন্য ট্যাব খোলা থাকলেও বা অন্য কেউ বিক্রি করলে ব্যাকগ্রাউন্ডে নোটিফিকেশন আসবে
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          sendBrowserSaleNotification('Anik Telecom নোটিফিকেশন টেস্ট 🔔', 'আপনার ডিভাইস নোটিফিকেশন সম্পূর্ণ প্রস্তুত ও সক্রিয়!')
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold active:scale-95 transition-all"
                      >
                        টেস্ট নোটিফিকেশন
                      </button>

                      <button
                        type="button"
                        onClick={onEnableBrowserNotifications}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isBrowserNotificationEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black'
                        }`}
                      >
                        {isBrowserNotificationEnabled ? 'অন আছে ✅' : 'অনুমতি দিন'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Low Stock Threshold */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-100">লো-স্টক সতর্কতা সীমা (Low Stock Threshold)</div>
                      <div className="text-[11px] text-slate-400">
                        পণ্যের মজুত কত পিসে নেমে আসলে তালিকায় লাল রঙে সতর্কতা দেখাবে
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleChange('lowStockThreshold', Math.max(1, form.lowStockThreshold - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-mono font-bold text-cyan-400 text-sm">
                        {form.lowStockThreshold} পিস
                      </span>
                      <button
                        type="button"
                        onClick={() => handleChange('lowStockThreshold', Math.min(20, form.lowStockThreshold + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-black flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. OPERATORS & SELLERS */}
            {activeTab === 'operators' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    দোকানের অপারেটর ও কর্মী ব্যবস্থাপনা
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    কাউন্টার বা সার্ভিসিং কাজের জন্য নতুন অপারেটরের নাম যুক্ত বা পরিবর্তন করুন
                  </p>
                </div>

                {/* Add new seller input */}
                {userRole === 'main_admin' ? (
                  <form onSubmit={handleAddSellerSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={newSellerName}
                      onChange={e => setNewSellerName(e.target.value)}
                      placeholder="নতুন অপারেটরের নাম লিখুন (যেমন: Sumon)"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!newSellerName.trim()}
                      className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>যোগ করুন</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>শুধুমাত্র Main Admin নতুন অপারেটর যোগ বা রিমুভ করতে পারবেন।</span>
                  </div>
                )}

                {/* Seller chips list */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">বর্তমান সক্রিয় অপারেটর তালিকা:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sellers.map(s => {
                      const isOwner = s.toLowerCase() === 'anik';
                      return (
                        <div
                          key={`seller_item_${s}`}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/90"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                              {s.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                {s}
                                {isOwner && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                    মালিক
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isOwner ? 'সকল পারমিশন প্রাপ্ত' : 'কাউন্টার সেলস ও সার্ভিস'}
                              </div>
                            </div>
                          </div>

                          {!isOwner && userRole === 'main_admin' && onDeleteSeller && (
                            <button
                              type="button"
                              onClick={() => onDeleteSeller(s)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                              title="অপারেটর রিমুভ করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. BACKUP & DATA MAINTENANCE */}
            {activeTab === 'backup' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    ডাটাবেজ ব্যাকআপ, এক্সপোর্ট ও নিরাপত্তা
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    দোকানের সমস্ত স্টক, বিক্রির খাতা ও বাকির রেকর্ড এক ক্লিকে ডাউনলোড বা রিস্টোর করুন
                  </p>
                </div>

                {/* Cloud sync status card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isFirebaseConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        {isFirebaseConnected ? 'Firebase ক্লাউড ডেটাবেস সক্রিয়' : 'অফলাইন লোকাল ডাটাবেস মোড'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isFirebaseConnected
                          ? 'সমস্ত এন্ট্রি স্বয়ংক্রিয়ভাবে ক্লাউডে এবং মোবাইল/ট্যাবলেটে রিয়েল-টাইমে সিঙ্ক হচ্ছে'
                          : 'ইন্টারনেট সংযোগ চেক করুন, আপাতত লোকাল মেমরিতে জমা হচ্ছে'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold ${
                      isFirebaseConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isFirebaseConnected ? 'Online ✅' : 'Offline ⚠️'}
                  </span>
                </div>

                {/* Backup Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onExportJSON}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850/80 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Download className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                        এক ক্লিকে
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-200">পূর্ণাঙ্গ JSON ব্যাকআপ ডাউনলোড</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      স্টক, বিক্রি, বাকি, খরচ ও প্রি-অর্ডারের পূর্ণ ব্যাকআপ ফাইল সংরক্ষণ করুন
                    </div>
                  </button>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                        রিস্টোর
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-200">JSON ব্যাকআপ রিস্টোর করুন</div>
                    <div className="text-[11px] text-slate-400 mt-1 mb-2.5">
                      আগের সেভ করা কোনো ব্যাকআপ ফাইল থেকে ডাটা ফিরিয়ে আনুন
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onImportJSON}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold transition-colors"
                    >
                      ফাইল বাছাই করুন
                    </button>
                  </div>
                </div>

                {/* CSV Reports */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-300">
                    এক্সেল / স্প্রেডশিট CSV রিপোর্ট ডাউনলোড:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={onExportCSVInventory}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-850 text-xs text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        স্টক ইনভেন্টরি CSV
                      </span>
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={onExportCSVSales}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-850 text-xs text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                        বিক্রি হিস্টোরি CSV
                      </span>
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      type="button"
                      onClick={onExportCSVDues}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-850 text-xs text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                        বাকির খাতা CSV
                      </span>
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Cache cleanup */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">সার্চ হিস্টোরি ক্যাশ ক্লিয়ার</div>
                    <div className="text-[11px] text-slate-500">
                      সার্চ বারের ড্রপডাউনে জমা হওয়া পুরনো সব সার্চ রেকর্ড মুছে ফেলুন
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClearRecentSearches}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-bold border border-slate-700/60 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ক্যাশ ক্লিয়ার</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. APPEARANCE & DISPLAY */}
            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    ডিসপ্লে, কারেন্সি ও ইন্টারফেস প্রিফারেন্স
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    টাকার চিহ্ন, পণ্যের ভিউ ডেনসিটি ও ইন্টারফেস প্রদর্শন পছন্দমতো সাজিয়ে নিন
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      টাকার চিহ্ন বা কারেন্সি প্রতীক (Currency Symbol)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['৳', 'Tk', 'BDT', 'TK.'].map(sym => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => handleChange('currencySymbol', sym)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            form.currencySymbol === sym
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-200">কমপ্যাক্ট ইনভেন্টরি ভিউ (Compact View)</div>
                      <div className="text-[11px] text-slate-400">
                        মোবাইল বা ছোট স্ক্রিনে কার্ডগুলো আরও ঘন ও স্লিম আকারে প্রদর্শন করা
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('compactInventoryView', !form.compactInventoryView)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        form.compactInventoryView ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                          form.compactInventoryView ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Sticky Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div>
            {resetConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300 font-bold">ডিফল্ট সেটিংসে ফিরবেন?</span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                >
                  হ্যাঁ, রিসেট
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirm(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  না
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResetConfirm(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ডিফল্ট রিস্টোর</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>সেটিংস সেভ করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
