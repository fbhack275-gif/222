import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanBarcode,
  Search,
  Printer,
  Plus,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
  Copy,
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  Layers,
  Check,
  Edit2,
  Link,
  Save
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { InventoryItem } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onOpenSell: (item: InventoryItem) => void;
  onAddToCart: (item: InventoryItem) => void;
  onOpenAddItemWithSku?: (sku: string) => void;
  onDirectSaveItem?: (item: InventoryItem) => Promise<InventoryItem> | void;
  onUpdateItemSku?: (itemId: string, newSku: string) => Promise<InventoryItem | null> | void;
  onOpenEditItem?: (item: InventoryItem) => void;
  isPrivacyMode: boolean;
}

const SUPPORTED_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

// Play pleasant POS scanner beep using Web Audio API
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // AudioContext blocked or unsupported, safely ignore
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onOpenSell,
  onAddToCart,
  onDirectSaveItem,
  onUpdateItemSku,
  isPrivacyMode,
}) => {
  // Navigation tabs: default to 'camera' so clicking "স্ক্যান" opens camera scanner immediately
  const [activeTab, setActiveTab] = useState<'camera' | 'search' | 'upload' | 'labels'>('camera');
  const [skuQuery, setSkuQuery] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [continuousScan, setContinuousScan] = useState(false);
  const [continuousMessage, setContinuousMessage] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');

  // Unmatched Barcode Actions State
  const [unmatchedAction, setUnmatchedAction] = useState<'link' | 'new'>('link');
  const [selectedExistingItemId, setSelectedExistingItemId] = useState<string>('');
  const [existingItemSearch, setExistingItemSearch] = useState('');

  // Quick Inline Add / Edit Form State (using strings for numeric fields so 0 can be deleted cleanly!)
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    brand: string;
    category: string;
    models: string;
    stock: string;
    sellingPrice: string;
    price: string;
    sku: string;
  }>({
    name: '',
    brand: 'Vivo',
    category: 'Display',
    models: '',
    stock: '1',
    sellingPrice: '',
    price: '',
    sku: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const scannerContainerId = 'anik-barcode-reader-view';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);

  // Safe inventory lookup helper (guarantees no undefined or lowercase exceptions)
  const findInventoryMatch = (items: InventoryItem[], code: string): InventoryItem | null => {
    if (!code || !code.trim()) return null;
    const q = code.toLowerCase().trim();
    return items.find(i => {
      const itemSku = String(i.sku || '').toLowerCase().trim();
      const itemId = String(i.id || '').toLowerCase().trim();
      const fbKey = String(i._fbKey || '').toLowerCase().trim();
      const name = String(i.name || '').toLowerCase().trim();
      return (
        (itemSku && itemSku === q) ||
        (itemId && itemId === q) ||
        (fbKey && fbKey === q) ||
        (itemSku && itemSku.includes(q)) ||
        (name && name === q)
      );
    }) || null;
  };

  // Dynamically map scannedCode to existing inventory state whenever scannedCode or inventory changes
  useEffect(() => {
    if (scannedCode) {
      const found = findInventoryMatch(inventory, scannedCode);
      setMatchedItem(found);
      if (found) {
        setEditFormData({
          name: found.name || '',
          brand: found.brand || 'Vivo',
          category: found.category || 'Display',
          models: Array.isArray(found.models) ? found.models.join(', ') : '',
          stock: found.stock !== undefined && found.stock !== null ? String(found.stock) : '',
          sellingPrice: found.sellingPrice ? String(found.sellingPrice) : '',
          price: found.price ? String(found.price) : '',
          sku: found.sku || scannedCode
        });
      } else {
        setEditFormData(prev => ({
          ...prev,
          name: '',
          stock: '1',
          sellingPrice: '',
          price: '',
          sku: scannedCode
        }));
      }
    }
  }, [scannedCode, inventory]);

  const stopCameraScanner = async () => {
    isStartingRef.current = false;
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    setIsCameraStarting(false);

    // Gently pause and release any active video streams before clearing DOM
    try {
      const container = document.getElementById(scannerContainerId);
      if (container) {
        const videos = container.querySelectorAll('video');
        videos.forEach(v => {
          try {
            v.pause();
            if (v.srcObject) {
              const stream = v.srcObject as MediaStream;
              stream.getTracks().forEach(track => {
                try {
                  track.stop();
                } catch {}
              });
              v.srcObject = null;
            }
          } catch {}
        });
      }
    } catch {}

    if (html5QrCodeRef.current) {
      const instance = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
      } catch {
        // Ignore stop errors
      }
      try {
        instance.clear();
      } catch {
        // Ignore clear errors
      }
    }
    setIsCameraActive(false);
    setTorchOn(false);
    setTorchAvailable(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
    playBeep();

    setScannedCode(cleanCode);
    setSkuQuery(cleanCode);
    setCameraError(null);

    const found = findInventoryMatch(inventory, cleanCode);

    if (found) {
      setMatchedItem(found);
      if (continuousScan) {
        onAddToCart(found);
        setContinuousMessage(`✅ কার্টে যোগ হয়েছে: ${found.name} (৳${found.sellingPrice})`);
        setTimeout(() => setContinuousMessage(null), 2500);
      } else {
        stopCameraScanner();
      }
    } else {
      setMatchedItem(null);
      if (!continuousScan) {
        stopCameraScanner();
      } else {
        setContinuousMessage(`⚠️ স্টকে পাওয়া যায়নি: "${cleanCode}"`);
        setTimeout(() => setContinuousMessage(null), 2500);
      }
    }
  };

  const startCameraScanner = async (overrideCameraId?: string) => {
    if (isStartingRef.current) return;
    setCameraError(null);
    await stopCameraScanner();

    if (!isOpen || !isMountedRef.current) return;

    isStartingRef.current = true;
    setIsCameraStarting(true);

    startTimeoutRef.current = setTimeout(async () => {
      startTimeoutRef.current = null;
      if (!isMountedRef.current || !isStartingRef.current || !isOpen) {
        isStartingRef.current = false;
        setIsCameraStarting(false);
        return;
      }

      const elem = document.getElementById(scannerContainerId);
      if (!elem) {
        isStartingRef.current = false;
        setIsCameraStarting(false);
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: SUPPORTED_BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false
        });
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.max(140, Math.min(280, Math.floor(viewfinderWidth * 0.8)));
            const height = Math.max(90, Math.min(160, Math.floor(viewfinderHeight * 0.55)));
            return { width, height };
          },
          aspectRatio: 1.333334,
        };

        const camId = overrideCameraId !== undefined ? overrideCameraId : selectedCameraId;
        let started = false;

        // Attempt 1: Specific camera ID or rear environment camera
        try {
          const primaryTarget = camId
            ? { deviceId: { exact: camId } }
            : { facingMode: 'environment' };
          await html5QrCode.start(
            primaryTarget,
            config,
            (decodedText) => handleScanSuccess(decodedText),
            () => {}
          );
          started = true;
        } catch {
          // Attempt 2: Fallback to user/front camera (e.g., laptop webcam)
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              (decodedText) => handleScanSuccess(decodedText),
              () => {}
            );
            started = true;
          } catch {
            // Attempt 3: Enumerate cameras and pick the last (usually rear) or first camera
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              setCameras(devices);
              const backCam = devices.find(d =>
                /back|rear|environment/i.test(d.label)
              );
              const chosenId = backCam ? backCam.id : devices[devices.length - 1].id;
              setSelectedCameraId(chosenId);
              await html5QrCode.start(
                chosenId,
                config,
                (decodedText) => handleScanSuccess(decodedText),
                () => {}
              );
              started = true;
            }
          }
        }

        if (!started) {
          throw new Error('No camera started');
        }

        if (!isMountedRef.current || !isStartingRef.current) {
          // Was stopped while starting
          await stopCameraScanner();
          return;
        }

        setIsCameraActive(true);
        isStartingRef.current = false;
        setIsCameraStarting(false);

        // Populate camera dropdown list after permission is granted
        Html5Qrcode.getCameras()
          .then(devices => {
            if (devices && devices.length > 0 && isMountedRef.current) {
              setCameras(devices);
            }
          })
          .catch(() => {});

        try {
          const track = html5QrCode.getRunningTrackCameraCapabilities();
          if (track && 'torch' in track) {
            setTorchAvailable(true);
          }
        } catch {
          setTorchAvailable(false);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        console.warn('Camera scanner start error:', err);
        isStartingRef.current = false;
        setIsCameraStarting(false);
        setIsCameraActive(false);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('interrupted') || errMsg.includes('removed from the document')) {
          // Normal interruption when modal closes
          return;
        }
        if (errMsg.includes('Permission') || errMsg.includes('NotAllowedError')) {
          setCameraError('ক্যামেরা ব্যবহারের অনুমতি (Permission) পাওয়া যায়নি। ব্রাউজারে ক্যামেরা Allow করুন অথবা নিচের "ক্যামেরা স্ন্যাপ" বাটন ব্যবহার করুন।');
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
          setCameraError('আপনার ডিভাইসে সরাসরি ক্যামেরা পাওয়া যায়নি। নিচে ছবি তুলে বা SKU কোড লিখে সার্চ করুন।');
        } else {
          setCameraError('লাইভ ক্যামেরা চালু করা যায়নি। নিচের "📸 ছবি তুলে স্ক্যান" বাটনে চাপ দিন অথবা সরাসরি কোড লিখুন।');
        }
      }
    }, 150);
  };

  // Mount/Unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCameraScanner();
    };
  }, []);

  // Manage camera lifecycle when modal opens/closes or tab changes
  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setScannedCode(null);
      setSkuQuery('');
      setMatchedItem(null);
      setContinuousMessage(null);
      setCameraError(null);
      setIsInlineEditing(false);
      setActiveTab('camera');
      return;
    }

    if (activeTab === 'camera' && !scannedCode) {
      startCameraScanner();
    } else if (activeTab !== 'camera') {
      stopCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [isOpen, activeTab]);

  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !isCameraActive) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet]
      });
      setTorchOn(nextState);
    } catch {
      setTorchAvailable(false);
    }
  };

  const handleScanImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setContinuousMessage('🔍 ছবি থেকে বারকোড স্ক্যান করা হচ্ছে...');

    try {
      // Try native BarcodeDetector first if supported by browser
      if ('BarcodeDetector' in window) {
        try {
          const BarcodeDetectorClass = (window as unknown as {
            BarcodeDetector: new (opts?: { formats?: string[] }) => {
              detect: (source: ImageBitmap) => Promise<Array<{ rawValue: string }>>;
            };
          }).BarcodeDetector;
          const detector = new BarcodeDetectorClass();
          const bitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(bitmap);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            setContinuousMessage(null);
            handleScanSuccess(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fall through to Html5Qrcode.scanFile
        }
      }

      const html5QrCode = new Html5Qrcode('barcode-file-temp-view', {
        formatsToSupport: SUPPORTED_BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
        verbose: false
      });
      const decoded = await html5QrCode.scanFile(file, false);
      setContinuousMessage(null);
      handleScanSuccess(decoded);
    } catch {
      setContinuousMessage(null);
      setCameraError('এই ছবিতে কোনো স্পষ্ট বারকোড বা কিউআর কোড পাওয়া যায়নি। বারকোডের আরও কাছ থেকে স্পষ্ট ছবি তুলুন।');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraCaptureInputRef.current) cameraCaptureInputRef.current.value = '';
    }
  };

  const handleManualSearch = (codeToSearch: string) => {
    setSkuQuery(codeToSearch);
    const clean = codeToSearch.trim();
    if (!clean) {
      setMatchedItem(null);
      setScannedCode(null);
      return;
    }
    setScannedCode(clean);
    const found = findInventoryMatch(inventory, clean);
    setMatchedItem(found);
  };

  // 1. SAVE: Link scanned barcode to an existing inventory product
  const handleSaveBarcodeToExisting = async () => {
    if (!selectedExistingItemId || !scannedCode || !onUpdateItemSku) return;
    setIsSaving(true);
    try {
      const updated = await onUpdateItemSku(selectedExistingItemId, scannedCode.trim());
      if (updated) {
        setMatchedItem(updated);
        setContinuousMessage(`✅ '${updated.name}' পণ্যে বারকোড (${scannedCode}) সফলভাবে সেভ ও ফায়ারবেসে সংরক্ষিত হয়েছে!`);
        setTimeout(() => setContinuousMessage(null), 3500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 2. SAVE: Direct Quick-Add a new item with this barcode
  const handleSaveNewItemWithBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !onDirectSaveItem) return;

    setIsSaving(true);
    try {
      const modelsArr = editFormData.models
        ? editFormData.models.split(/[,;\n]+/).map(m => m.trim()).filter(Boolean)
        : [];

      const targetId = 'item_' + Date.now();
      const newItem: InventoryItem = {
        id: targetId,
        _fbKey: targetId,
        category: editFormData.category.trim() || 'Display',
        brand: editFormData.brand.trim() || 'Vivo',
        name: editFormData.name.trim(),
        models: modelsArr,
        stock: Math.max(0, parseInt(String(editFormData.stock), 10) || 0),
        price: Math.max(0, parseFloat(String(editFormData.price)) || 0),
        sellingPrice: Math.max(0, parseFloat(String(editFormData.sellingPrice)) || 0),
        sku: (editFormData.sku || scannedCode || '').trim(),
        updatedAt: new Date().toLocaleDateString('en-GB')
      };

      const saved = await onDirectSaveItem(newItem);
      if (saved) {
        setMatchedItem(saved);
        setContinuousMessage(`✅ '${saved.name}' সফলভাবে স্টকে ও ফায়ারবেসে সেভ হয়েছে!`);
        setTimeout(() => setContinuousMessage(null), 3500);
      }
    } finally {
      setIsSaving(false);
      setIsInlineEditing(false);
    }
  };

  // 3. SAVE: Update existing matched item
  const handleSaveExistingItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedItem || !editFormData.name.trim() || !onDirectSaveItem) return;

    setIsSaving(true);
    try {
      const modelsArr = editFormData.models
        ? editFormData.models.split(/[,;\n]+/).map(m => m.trim()).filter(Boolean)
        : (matchedItem.models || []);

      const safeKey = String(matchedItem._fbKey || matchedItem.id).replace(/[.#$[\]/]/g, '_');
      const updatedItem: InventoryItem = {
        ...matchedItem,
        id: matchedItem.id || safeKey,
        _fbKey: safeKey,
        category: editFormData.category.trim() || matchedItem.category,
        brand: editFormData.brand.trim() || matchedItem.brand,
        name: editFormData.name.trim(),
        models: modelsArr,
        stock: Math.max(0, parseInt(String(editFormData.stock), 10) || 0),
        price: Math.max(0, parseFloat(String(editFormData.price)) || 0),
        sellingPrice: Math.max(0, parseFloat(String(editFormData.sellingPrice)) || 0),
        sku: (editFormData.sku || matchedItem.sku || '').trim(),
        updatedAt: new Date().toLocaleDateString('en-GB')
      };

      const saved = await onDirectSaveItem(updatedItem);
      if (saved) {
        setMatchedItem(saved);
        setContinuousMessage(`✅ '${saved.name}' এর তথ্য সফলভাবে আপডেট ও ফায়ারবেসে সেভ হয়েছে!`);
        setTimeout(() => setContinuousMessage(null), 3500);
      }
    } finally {
      setIsSaving(false);
      setIsInlineEditing(false);
    }
  };

  const handlePrintLabel = (item: InventoryItem) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Sticker - ${item.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; text-align: center; padding: 12px; margin: 0; background: white; color: black; }
            .shop { font-size: 14px; font-weight: 900; letter-spacing: 1px; border-bottom: 1px dashed #666; padding-bottom: 4px; }
            .name { font-size: 12px; margin: 6px 0 2px; font-weight: bold; }
            .brand { font-size: 10px; color: #444; }
            .sku { font-size: 12px; font-weight: bold; letter-spacing: 2px; font-family: monospace; margin: 4px 0; }
            .bars { letter-spacing: 3px; font-size: 20px; font-family: monospace; font-weight: bold; margin: 4px 0; }
            .price { font-size: 14px; font-weight: 900; margin-top: 4px; border-top: 1px dashed #666; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="shop">ANIK TELECOM</div>
          <div class="name">${item.name}</div>
          <div class="brand">${item.brand} ${item.models ? `(${Array.isArray(item.models) ? item.models.join(', ') : item.models})` : ''}</div>
          <div class="bars">||||| | |||| ||| | |||</div>
          <div class="sku">${item.sku || item.id}</div>
          <div class="price">Price: ৳${item.sellingPrice}</div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  if (!isOpen) return null;

  // Safe search results for instant search
  const searchResults = skuQuery.trim()
    ? inventory.filter(i => {
        const q = skuQuery.toLowerCase().trim();
        const sku = String(i.sku || '').toLowerCase();
        const id = String(i.id || '').toLowerCase();
        const name = String(i.name || '').toLowerCase();
        const brand = String(i.brand || '').toLowerCase();
        const models = Array.isArray(i.models)
          ? i.models.some(m => m && String(m).toLowerCase().includes(q))
          : false;

        return (
          sku.includes(q) ||
          id.includes(q) ||
          name.includes(q) ||
          brand.includes(q) ||
          models
        );
      })
    : inventory.slice(0, 20);

  // Filtered inventory for linking barcode to existing product
  const linkableItems = existingItemSearch.trim()
    ? inventory.filter(i => {
        const q = existingItemSearch.toLowerCase().trim();
        const name = String(i.name || '').toLowerCase();
        const brand = String(i.brand || '').toLowerCase();
        const sku = String(i.sku || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || sku.includes(q);
      })
    : inventory.slice(0, 15);

  const selectedLinkItem = inventory.find(i => i.id === selectedExistingItemId || i._fbKey === selectedExistingItemId);

  // Label print items
  const labelFilteredItems = labelSearch.trim()
    ? inventory.filter(i => {
        const q = labelSearch.toLowerCase().trim();
        const sku = String(i.sku || '').toLowerCase();
        const name = String(i.name || '').toLowerCase();
        const brand = String(i.brand || '').toLowerCase();
        return sku.includes(q) || name.includes(q) || brand.includes(q);
      })
    : inventory.slice(0, 15);

  // Shared Matched / Unmatched Item Result UI so it works identically in both Camera & Search tabs
  const renderScannedOrMatchedResult = () => (
    <>
      {/* Matched Product Banner (When item exists for this code) */}
      {matchedItem && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 space-y-3 animate-in fade-in shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  ✓ পণ্য স্টকে সংযুক্ত রয়েছে
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  SKU: {matchedItem.sku || matchedItem.id}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-100 mt-1">{matchedItem.name}</h4>
              <p className="text-[11px] text-slate-400">
                {matchedItem.brand} · {matchedItem.category} · স্টক: <strong className="text-cyan-300">{matchedItem.stock} টি</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-emerald-400 font-mono">
                ৳{matchedItem.sellingPrice}
              </span>
              {!isPrivacyMode && (
                <span className="block text-[10px] text-slate-500">
                  কেনা: ৳{matchedItem.price}
                </span>
              )}
            </div>
          </div>

          {/* Actions on Matched Item */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSell(matchedItem);
              }}
              disabled={matchedItem.stock <= 0}
              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>বিক্রি করুন</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onAddToCart(matchedItem);
                setContinuousMessage(`✅ কার্টে যোগ হয়েছে: ${matchedItem.name}!`);
                setTimeout(() => setContinuousMessage(null), 2000);
              }}
              disabled={matchedItem.stock <= 0}
              className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-black rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>কার্টে যোগ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInlineEditing(!isInlineEditing)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1"
              title="তথ্য এডিট ও সেভ"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isInlineEditing ? 'বন্ধ' : 'এডিট ও সেভ'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrintLabel(matchedItem)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              title="স্টিকার প্রিন্ট"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          {/* Inline Edit Form for Matched Item */}
          {isInlineEditing && (
            <form onSubmit={handleSaveExistingItemEdit} className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/40 space-y-2.5 mt-2 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-cyan-300">পণ্যের তথ্য ও স্টক আপডেট করুন</span>
                <span className="text-[10px] text-slate-500 font-mono">ID: {matchedItem.id}</span>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">পণ্যের নাম</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className={`grid ${isPrivacyMode ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">স্টক (পিস)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editFormData.stock}
                    onChange={e => setEditFormData({ ...editFormData, stock: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={editFormData.sellingPrice}
                    onChange={e => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                {!isPrivacyMode && (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">ক্রয়মূল্য (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={editFormData.price}
                      onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">বারকোড / SKU কোড</label>
                <input
                  type="text"
                  value={editFormData.sku}
                  onChange={e => setEditFormData({ ...editFormData, sku: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : '💾 সেভ করুন ও ফায়ারবেসে আপডেট করুন'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* UNMATCHED SCANNER RESULT: SAVE / LINK ACTIONS */}
      {scannedCode && !matchedItem && (
        <div className="p-4 rounded-3xl bg-slate-950/90 border-2 border-amber-500/60 space-y-3.5 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black text-amber-300 font-mono">কোড: {scannedCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(scannedCode)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg"
              >
                {copiedSku ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSku ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>
              {activeTab === 'camera' && (
                <button
                  type="button"
                  onClick={() => {
                    setScannedCode(null);
                    setSkuQuery('');
                    setMatchedItem(null);
                    startCameraScanner();
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>আবার স্ক্যান</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300">
            ⚠️ এই বারকোডের কোনো মালামাল স্টকে নেই। নিচের যে কোনো একটি অপশন বেছে নিন:
          </p>

          {/* Two Sub-options for Unmatched Barcode */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setUnmatchedAction('link')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                unmatchedAction === 'link'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>১. স্টকের পণ্যে যুক্ত করুন</span>
            </button>

            <button
              type="button"
              onClick={() => setUnmatchedAction('new')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                unmatchedAction === 'new'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>২. নতুন পার্টস হিসেবে সেভ</span>
            </button>
          </div>

          {/* ACTION 1: LINK BARCODE TO EXISTING PRODUCT */}
          {unmatchedAction === 'link' && (
            <div className="space-y-3 pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={existingItemSearch}
                  onChange={e => setExistingItemSearch(e.target.value)}
                  placeholder="স্টকের কোন পণ্যে এই বারকোডটি লাগাবেন? পণ্য খুঁজুন..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Dropdown / List of existing items */}
              <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                {linkableItems.map((item, idx) => (
                  <button
                    key={`link_${item._fbKey || item.id || 'item'}_${idx}`}
                    type="button"
                    onClick={() => setSelectedExistingItemId(item.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedExistingItemId === item.id
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <span>{item.name}</span>
                      <span className="block text-[10px] text-slate-500">{item.brand} · স্টক: {item.stock} টি</span>
                    </div>
                    <span className="font-mono text-emerald-400">৳{item.sellingPrice}</span>
                  </button>
                ))}
              </div>

              {selectedLinkItem && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 block font-semibold">সিলেক্টেড পণ্য:</span>
                    <span className="text-xs font-bold text-slate-100">{selectedLinkItem.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">৳{selectedLinkItem.sellingPrice}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveBarcodeToExisting}
                disabled={!selectedExistingItemId || isSaving}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : '💾 এই পণ্যে বারকোডটি সেভ করুন'}</span>
              </button>
            </div>
          )}

          {/* ACTION 2: QUICK-ADD NEW PRODUCT WITH THIS BARCODE */}
          {unmatchedAction === 'new' && (
            <form onSubmit={handleSaveNewItemWithBarcode} className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">পার্টস / পণ্যের নাম *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="যেমন: Vivo Y20 Display Original"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">ব্র্যান্ড</label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editFormData.stock}
                    onChange={e => setEditFormData({ ...editFormData, stock: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={editFormData.sellingPrice}
                    onChange={e => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">ক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={editFormData.price}
                    onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : '💾 নতুন মালামাল সেভ করুন ও স্টকে তুলুন'}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Offscreen container for file/photo barcode decoding (must have non-zero size) */}
      <div
        id="barcode-file-temp-view"
        style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '320px', height: '320px', overflow: 'hidden' }}
      />

      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-inner">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>বারকোড স্ক্যানার ও SKU সেন্টার</span>
              </h3>
              <p className="text-xs text-slate-400">ক্যামেরা স্ক্যান, বারকোড অ্যাসাইন ও দ্রুত বিক্রি</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 rounded-full p-2 transition-colors active:scale-95"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 pb-2 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'camera'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📷 ক্যামেরা স্ক্যানার</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'search'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>🔍 SKU ও কোড সার্চ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>🖼️ ছবি আপলোড</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('labels')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap active:scale-95 ${
              activeTab === 'labels'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>🏷️ স্টিকার প্রিন্ট</span>
          </button>
        </div>

        {/* Realtime Notification Banner */}
        {continuousMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{continuousMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ================= TAB 1: LIVE CAMERA SCANNER ================= */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {/* Quick Manual / USB Scanner Input Bar inside Camera Tab */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                <input
                  type="text"
                  value={skuQuery}
                  onChange={e => handleManualSearch(e.target.value)}
                  placeholder="বারকোড স্ক্যান করুন অথবা এখানে সরাসরি কোড/SKU লিখুন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                {skuQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      handleManualSearch('');
                      startCameraScanner();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Camera Viewport Box */}
              <div className="relative bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl min-h-[260px] w-full">
                {/* Video Mount Container - Always full width so html5-qrcode never fails */}
                <div id={scannerContainerId} className="w-full min-h-[260px]" />

                {isCameraActive && !scannedCode && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <div className="relative w-60 h-32 border-2 border-cyan-400/70 rounded-2xl bg-cyan-500/5 shadow-2xl flex items-center justify-center overflow-hidden">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
                      <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                    <span className="text-[11px] text-cyan-300 font-mono mt-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 font-bold backdrop-blur-sm">
                      বারকোড বা QR কোড বক্সের মাঝে ধরুন
                    </span>
                  </div>
                )}

                {!isCameraActive && (
                  <div className="absolute inset-0 z-10 bg-slate-950/95 p-5 flex flex-col items-center justify-center text-center space-y-3">
                    <Camera className={`w-10 h-10 text-cyan-400 mx-auto ${isCameraStarting ? 'animate-bounce' : 'animate-pulse'}`} />
                    <h4 className="text-sm font-bold text-slate-200">
                      {isCameraStarting ? 'ক্যামেরা চালু হচ্ছে...' : 'ক্যামেরা বারকোড স্ক্যানার'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {cameraError || 'মোবাইলের ক্যামেরা দিয়ে বারকোড স্ক্যান করতে নিচের বাটনে ট্যাপ করুন।'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startCameraScanner()}
                        disabled={isCameraStarting}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-lg flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isCameraStarting ? 'চালু হচ্ছে...' : 'লাইভ ক্যামেরা চালু করুন'}</span>
                      </button>

                      {/* Direct Native Camera Snapshot Fallback (works even if WebRTC video is blocked) */}
                      <label className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer">
                        <ScanBarcode className="w-4 h-4" />
                        <span>📸 ছবি তুলে স্ক্যান</span>
                        <input
                          ref={cameraCaptureInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleScanImageFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {cameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={e => {
                        const newId = e.target.value;
                        setSelectedCameraId(newId);
                        startCameraScanner(newId);
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                    >
                      {cameras.map((c, idx) => (
                        <option key={c.id || idx} value={c.id}>
                          {c.label || `ক্যামেরা ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {torchAvailable && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                        torchOn
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                      title="ফ্ল্যাশ লাইট (টর্চ)"
                    >
                      {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                      <span className="text-[11px]">{torchOn ? 'টর্চ অন' : 'টর্চ'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContinuousScan(!continuousScan)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      continuousScan
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>ধারাবাহিক স্ক্যান: {continuousScan ? 'অন' : 'অফ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScannedCode(null);
                      setMatchedItem(null);
                      startCameraScanner();
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-all active:scale-95"
                    title="রিলোড ক্যামেরা"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render full Matched / Unmatched item actions directly in Camera view */}
              {renderScannedOrMatchedResult()}
            </div>
          )}

          {/* ================= TAB 2: INSTANT SKU SEARCH & MANUAL INPUT ================= */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="text"
                    autoFocus
                    value={skuQuery}
                    onChange={e => handleManualSearch(e.target.value)}
                    placeholder="বারকোড বা SKU কোড বা মডেল লিখুন (অথবা বারকোড গান দিয়ে স্ক্যান করুন)..."
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner font-mono font-semibold"
                  />
                  {skuQuery && (
                    <button
                      type="button"
                      onClick={() => handleManualSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>💡 USB বা ব্লুটুথ বারকোড গান রিডার দিয়ে ট্রিগার চাপলে কোডটি স্বয়ংক্রিয় বসবে।</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('camera')}
                    className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>ক্যামেরা দিয়ে স্ক্যান</span>
                  </button>
                </div>
              </div>

              {renderScannedOrMatchedResult()}

              {/* Product List below Search */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  {skuQuery.trim() ? `সার্চ রেজাল্ট (${searchResults.length} টি)` : `স্টকের সাম্প্রতিক মালামালসমূহ (${searchResults.length} টি)`}
                </span>

                {searchResults.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-xs text-slate-500">
                    কোনো মালামাল পাওয়া যায়নি।
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <div
                      key={`sr_${item._fbKey || item.id || 'item'}_${idx}`}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/40 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">{item.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                            {item.brand}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>SKU: <strong className="text-cyan-400">{item.sku || item.id}</strong></span>
                          <span>·</span>
                          <span>স্টক: <strong className={item.stock <= 2 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{item.stock} টি</strong></span>
                          <span>·</span>
                          <span>বিক্রয়: <strong className="text-emerald-400 font-bold">৳{item.sellingPrice}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSell(item);
                          }}
                          disabled={item.stock <= 0}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
                        >
                          বিক্রি
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(item);
                            setContinuousMessage(`✅ কার্টে যোগ হয়েছে: ${item.name}!`);
                            setTimeout(() => setContinuousMessage(null), 2000);
                          }}
                          disabled={item.stock <= 0}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>কার্ট</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintLabel(item)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="বারকোড স্টিকার প্রিন্ট"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: IMAGE UPLOAD SCAN ================= */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-950/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">বারকোড বা QR কোডের ছবি আপলোড</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    গ্যালারি বা ফাইল থেকে ছবি সিলেক্ট করুন, সিস্টেম স্বয়ংক্রিয়ভাবে কোডটি ডিকোড করবে।
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-cyan-500/20">
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>ছবি নির্বাচন করুন</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScanImageFile}
                    className="hidden"
                  />
                </label>
              </div>

              {cameraError && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-bold rounded-xl text-center">
                  ⚠️ {cameraError}
                </div>
              )}

              {renderScannedOrMatchedResult()}
            </div>
          )}

          {/* ================= TAB 4: BARCODE LABEL GENERATOR & PRINT ================= */}
          {activeTab === 'labels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">বারকোড লেবেল স্টিকার প্রিন্টার</h4>
                  <p className="text-[10px] text-slate-400">থার্মাল প্রিন্টারে স্টিকার প্রিন্ট করে পণ্যে লাগান</p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={labelSearch}
                  onChange={e => setLabelSearch(e.target.value)}
                  placeholder="পণ্য বা মডেল দিয়ে খুঁজুন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {labelFilteredItems.map((item, idx) => (
                  <div
                    key={`lbl_${item._fbKey || item.id || 'item'}_${idx}`}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{item.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono">
                        SKU: <span className="text-cyan-400">{item.sku || item.id}</span> · দাম: ৳{item.sellingPrice}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintLabel(item)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>প্রিন্ট</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
