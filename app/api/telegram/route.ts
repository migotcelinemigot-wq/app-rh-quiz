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
    morning: `Bonjour Celine ! C'est l'heure de votre quiz RH du jour. Quelques minutes suffisent pour progresser sur le Code du travail et la CC 0086.\n\nLancer mon quiz : ${APP_URL}`,

    evening: `Rappel du soir : avez-vous fait votre quiz RH aujourd'hui ? Il est encore temps de maintenir votre streak !\n\nFaire mon quiz : ${APP_URL}`,

    test: `Bot Quiz RH operationnel ! Vous recevrez un rappel chaque matin a 8h00 et chaque soir a 19h00.\n\nAcceder a l'app : ${APP_URL}`,
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
