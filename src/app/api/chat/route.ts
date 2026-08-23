import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";

const SYSTEM_PROMPT =
  "Sən bu ERP sisteminin (WorkSpace) rəsmi daxili asistentisən. İstifadəçilərə CRM, Marketinq, WMS (Anbar) və sistemin digər modullarından necə istifadə edəcəklərini öyrətməlisən. Cavabların qısa, peşəkar və köməkçi olmalıdır. Tələb olunarsa Azərbaycan dilində cavab ver.";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : [];
    const lastUser = [...messages].reverse().find((m) => m.role === "user" && m.content?.trim());

    if (!lastUser) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages
      .filter((m) => m.content?.trim() && (m.role === "user" || m.role === "assistant"))
      .slice(0, -1)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastUser.content.trim());
    const text = result.response.text();

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Assistant is unavailable" }, { status: 500 });
  }
}
