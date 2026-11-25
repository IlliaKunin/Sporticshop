import "server-only";
import { env } from "./env";

/** Sends a short message to the owner's Telegram. Never throws: a failed notification must not break an order. */
export async function notifyOwner(text: string) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = env();
  if (!token || !chat) { console.log("[notify]", text.replace(/\n/g, " | ")); return; }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* ignore */ }
}
