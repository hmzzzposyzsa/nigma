import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Container, Badge } from "@/components/ui";
import { SocialLinks } from "@/components/SocialLinks";

export const metadata = { title: "Kebijakan Privasi" };

const SECTIONS = [
  {
    h: "1. Informasi yang Kami Kumpulkan",
    p: "Saat mendaftar dan bertransaksi, kami mengumpulkan nama, email/nomor HP, ID Game tujuan, riwayat transaksi, saldo, dan aktivitas tier/kredit. Kami juga menerima data pembayaran yang diproses langsung oleh Midtrans.",
  },
  {
    h: "2. Penggunaan Informasi",
    p: "Data digunakan untuk memproses pesanan, verifikasi pembayaran, mengirim item, memberi notifikasi (email/WhatsApp), menentukan tier member, serta meningkatkan layanan dan keamanan.",
  },
  {
    h: "3. Penyimpanan & Keamanan",
    p: "Data disimpan pada basis data Supabase (PostgreSQL) yang terlindungi Row Level Security. Kunci rahasia integrasi (Midtrans, ApiGames, Resend, Fonnte, OpenRouter) hanya tersimpan di sisi server dan tidak pernah dikirim ke peramban Anda.",
  },
  {
    h: "4. Pembagian Data dengan Pihak Ketiga",
    p: "Kami berbagi data yang diperlukan kepada mitra pemroses (penyedia pembayaran & produk game) semata-mosa untuk menyelesaikan transaksi Anda. Kami tidak menjual data pribadi Anda.",
  },
  {
    h: "5. Login Sosial (Google)",
    p: "Login dengan Google ditangani melalui Supabase Auth. Kami hanya menerima informasi profil dasar (nama & email) yang diizinkan oleh Anda.",
  },
  {
    h: "6. Cookie & Sesi",
    p: "Kami menggunakan cookie sesi (httpOnly) untuk menjaga status login dan preferensi (mis. mode terang/gelap). Cookie tidak digunakan untuk pelacakan iklan pihak ketiga.",
  },
  {
    h: "7. Hak Anda",
    p: "Anda berhak meminta akses, perbaikan, atau penghapusan data pribadi. Hubungi tim support untuk menggunakan hak tersebut.",
  },
];

export default function PrivacyPage() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <Badge tone="success">
          <ShieldCheck size={13} /> Legal
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Kebijakan Privasi</h1>
        <p className="mt-2 text-muted-foreground">Privasi Anda penting bagi kami. Berikut cara kami menangani data Anda.</p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold">{s.h}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-bold">Pertanyaan tentang privasi?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kami siap membantu. Hubungi melalui kanal resmi di bawah ini.</p>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ikuti & hubungi kami</p>
            <SocialLinks size="sm" />
          </div>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </Container>
  );
}
