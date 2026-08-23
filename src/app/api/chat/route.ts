import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "Sən bu ERP sisteminin (WorkSpace) rəsmi daxili asistentisən. İstifadəçilərə CRM, Marketinq, WMS (Anbar) və sistemin digər modullarından necə istifadə edəcəklərini öyrətməlisən. Cavabların qısa, peşəkar və köməkçi olmalıdır. Tələb olunarsa Azərbaycan dilində cavab ver.";

const DEFAULT_MODEL = "gemini-1.5-flash";
const MODEL_FALLBACKS = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.6-flash"];
const UNRELIABLE_MODELS = new Set([
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-latest",
]);

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GeminiHistoryItem = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Unknown Gemini API error";
}

function shouldRetryNextModel(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("is not supported") ||
    message.includes("unknown model") ||
    message.includes("invalid model") ||
    message.includes("503") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("unavailable")
  );
}

function toGeminiHistory(messages: ChatMessage[]): GeminiHistoryItem[] {
  const prior = messages
    .filter((m) => m.content?.trim() && (m.role === "user" || m.role === "assistant"))
    .slice(0, -1)
    .map((m) => ({
      role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
      parts: [{ text: m.content.trim() }],
    }));

  while (prior.length && prior[0].role !== "user") {
    prior.shift();
  }

  const history: GeminiHistoryItem[] = [];
  for (const item of prior) {
    const last = history[history.length - 1];
    if (last && last.role === item.role) {
      last.parts[0].text = `${last.parts[0].text}\n${item.parts[0].text}`;
    } else {
      history.push(item);
    }
  }

  return history;
}

async function generateReply(
  apiKey: string,
  modelName: string,
  history: GeminiHistoryItem[],
  userText: string
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(userText);
  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error("Empty response from Gemini");
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : [];
    const lastUser = [...messages].reverse().find((m) => m.role === "user" && m.content?.trim());

    if (!lastUser) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const envModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    const preferredModel = UNRELIABLE_MODELS.has(envModel) ? DEFAULT_MODEL : envModel;
    const candidates = [preferredModel, ...MODEL_FALLBACKS].filter(
      (name, index, list) => name && list.indexOf(name) === index
    );
    const history = toGeminiHistory(messages);
    const userText = lastUser.content.trim();

    let lastError: unknown;
    for (const modelName of candidates) {
      try {
        const text = await generateReply(apiKey, modelName, history, userText);
        return NextResponse.json({ message: text, model: modelName });
      } catch (error) {
        lastError = error;
        console.error("[GEMINI_API_ERROR]", error);
        if (!shouldRetryNextModel(error)) {
          return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ error: getErrorMessage(lastError) }, { status: 500 });
  } catch (error) {
    console.error("[GEMINI_API_ERROR]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}