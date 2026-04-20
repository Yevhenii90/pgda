import { NextResponse } from "next/server";
import { buildAnalysisPrompt } from "@/lib/prompt";
import {
  type AnalyzeRequest,
  isAnalysisMode,
  isAnalysisResult,
} from "@/lib/types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function extractJsonObject(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(content.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function validateRequest(body: unknown): AnalyzeRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;

  if (
    typeof candidate.decision !== "string" ||
    typeof candidate.context !== "string" ||
    !isAnalysisMode(candidate.mode)
  ) {
    return null;
  }

  const decision = candidate.decision.trim();
  const context = candidate.context.trim();

  if (!decision) {
    return null;
  }

  return {
    decision,
    context,
    mode: candidate.mode,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY on the server." },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = validateRequest(body);

  if (!input) {
    return NextResponse.json(
      { error: "Provide a decision, context, and valid analysis mode." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You return only valid JSON for structured decision analysis. Never include markdown.",
          },
          {
            role: "user",
            content: buildAnalysisPrompt(input),
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "The analysis service returned an error." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "The analysis service returned an empty response." },
        { status: 502 },
      );
    }

    const parsed = extractJsonObject(content);

    if (!isAnalysisResult(parsed)) {
      return NextResponse.json(
        { error: "The analysis response was malformed. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ result: parsed });
  } catch {
    return NextResponse.json(
      { error: "Unable to analyze this decision right now." },
      { status: 500 },
    );
  }
}
