import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY manquante" });
  }

  const groq = new Groq({ apiKey });

  const results: Record<string, unknown> = {
    apiKeyPrefix: apiKey.slice(0, 8) + "...",
  };

  for (const model of ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama3-8b-8192"]) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: 'Réponds uniquement: {"ok": true}' }],
        max_tokens: 20,
        response_format: { type: "json_object" },
      });
      results[model] = `✅ OK — ${completion.choices[0]?.message?.content}`;
    } catch (err) {
      results[model] = `❌ ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json(results);
}
