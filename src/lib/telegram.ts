import { getSecret } from "./secrets";
import { formatRupiah } from "./format";

/**
 * Telegram bot notifications. Sends logs to a Telegram chat/channel for every
 * important event: orders, deposits, deliveries, failures, registrations.
 * Configure via the `settings` table (secret_telegram_bot_token + chat_id).
 * If not configured, notifications are silently skipped (no errors).
 */

async function sendTelegram(text: string): Promise<boolean> {
  const [token, chatId] = await Promise.all([getSecret("TELEGRAM_BOT_TOKEN"), getSecret("TELEGRAM_CHAT_ID")]);
  if (!token || !chatId) return false; // not configured — skip silently
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const emoji = {
  order: "🛒",
  pay: "💳",
  deliver: "📦",
  fail: "❌",
  deposit: "💰",
  user: "👤",
  manual: "✋",
  warn: "⚠️",
};

export async function notifyOrderCreated(opts: {
  invoiceNo: string;
  itemName: string;
  gameName: string;
  amount: number;
  gameUserId: string;
  paymentMethod: string;
  deliveryMethod: string;
}) {
  await sendTelegram(
    `${emoji.order} <b>Order Baru</b>\n` +
      `Invoice: <code>${opts.invoiceNo}</code>\n` +
      `Item: ${opts.itemName} (${opts.gameName})\n` +
      `ID: <code>${opts.gameUserId}</code>\n` +
      `Harga: ${formatRupiah(opts.amount)}\n` +
      `Metode: ${opts.paymentMethod}\n` +
      `Pengiriman: ${opts.deliveryMethod === "manual" ? "🟡 Manual" : "🟢 Provider"}`
  );
}

export async function notifyOrderDelivered(opts: {
  invoiceNo: string;
  itemName: string;
  amount: number;
}) {
  await sendTelegram(
    `${emoji.deliver} <b>Pesanan Berhasil</b>\n` +
      `Invoice: <code>${opts.invoiceNo}</code>\n` +
      `Item: ${opts.itemName}\n` +
      `Nilai: ${formatRupiah(opts.amount)} ✅`
  );
}

export async function notifyOrderFailed(opts: {
  invoiceNo: string;
  reason: string;
}) {
  await sendTelegram(
    `${emoji.fail} <b>Pesanan Gagal</b>\n` +
      `Invoice: <code>${opts.invoiceNo}</code>\n` +
      `Alasan: ${opts.reason}`
  );
}

export async function notifyManualDeliveryNeeded(opts: {
  invoiceNo: string;
  itemName: string;
  gameName: string;
  gameUserId: string;
  serverId?: string;
}) {
  await sendTelegram(
    `${emoji.manual} <b>Perlu Pengiriman Manual!</b>\n` +
      `Invoice: <code>${opts.invoiceNo}</code>\n` +
      `Item: ${opts.itemName} (${opts.gameName})\n` +
      `ID Game: <code>${opts.gameUserId}</code>${opts.serverId ? ` / Server: <code>${opts.serverId}</code>` : ""}\n` +
      `Kirim item secara manual ke pelanggan, lalu tandai delivered di admin panel.`
  );
}

export async function notifyDepositSuccess(opts: {
  invoiceNo: string;
  amount: number;
  userName: string;
}) {
  await sendTelegram(
    `${emoji.deposit} <b>Deposit Berhasil</b>\n` +
      `Invoice: <code>${opts.invoiceNo}</code>\n` +
      `User: ${opts.userName}\n` +
      `Jumlah: ${formatRupiah(opts.amount)} ✅`
  );
}

export async function notifyNewUser(opts: { name: string; email: string | null; phone: string | null }) {
  await sendTelegram(
    `${emoji.user} <b>Pengguna Baru</b>\n` +
      `Nama: ${opts.name}\n` +
      `Kontak: ${opts.email ?? opts.phone ?? "-"}`
  );
}
