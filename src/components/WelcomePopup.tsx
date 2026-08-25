"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Gift } from "lucide-react";
import type { WelcomePopup as WelcomePopupConfig } from "@/lib/site";

/**
 * First-visit welcome / promo popup.
 *
 * Shows an image-based promotional modal to new visitors. The "Jangan tampilkan
 * lagi hari ini" checkbox hides it ONLY for the rest of today — it automatically
 * returns the next day. Unchecked dismisses it just for the current session.
 *
 * Content is fully DB-controlled via `site.welcomePopup`.
 */
const TODAY_KEY = "nx_welcome_dismissed_date";
const SESSION_KEY = "nx_welcome_session";

function todayStr() {
  // Local date as YYYY-MM-DD.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WelcomePopup({ config }: { config: WelcomePopupConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    if (!config.enabled) return;
    try {
      if (localStorage.getItem(TODAY_KEY) === todayStr()) return; // already hidden today
      if (sessionStorage.getItem(SESSION_KEY)) return; // dismissed this session
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [config.enabled]);

  function close() {
    setOpen(false);
    try {
      if (hideToday) {
        localStorage.setItem(TODAY_KEY, todayStr()); // hidden until tomorrow
      } else {
        sessionStorage.setItem(SESSION_KEY, "1"); // just this session
      }
    } catch {}
  }

  function cta() {
    close();
    if (config.ctaLink) router.push(config.ctaLink);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-float-up" onClick={close} />
      <div className="animate-float-up relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-md">
        <button
          onClick={close}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Image-based visual */}
        <div className="relative h-44 overflow-hidden">
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-black">
            <Gift size={13} /> Promo Spesial
          </span>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold sm:text-2xl">{config.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{config.subtitle}</p>

          <button
            onClick={cta}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-[0.99]"
          >
            {config.ctaText}
          </button>

          {/* "Don't show again today" checkbox — resets tomorrow automatically */}
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => setHideToday(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span>Jangan tampilkan lagi hari ini</span>
          </label>

        </div>
      </div>
    </div>
  );
}
