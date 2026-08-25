"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "./ui";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Halo! Saya Nexus Assist, asisten layanan pelanggan NexusTop. Saya siap membantu soal top-up, status pesanan, pembayaran, dan produk. Ada yang bisa saya bantu?",
};

const QUICK = ["Cara top-up", "Cek status pesanan", "Metode pembayaran", "Event & Hadiah"];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history = [...messages, { role: "user", content } as Msg];
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Maaf, koneksi terputus. Silakan coba lagi beberapa saat." },
      ]);
    } finally {
      setBusy(false);
      if (!open) setUnread(true);
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen((v) => !v);
          setUnread(false);
        }}
        aria-label="Buka chat Nexus Assist"
        className="pulse-ring fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/40 transition hover:brightness-110"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
        {unread && !open && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-danger" />
        )}
      </button>

      {open && (
        <div className="animate-float-up fixed bottom-24 right-5 z-50 flex h-[32rem] max-h-[75vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <Logo mark className="text-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Nexus Assist</p>
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-success" /> Layanan Pelanggan • Online
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1.5 hover:bg-white/15" aria-label="Tutup">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-card text-card-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-lg rounded-bl-md border border-border bg-card px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan Anda..."
              className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
              aria-label="Kirim"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
