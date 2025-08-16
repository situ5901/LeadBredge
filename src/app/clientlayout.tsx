"use client";
import { useEffect, useState } from "react";

export default function VeryHardAntiDevtools() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Block context menu
    const onCtx = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", onCtx);

    // Block shortcut keys
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (
        key === "f12" ||
        (ctrl && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        (ctrl && key === "u")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener("keydown", onKey, true);

    // Detection Heuristics
    const sizeOpened = () =>
      window.outerWidth - window.innerWidth > 160 ||
      window.outerHeight - window.innerHeight > 160;

    let getterTripped = false;
    const bait = {
      get toString() {
        getterTripped = true;
        return () => "";
      },
    };
    const probeConsole = () => {
      try {
        console.log(bait as unknown as string);
      } catch {}
    };

    let perfOpened = false;
    const checkPerf = () => {
      const t0 = performance.now();
      while (performance.now() - t0 < 30) {}
      const drift = performance.now() - t0;
      if (drift > 80) perfOpened = true;
    };

    // Unified checker
    let triggered = false;
    const check = () => {
      if (triggered) return;
      getterTripped = false;
      probeConsole();
      checkPerf();

      if (sizeOpened() || getterTripped || perfOpened) {
        triggered = true;
        setShowWarning(true);
        setTimeout(() => {
          window.location.replace("https://www.google.com/");
        }, 1000);
      }
    };

    const timer = setInterval(check, 500);

    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey, true);
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
          <h1 className="text-white text-3xl font-bold text-center">
            ⚠️ Not allowed to open Developer Tools!
          </h1>
        </div>
      )}
    </>
  );
}
