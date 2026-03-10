import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const SCANNER_CONTAINER_ID = 'barcode-scanner-root';
const SCAN_DEBOUNCE_MS = 1800;

// Higher resolution video constraints help detect smaller / more distant codes.
// Also strongly prefer the back (environment) camera on mobile devices.
const HIGH_RES_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { min: 1024, ideal: 1920 },
  height: { min: 576, ideal: 1080 },
};

/** 1D barcode formats + QR so camera scanning works for product barcodes */
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function useBarcodeScanner(onScan: (code: string) => void) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const start = useCallback(async () => {
    setError(null);
    setActive(true);
    lastScannedRef.current = null;
    // Let the container become visible before starting the camera (helps on some browsers)
    await new Promise((r) => setTimeout(r, 100));
    const container = document.getElementById(SCANNER_CONTAINER_ID);
    if (!container) {
      setError('Scanner container not found.');
      setActive(false);
      return;
    }
    try {
      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID, {
        verbose: false,
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          // Limit the scan region to a square in the center so the
          // library can focus its processing on a smaller area.
          qrbox: { width: 250, height: 250 },
          // Ask for higher‑resolution frames so smaller codes are readable.
          // html5-qrcode forwards these to getUserMedia under the hood.
          videoConstraints: HIGH_RES_VIDEO_CONSTRAINTS as any,
        },
        (decodedText) => {
          const code = decodedText?.trim();
          if (!code) return;
          const now = Date.now();
          const last = lastScannedRef.current;
          if (last && last.code === code && now - last.at < SCAN_DEBOUNCE_MS) return;
          lastScannedRef.current = { code, at: now };
          onScanRef.current(code);
        },
        () => {
          // No code in this frame – don't show as error
        }
      );
    } catch (e) {
      const msg = (e as Error).message || 'Camera access failed';
      setError(
        msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')
          ? 'Camera permission denied. Allow camera access in your browser settings.'
          : msg
      );
      scannerRef.current = null;
      setActive(false);
    }
  }, [onScan]);

  const stop = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {
        // ignore
      }
      scannerRef.current = null;
    }
    setActive(false);
    setError(null);
  }, []);

  useEffect(() => () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, []);

  return {
    scannerContainerId: SCANNER_CONTAINER_ID,
    active,
    error,
    start,
    stop,
  };
}
