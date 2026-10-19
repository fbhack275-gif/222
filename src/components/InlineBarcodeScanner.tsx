import React, { useState, useEffect, useRef } from 'react';
import { ScanBarcode, Camera, X, Zap, ZapOff, Upload, RefreshCw } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface InlineBarcodeScannerProps {
  onScanned: (code: string) => void;
  onClose: () => void;
}

const SUPPORTED_FORMATS = [
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

const playScannerBeep = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Ignore audio context restriction
  }
};

export const InlineBarcodeScanner: React.FC<InlineBarcodeScannerProps> = ({
  onScanned,
  onClose,
}) => {
  const [isStarting, setIsStarting] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamIdx, setSelectedCamIdx] = useState<number>(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const qrRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScannedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = 'inline-item-barcode-scanner-box';
  const tempFileId = 'inline-item-barcode-file-temp';

  const stopScanner = async () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    // Safely pause video and stop MediaStream tracks before unmounting/clearing DOM
    try {
      const container = document.getElementById(containerId);
      if (container) {
        const videos = container.querySelectorAll('video');
        videos.forEach((v) => {
          try {
            v.pause();
            if (v.srcObject) {
              const stream = v.srcObject as MediaStream;
              stream.getTracks().forEach((track) => {
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

    if (qrRef.current) {
      const instance = qrRef.current;
      qrRef.current = null;
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
    if (isMountedRef.current) {
      setIsActive(false);
      setTorchOn(false);
      setTorchSupported(false);
    }
  };

  const handleSuccess = async (decodedText: string) => {
    const clean = decodedText.trim();
    if (!clean || hasScannedRef.current) return;
    hasScannedRef.current = true;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
    playScannerBeep();

    await stopScanner();
    onScanned(clean);
  };

  const startScanner = async (cameraDeviceId?: string) => {
    setErrorMsg(null);
    setIsStarting(true);
    hasScannedRef.current = false;
    await stopScanner();

    if (!isMountedRef.current) return;

    startTimeoutRef.current = setTimeout(async () => {
      startTimeoutRef.current = null;
      if (!isMountedRef.current) {
        setIsStarting(false);
        return;
      }
      const elem = document.getElementById(containerId);
      if (!elem) {
        setIsStarting(false);
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: SUPPORTED_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        qrRef.current = html5QrCode;

        const config = {
          fps: 18,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.max(150, Math.min(260, Math.floor(viewfinderWidth * 0.82)));
            const height = Math.max(80, Math.min(130, Math.floor(viewfinderHeight * 0.55)));
            return { width, height };
          },
          aspectRatio: 1.5,
        };

        let started = false;

        try {
          const target = cameraDeviceId
            ? { deviceId: { exact: cameraDeviceId } }
            : { facingMode: 'environment' };
          await html5QrCode.start(
            target,
            config,
            (decoded) => handleSuccess(decoded),
            () => {}
          );
          started = true;
        } catch {
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              (decoded) => handleSuccess(decoded),
              () => {}
            );
            started = true;
          } catch {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              setCameras(devices);
              const backCamIdx = devices.findIndex((d) =>
                /back|rear|environment/i.test(d.label)
              );
              const chosenIdx = backCamIdx >= 0 ? backCamIdx : devices.length - 1;
              setSelectedCamIdx(chosenIdx);
              await html5QrCode.start(
                devices[chosenIdx].id,
                config,
                (decoded) => handleSuccess(decoded),
                () => {}
              );
              started = true;
            }
          }
        }

        if (!started) {
          throw new Error('Camera failed to start');
        }

        if (!isMountedRef.current) {
          await stopScanner();
          return;
        }

        setIsActive(true);
        setIsStarting(false);

        Html5Qrcode.getCameras()
          .then((devices) => {
            if (isMountedRef.current && devices && devices.length > 0) {
              setCameras(devices);
            }
          })
          .catch(() => {});

        try {
          const track = html5QrCode.getRunningTrackCameraCapabilities();
          if (track && 'torch' in track) {
            setTorchSupported(true);
          }
        } catch {
          setTorchSupported(false);
        }
      } catch {
        if (!isMountedRef.current) return;
        setIsStarting(false);
        setIsActive(false);
        setErrorMsg(
          'লাইভ ক্যামেরা চালু করা যায়নি। নিচের "📸 ছবি তুলে স্ক্যান" বাটনে ক্লিক করে বারকোডের ছবি তুলুন।'
        );
      }
    }, 120);
  };

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const nextIdx = (selectedCamIdx + 1) % cameras.length;
    setSelectedCamIdx(nextIdx);
    startScanner(cameras[nextIdx].id);
  };

  const handleToggleTorch = async () => {
    if (!qrRef.current || !isActive) return;
    try {
      const next = !torchOn;
      await qrRef.current.applyVideoConstraints({
        advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const handleImageFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setStatusNote('🔍 ছবি থেকে বারকোড পড়া হচ্ছে...');

    try {
      if ('BarcodeDetector' in window) {
        try {
          const BarcodeDetectorClass = (
            window as unknown as {
              BarcodeDetector: new () => {
                detect: (source: ImageBitmap) => Promise<Array<{ rawValue: string }>>;
              };
            }
          ).BarcodeDetector;
          const detector = new BarcodeDetectorClass();
          const bitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(bitmap);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            setStatusNote(null);
            await handleSuccess(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fallback to Html5Qrcode.scanFile
        }
      }

      const fileScanner = new Html5Qrcode(tempFileId, {
        formatsToSupport: SUPPORTED_FORMATS,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      const decoded = await fileScanner.scanFile(file, false);
      setStatusNote(null);
      await handleSuccess(decoded);
    } catch {
      setStatusNote(null);
      setErrorMsg('এই ছবিতে বারকোড পাওয়া যায়নি। বারকোডের আরও কাছ থেকে স্পষ্ট ছবি তুলুন।');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-2.5 rounded-2xl bg-slate-950 border-2 border-cyan-500/60 overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
      {/* Scanner Top Control Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950/80 to-slate-900 border-b border-cyan-500/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1">
            <ScanBarcode className="w-3.5 h-3.5" />
            বারকোডের ওপর ক্যামেরা ধরুন (অটো কোড নিবে)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {torchSupported && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                torchOn
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="ফ্ল্যাশলাইট"
            >
              {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            </button>
          )}

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700 transition-colors"
              title="ক্যামেরা পরিবর্তন করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              await stopScanner();
              onClose();
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-300 transition-colors"
            title="স্ক্যানার বন্ধ করুন"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative bg-black min-h-[175px] flex items-center justify-center overflow-hidden">
        <div id={containerId} className="w-full" />
        <div id={tempFileId} className="hidden" />

        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 gap-2 p-4 text-center">
            <Camera className="w-6 h-6 text-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-bold">
              ক্যামেরা চালু হচ্ছে... বারকোডের সামনে ধরুন
            </span>
          </div>
        )}

        {isActive && !isStarting && (
          <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-pulse" />
        )}
      </div>

      {/* Status or Error Banner + Photo Scan Fallback */}
      <div className="px-3 py-2 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] text-slate-400 flex-1 min-w-[140px]">
          {statusNote ? (
            <span className="text-cyan-300 font-bold">{statusNote}</span>
          ) : errorMsg ? (
            <span className="text-amber-300 font-semibold">{errorMsg}</span>
          ) : (
            <span>কোড দেখা মাত্রই বক্সে অটোমেটিক বসে যাবে</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageFileScan}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1 transition-all"
          >
            <Upload className="w-3 h-3" />
            <span>📸 ছবি তুলে স্ক্যান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
