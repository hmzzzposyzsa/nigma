"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button, Input, Label, Container } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Konfirmasi kata sandi tidak cocok.");
    if (!form.email && !form.phone) return setError("Isi email atau nomor HP.");
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, password: form.password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Gagal mendaftar.");
    router.push("/account");
    router.refresh();
  }

  return (
    <Container className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/">
            <Logo className="text-xl" />
          </Link>
          <h1 className="mt-5 text-2xl font-bold">Buat Akun Baru</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gratis. Mulai top-up & kumpulkan Spin Credit.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-10" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama kamu" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@kamu.com" />
                </div>
              </div>
              <div>
                <Label>Nomor HP</Label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0812xxxxxxx" />
                </div>
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">Isi email atau nomor HP (salah satu).</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Kata Sandi</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 karakter" required />
                </div>
              </div>
              <div>
                <Label>Konfirmasi Sandi</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} placeholder="Ulangi sandi" required />
                </div>
              </div>
            </div>

            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Mendaftarkan..." : "Daftar Sekarang"} <ArrowRight size={16} />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
