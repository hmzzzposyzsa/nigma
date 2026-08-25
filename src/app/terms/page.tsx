import Link from "next/link";
import { FileText } from "lucide-react";
import { Container, Badge } from "@/components/ui";
import { SocialLinks } from "@/components/SocialLinks";

export const metadata = { title: "Syarat & Ketentuan" };

const SECTIONS = [
  {
    h: "1. Penerimaan Ketentuan",
    p: "Dengan mengakses dan menggunakan layanan NexusTop, Anda setuju untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.",
  },
  {
    h: "2. Layanan Top-Up",
    p: "NexusTop menyediakan layanan isi ulang (top-up) produk digital untuk berbagai gim dan layanan. Kami berperan sebagai agen distribusi dan memproses pesanan secara otomatis melalui mitra penyedia (ApiGames, SekaliPay) yang terintegrasi.",
  },
  {
    h: "3. Tanggung Jawab Pengguna",
    p: "Anda bertanggung jawab atas keakuratan ID Game, Server, dan nomor tujuan yang dimasukkan. Pesanan yang dikirim ke ID salah karena kesalahan input tidak dapat dikembalikan. Selalu periksa kembali sebelum membayar.",
  },
  {
    h: "4. Pembayaran",
    p: "Pembayaran diproses melalui Midtrans dengan beragam metode (QRIS, e-wallet, Virtual Account, gerai retail, dan saldo dompet). Status pembayaran diverifikasi melalui webhook dan pengecekan manual sebagai cadangan.",
  },
  {
    h: "5. Deposit Saldo",
    p: "Saldo yang Anda simpan di dompet NexusTop dapat digunakan untuk transaksi top-up. Saldo tidak dapat dicairkan kembali ke rekening pribadi dan tidak menghasilkan bunga.",
  },
  {
    h: "6. Keanggotaan & Tier",
    p: "Tier member (Pemula, Langganan, Sultan) dievaluasi setiap bulan berdasarkan total belanja berhasil. Margin harga yang lebih rendah pada tier tinggi adalah bentuk apresiasi loyalitas. Tier dapat naik, dipertahankan, atau turun satu tingkat tiap siklus bulanan.",
  },
  {
    h: "7. Kredit & Event",
    p: "Spin Credit diberikan dari transaksi sukses dan dapat digunakan pada Event Roulette dan Hadiah eksklusif. Hadiah event bersifat hiburan/retensi dengan nilai yang sudah disesuaikan. Penyalahgunaan sistem dapat menyebabkan pembekuan akun.",
  },
  {
    h: "8. Pengembalian & Komplain",
    p: "Pengembalian dana hanya berlaku jika pesanan gagal diproses oleh sistem dan dana belum dikirim ke penyedia. Komplain dapat diajukan via WhatsApp/email support maksimal 7 hari setelah transaksi dengan melampirkan nomor invoice.",
  },
  {
    h: "9. Perubahan Layanan",
    p: "NexusTop berhak mengubah harga, ketersediaan produk, dan ketentuan sewaktu-waktu. Perubahan signifikan akan diumumkan melalui kanal resmi kami.",
  },
];

export default function TermsPage() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <Badge tone="primary">
          <FileText size={13} /> Legal
        </Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Syarat & Ketentuan</h1>
        <p className="mt-2 text-muted-foreground">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}.</p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold">{s.h}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-bold">Butuh bantuan terkait ketentuan?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Hubungi tim NexusTop atau ajukan pertanyaan langsung ke Nexus Assist (chatbot).</p>
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
