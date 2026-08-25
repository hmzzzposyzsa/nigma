import Link from "next/link";
import { ShieldCheck, Clock, Headset, Wallet } from "lucide-react";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";
import type { SiteConfig } from "@/lib/site";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Container } from "./ui";

const TRUST = [
  { Icon: ShieldCheck, title: "Transaksi Aman", desc: "Pembayaran terenkripsi & terverifikasi." },
  { Icon: Clock, title: "Proses Cepat", desc: "Otomatis 24/7, sebagian besar < 1 menit." },
  { Icon: Wallet, title: "Banyak Metode", desc: "QRIS, e-wallet, VA, gerai retail, saldo." },
  { Icon: Headset, title: "Dukungan AI", desc: "Bantuan instan via chatbot." },
];

export function Footer({ site }: { site: SiteConfig }) {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <Container className="py-12">
        <div className="grid gap-8 border-b border-border pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo name={site.name} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{site.tagline}. Platform top-up game resmi, cepat, dan terpercaya untuk pengguna lokal maupun internasional.</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ikuti Kami</p>
            <SocialLinks className="mt-2" size="sm" links={site.social} />
          </div>

          <FooterCol
            title="Layanan"
            links={[
              { href: "/products", label: "Semua Game" },
              { href: "/berita", label: "Berita & Info" },
              { href: "/balance", label: "Deposit Saldo" },
              { href: "/event", label: "Event Roulette" },
              { href: "/hadiah", label: "Hadiah Eksklusif" },
            ]}
          />
          <FooterCol
            title="Akun & Bantuan"
            links={[
              { href: "/account", label: "Akun Saya" },
              { href: "/login", label: "Masuk" },
              { href: "/register", label: "Daftar" },
              { href: `https://wa.me/${site.whatsapp}`, label: "Hubungi Kami" },
            ]}
          />
          <FooterCol
            title="Informasi"
            links={[
              { href: "/terms", label: "Syarat & Ketentuan" },
              { href: "/privacy", label: "Kebijakan Privasi" },
              { href: "#", label: "Cara Top-Up" },
            ]}
          />
        </div>

        <div className="border-t border-border pt-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kontak</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Email: <a href={`mailto:${site.supportEmail}`} className="font-semibold text-foreground hover:text-primary">{site.supportEmail}</a>
            {site.phone && <> · Telp: <span className="font-semibold text-foreground">{site.phone}</span></>}
            {site.address && <> · {site.address}</>}
          </p>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metode Pembayaran</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m.id}
                className="grid h-8 w-auto min-w-[3rem] place-items-center rounded-lg border border-border bg-white px-2"
                title={m.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.icon} alt={m.label} className="h-4 max-w-[3rem] object-contain" />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. Seluruh hak cipta dilindungi.</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground transition hover:text-primary">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
