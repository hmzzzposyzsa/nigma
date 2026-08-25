"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Wallet,
  ChevronDown,
  Zap,
  Gift,
  Dice5,
} from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button, cn } from "./ui";

export type SafeUser = {
  id: string;
  name: string;
  email: string | null;
  role: string;
};

// requireAuth = true means the link only shows AFTER the user logs in.
// roles = the tier(s) allowed to see the link (Hadiah is Langganan & Sultan only).
const NAV: { href: string; label: string; requireAuth: boolean; roles?: string[] }[] = [
  { href: "/", label: "Beranda", requireAuth: false },
  { href: "/berita", label: "Berita", requireAuth: false },
  { href: "/cek-pesanan", label: "Cek Pesanan", requireAuth: false },
  { href: "/event", label: "Event", requireAuth: true },
  { href: "/hadiah", label: "Hadiah", requireAuth: true, roles: ["langganan", "sultan"] },
  { href: "/balance", label: "Deposit", requireAuth: true },
];

function navVisible(item: { requireAuth: boolean; roles?: string[] }, user: SafeUser | null): boolean {
  if (item.requireAuth && !user) return false;
  if (item.roles && (!user || !item.roles.includes(user.role))) return false;
  return true;
}

export function Header({ user, siteName = "NexusTop" }: { user: SafeUser | null; siteName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo name={siteName} />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.filter((item) => navVisible(item, user)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground",
                pathname === item.href && "bg-muted text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold transition hover:bg-muted"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[8rem] truncate sm:block">{user.name.split(" ")[0]}</span>
                <ChevronDown size={15} className="text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="animate-float-up absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email ?? "Akun"}</p>
                    <span className="mt-1.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Tier: {user.role}
                    </span>
                  </div>
                  <MenuItem href="/account" Icon={UserIcon} label="Akun Saya" />
                  <MenuItem href="/balance" Icon={Wallet} label="Deposit Saldo" />
                  <MenuItem href="/event" Icon={Dice5} label="Event Roulette" />
                  <MenuItem href="/hadiah" Icon={Gift} label="Hadiah Eksklusif" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
                  >
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Masuk
              </Button>
              <Button href="/register" size="sm">
                <Zap size={15} /> Daftar
              </Button>
            </>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-float-up border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV.filter((item) => navVisible(item, user)).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground",
                  pathname === item.href && "bg-muted text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <ThemeToggle />
              {!user && (
                <Button href="/login" size="sm" variant="outline">
                  Masuk
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuItem({ href, Icon, label }: { href: string; Icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
    >
      <Icon size={16} /> {label}
    </Link>
  );
}
