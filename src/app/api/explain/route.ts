import { NextResponse } from "next/server";
import { toErrorBody } from "@/lib/ai/errors";
import { askTutor, parseTutorRequest } from "@/lib/ai/explain";
import { readSessionId } from "@/lib/ai/session";
import { readProvider } from "@/lib/ai/settings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseTutorRequest(body);
    const provider = readProvider((body as { ai?: unknown }).ai);
    const result = await askTutor({
      ...input,
      conversationId: readSessionId((body as { conversationId?: unknown }).conversationId),
      provider,
      signal: request.signal,
    });
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
