import { NextResponse } from "next/server";
import { toErrorBody } from "../../../lib/ai/errors";
import { generatePractice, parseGenerateFields } from "../../../lib/ai/practice/generate";
import { readSessionId } from "../../../lib/ai/session";
import { readProvider } from "../../../lib/ai/settings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fields = parseGenerateFields(body);
    const provider = readProvider((body as { ai?: unknown }).ai);
    const practice = await generatePractice({
      ...fields,
      conversationId: readSessionId((body as { conversationId?: unknown }).conversationId),
      provider,
      signal: request.signal,
    });
    return NextResponse.json({ practice });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
