import React from 'react';
import {
  Smartphone,
  Battery,
  Zap,
  Shield,
  Camera,
  Volume2,
  Cpu,
  Wrench,
  Layers,
  Headphones,
  Plug,
  Disc,
  Radio,
  Sparkles,
  Package,
  HardDrive
} from 'lucide-react';

export interface CategoryDefinition {
  id: string;
  nameBn: string;
  nameEn: string;
  type: 'part' | 'accessory' | 'other';
  iconName: string;
  color: string;
  gradient: string;
  description: string;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  // ================= MOBILE REPAIR PARTS (শুধুমাত্র মোবাইলের পার্টস) =================
  {
    id: 'Display',
    nameBn: 'ডিসপ্লে ও ফোল্ডার',
    nameEn: 'Display / Folder',
    type: 'part',
    iconName: 'Smartphone',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
    gradient: 'from-cyan-500 to-blue-600',
    description: 'এলসিডি, অরিজিনাল ফোল্ডার, ওলেড ও টাচ স্ক্রিন'
  },
  {
    id: 'Battery',
    nameBn: 'ব্যাটারি',
    nameEn: 'Battery',
    type: 'part',
    iconName: 'Battery',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
    gradient: 'from-emerald-500 to-teal-600',
    description: 'হাই-ক্যাপাসিটি ও অরিজিনাল মোবাইল ব্যাটারি'
  },
  {
    id: 'Sub Charging Board',
    nameBn: 'চার্জিং বোর্ড ও পোর্ট',
    nameEn: 'Sub Charging Board',
    type: 'part',
    iconName: 'Zap',
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
    gradient: 'from-amber-500 to-orange-600',
    description: 'সাব বোর্ড, চার্জিং পিন, মাইক্রোফোন ও কানেক্টর'
  },
  {
    id: 'Back Shell',
    nameBn: 'ব্যাকশেল ও বডি ফ্রেম',
    nameEn: 'Back Shell / Body',
    type: 'part',
    iconName: 'Shield',
    color: 'text-purple-400 border-purple-500/30 bg-purple-950/40',
    gradient: 'from-purple-500 to-indigo-600',
    description: 'ব্যাক প্যানেল, মিডল ফ্রেম, সিম ট্রে ও বডি হাউজিং'
  },
  {
    id: 'Camera',
    nameBn: 'ক্যামেরা ও গ্লাস',
    nameEn: 'Camera & Lens',
    type: 'part',
    iconName: 'Camera',
    color: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
    gradient: 'from-rose-500 to-pink-600',
    description: 'সামনের ক্যামেরা, পেছনের ক্যামেরা ও ক্যামেরা গ্লাস'
  },
  {
    id: 'Speaker & Ringer',
    nameBn: 'স্পিকার ও রিংগার',
    nameEn: 'Speaker & Buzzer',
    type: 'part',
    iconName: 'Volume2',
    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/40',
    gradient: 'from-yellow-500 to-amber-600',
    description: 'লাউডস্পিকার, কানের স্পিকার (ইয়ারপিস) ও ভাইব্রেটর'
  },
  {
    id: 'Flex Cable',
    nameBn: 'ফ্লেক্স রিবন ও ক্যাবল',
    nameEn: 'Flex Ribbon Cable',
    type: 'part',
    iconName: 'Radio',
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/40',
    gradient: 'from-indigo-500 to-sky-600',
    description: 'পাওয়ার/ভলিউম ফ্লেক্স, মাদারবোর্ড সাব ফ্লেক্স, এলসিডি ফ্লেক্স'
  },
  {
    id: 'Touch & OCA Glass',
    nameBn: 'টাচ ও ওকা গ্লাস',
    nameEn: 'Touch / OCA Glass',
    type: 'part',
    iconName: 'Layers',
    color: 'text-teal-400 border-teal-500/30 bg-teal-950/40',
    gradient: 'from-teal-500 to-cyan-600',
    description: 'টাচ স্ক্রিন, ডিসপ্লে ফ্রন্ট গ্লাস, ওকা শিট'
  },
  {
    id: 'IC & Motherboard',
    nameBn: 'আইসি ও মাদারবোর্ড',
    nameEn: 'IC & Motherboard Parts',
    type: 'part',
    iconName: 'Cpu',
    color: 'text-blue-400 border-blue-500/30 bg-blue-950/40',
    gradient: 'from-blue-600 to-violet-600',
    description: 'পাওয়ার আইসি, চার্জিং আইসি, নেটওয়ার্ক আইসি ও কম্পোনেন্টস'
  },
  {
    id: 'Repair Tools & Paste',
    nameBn: 'সার্ভিসিং টুলস ও পেস্ট',
    nameEn: 'Tools & Adhesives',
    type: 'part',
    iconName: 'Wrench',
    color: 'text-orange-400 border-orange-500/30 bg-orange-950/40',
    gradient: 'from-orange-500 to-red-600',
    description: 'ডিসপ্লে আঠা (T-7000/B-7000), রাবার, টুইজার, স্ক্রু ড্রাইভার'
  },

