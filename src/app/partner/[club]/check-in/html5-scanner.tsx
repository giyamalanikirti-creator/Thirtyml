"use client";

import * as React from "react";

export default function Html5QrScanner({
  onScan,
}: {
  onScan: (token: string) => void;
}) {
  const containerId = React.useId().replace(/:/g, "");
  const scannerRef = React.useRef<{ clear: () => Promise<void> } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("html5-qrcode");
      if (cancelled) return;
      try {
        const scanner = new mod.Html5QrcodeScanner(
          containerId,
          {
            fps: 10,
            qrbox: 260,
            aspectRatio: 1,
            supportedScanTypes: [mod.Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          },
          false
        );
        scanner.render(
          (text) => onScan(text),
          () => {
            // silence per-frame decode errors
          }
        );
        scannerRef.current = scanner;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't open the camera");
      }
    })();
    return () => {
      cancelled = true;
      scannerRef.current?.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  return (
    <div>
      <div id={containerId} className="min-h-[280px] bg-black" />
      {error && (
        <p className="p-3 text-sm text-danger">
          {error}. Use the code field below.
        </p>
      )}
    </div>
  );
}
