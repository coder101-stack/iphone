import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type CallSignals = {
  brand: string; model: string; colorway: string; score: number;
  movement: number; status: string; rocks: number; communityPosts: number; reason: string;
};

export async function analyzeCall(s: CallSignals) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false as const, message: "AI analysis isn't configured yet." };
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system:
        "You are AREM's trend analyst for sneaker culture. Judge cultural momentum only, never resale price, wealth or hype money. " +
        "Reply in plain text, under 170 words, exactly this format:\nSUPPORTS\n- point\n- point\n- point\nWEAKENS\n- point\n- point\n- point\nVERDICT\nOne sentence. No markdown symbols other than '- '.",
      prompt:
        `Sneaker: ${s.brand} ${s.model} (${s.colorway})\nTrend Score: ${s.score}/100, moved +${s.movement} recently\nStatus: ${s.status}\nRock It count: ${s.rocks}\nCommunity posts featuring it: ${s.communityPosts}\n` +
        `Member's reason for calling it: "${s.reason}"\nExplain which factors could support or weaken this call that it will rise further.`,
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
      },
    });
    const text = (await result.text).trim();
    if (!text) return { ok: false as const, message: "The analysis came back empty. Please try again later." };
    return { ok: true as const, text };
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    const message =
      status === 429 ? "Too many requests right now. Please wait a moment and try again." :
      status === 402 ? "AI credits have run out. Add credits in Settings → Plans & credits." :
      status === 403 ? "AI analysis is not available for this workspace right now." :
      "The analysis couldn't be completed. Please try again later.";
    return { ok: false as const, message };
  }
}