  // ================= ACCESSORIES & GADGETS (এক্সেসরিজ ও গ্যাজেট) =================
  {
    id: 'Charger',
    nameBn: 'চার্জার ও এডাপ্টার',
    nameEn: 'Charger & Adapter',
    type: 'accessory',
    iconName: 'Plug',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
    gradient: 'from-emerald-500 to-green-600',
    description: 'ফাস্ট চার্জার, টাইপ-সি এডাপ্টার, কার চার্জার'
  },
  {
    id: 'Cable',
    nameBn: 'ডাটা কেবল',
    nameEn: 'Data Cable',
    type: 'accessory',
    iconName: 'Zap',
    color: 'text-sky-400 border-sky-500/30 bg-sky-950/40',
    gradient: 'from-sky-500 to-blue-600',
    description: 'টাইপ-সি, আইফোন লাইটনিং, মাইক্রো ইউএসবি কেবল'
  },
  {
    id: 'Earphones',
    nameBn: 'ইয়ারফোন ও হেডফোন',
    nameEn: 'Earphones / Headsets',
    type: 'accessory',
    iconName: 'Headphones',
    color: 'text-violet-400 border-violet-500/30 bg-violet-950/40',
    gradient: 'from-violet-500 to-purple-600',
    description: 'তারযুক্ত ইয়ারফোন, গেমিং হেডফোন'
  },
  {
    id: 'Airbuds',
    nameBn: 'এয়ারবাডস ও ব্লুটুথ',
    nameEn: 'TWS Airbuds / Neckband',
    type: 'accessory',
    iconName: 'Disc',
    color: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-950/40',
    gradient: 'from-fuchsia-500 to-pink-600',
    description: 'ওয়্যারলেস এয়ারবাডস, নেকব্যান্ড, ব্লুটুথ স্পিকার'
  },
  {
    id: 'Screen Protector',
    nameBn: 'স্ক্রিন প্রোটেক্টর গ্লাস',
    nameEn: 'Screen Protector Glass',
    type: 'accessory',
    iconName: 'Shield',
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
    gradient: 'from-amber-500 to-yellow-600',
    description: 'টেম্পার্ড গ্লাস, ইউভি গ্লাস, ম্যাট ও প্রাইভেসি প্রটেক্টর'
  },
  {
    id: 'Back Cover',
    nameBn: 'মোবাইল ব্যাককভার',
    nameEn: 'Back Cover & Case',
    type: 'accessory',
    iconName: 'Layers',
    color: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
    gradient: 'from-rose-500 to-orange-600',
    description: 'সিলিকন কেস, লেদার কভার, আর্মার কভার'
  },
  {
    id: 'Power Bank',
    nameBn: 'পাওয়ার ব্যাংক',
    nameEn: 'Power Bank',
    type: 'accessory',
    iconName: 'HardDrive',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
    gradient: 'from-cyan-500 to-teal-600',
    description: 'পোর্টেবল চার্জার ও পাওয়ার ব্যাংক'
  }
];

export const MOBILE_PARTS_CATEGORY_IDS = CATEGORY_DEFINITIONS
  .filter(c => c.type === 'part')
  .map(c => c.id);

export const ACCESSORY_CATEGORY_IDS = CATEGORY_DEFINITIONS
  .filter(c => c.type === 'accessory')
  .map(c => c.id);

// Robust detection helper: Checks if an item or category name belongs to Mobile Parts
export function isMobilePartItem(itemOrCat: { category?: string; name?: string; itemType?: string } | string): boolean {
  if (typeof itemOrCat === 'string') {
    return checkIsPartString(itemOrCat);
  }
  if (itemOrCat?.itemType === 'part') return true;
  if (itemOrCat?.itemType === 'accessory') return false;

  const cat = itemOrCat?.category || '';
  const name = itemOrCat?.name || '';
  return checkIsPartString(cat) || checkIsPartString(name);
}

function checkIsPartString(str: string): boolean {
  if (!str) return false;
  const s = str.toLowerCase().trim();
  const partsKeywords = [
    'display', 'ডিসপ্লে', 'folder', 'ফোল্ডার', 'lcd', 'oled',
    'battery', 'ব্যাটারি',
    'sub', 'charging board', 'charging port', 'চার্জিং বোর্ড', 'চার্জিং পোর্ট', 'পিন', 'কানেক্টর',
    'shell', 'back shell', 'ব্যাকশেল', 'body', 'ফ্রেম', 'frame', 'হousing',
    'camera', 'ক্যামেরা', 'lens',
    'speaker', 'ringer', 'স্পিকার', 'রিংগার', 'buzzer', 'earpiece',
    'flex', 'ribbon', 'ফ্লেক্স', 'রিবন',
    'touch', 'oca', 'টাচ', 'গ্লাস ফোল্ডার',
    'ic', 'motherboard', 'আইসি', 'মাদারবোর্ড',
    'tools', 'paste', 'আঠা', 't-7000', 'b-7000',
    'part', 'পার্টস'
  ];
  return partsKeywords.some(kw => s.includes(kw));
}

// Helper to get user-friendly category display
export function getCategoryDisplay(categoryId: string): { nameBn: string; nameEn: string; iconName: string; color: string; isPart: boolean } {
  const match = CATEGORY_DEFINITIONS.find(c => c.id.toLowerCase() === categoryId.toLowerCase());
  if (match) {
    return {
      nameBn: match.nameBn,
      nameEn: match.nameEn,
      iconName: match.iconName,
      color: match.color,
      isPart: match.type === 'part'
    };
  }
  
  const isPart = checkIsPartString(categoryId);
  return {
    nameBn: categoryId,
    nameEn: categoryId,
    iconName: isPart ? 'Smartphone' : 'Package',
    color: isPart ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' : 'text-slate-300 border-slate-700 bg-slate-900',
    isPart
  };
}
