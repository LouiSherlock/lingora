import { NextResponse } from "next/server";
import { toErrorBody } from "@/lib/ai/errors";
import { generatePractice, parseGenerateFields } from "@/lib/ai/practice/generate";
import { readModel } from "@/lib/ai/settings";
import { authorizeApiRequest } from "@/lib/api-auth";

export async function POST(request: Request) {
  const authResponse = await authorizeApiRequest(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const fields = parseGenerateFields(body);
    const model = readModel((body as { ai?: unknown }).ai);
    const practice = await generatePractice({
      ...fields,
      model,
      signal: request.signal,
    });
    return NextResponse.json({ practice });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
