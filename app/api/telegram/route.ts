import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const APP_URL = process.env.APP_URL ?? "https://app-rh-quiz.vercel.app";

async function sendMessage(text: string) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  return res.json();
}

// GET /api/telegram?type=morning|evening|test
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "test";

  const messages: Record<string, string> = {
    morning: `☀️ <b>Bonjour Céline !</b>\n\nC'est l'heure de votre quiz RH du jour 🎯\n\nQuelques minutes suffisent pour progresser sur le <b>Code du travail</b> et la <b>CC 0086</b>.\n\n👉 <a href="${APP_URL}">Lancer mon quiz</a>`,

    evening: `🌙 <b>Rappel du soir</b>\n\nAvez-vous fait votre quiz RH aujourd'hui ? 📚\n\nIl est encore temps de maintenir votre streak !\n\n👉 <a href="${APP_URL}">Faire mon quiz</a>`,

    test: `✅ <b>Bot Quiz RH opérationnel !</b>\n\nVous recevrez :\n• ☀️ Un rappel chaque matin à 8h00\n• 🌙 Un rappel chaque soir à 19h00\n\n👉 <a href="${APP_URL}">Accéder à l'app</a>`,
  };

  const text = messages[type] ?? messages.test;

  try {
    await sendMessage(text);
    return NextResponse.json({ success: true, type });
  } catch (error) {
    console.error("Erreur Telegram:", error);
    return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });
  }
}
