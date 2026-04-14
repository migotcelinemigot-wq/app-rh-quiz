import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const result = await prisma.quizAnswer.deleteMany({
      where: { isCorrect: false },
    });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("Erreur reset révisions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
