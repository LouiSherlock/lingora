import { NextResponse } from "next/server";
import { validateUIMessages } from "ai";
import { toErrorBody } from "@/lib/ai/errors";
import { parseTutorRequest, streamTutorReply } from "@/lib/ai/explain";
import { readModel } from "@/lib/ai/settings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseTutorRequest(body);
    const messages = await validateUIMessages({ messages: input.messages });
    const model = readModel((body as { ai?: unknown }).ai);
    const result = await streamTutorReply({ ...input, messages, model, signal: request.signal });
    return result.toUIMessageStreamResponse({ onError: (error) => toErrorBody(error).body.error });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
