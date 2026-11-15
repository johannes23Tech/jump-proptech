import { useEffect, useState, useRef } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);

  // Check if already dismissed via localStorage
  useEffect(() => {
    const dismissedVal = localStorage.getItem("jp_pwa_dismissed");
    if (dismissedVal === "true") setDismissed(true);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed
      if (!dismissed) {
        setShowPrompt(true);
        // Auto-hide after 10 seconds
        setTimeout(() => setShowPrompt(false), 10000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false);
      setDismissed(true);
      localStorage.setItem("jp_pwa_dismissed", "true");
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-4 sm:left-[auto] sm:right-4 sm:w-80 z-50">
      <div className="flex items-center gap-3 rounded-xl border border-[#e5dfd1] bg-white p-4 shadow-lg">
        <Download className="text-[#b79850]" size={20} strokeWidth={2} />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-[#252821]">Install Jump PropTech</div>
          <div className="mt-0.5 text-[11px] text-[#77746a]">Add to home screen for offline access</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-lg bg-[#b79850] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#9c7b4a]"
          >
            Install
          </button>
          <button
            onClick={() => { setShowPrompt(false); setDismissed(true); localStorage.setItem("jp_pwa_dismissed", "true"); }}
            className="rounded-lg p-2 text-[#99958a] hover:bg-[#f0ede6]"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}