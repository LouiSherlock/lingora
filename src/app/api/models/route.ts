import { NextResponse } from "next/server";
import { listModels } from "@/lib/ai/client";
import { toErrorBody } from "@/lib/ai/errors";
import { readProvider } from "@/lib/ai/settings";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { baseUrl?: unknown; apiKey?: unknown };
    const provider = readProvider({ baseUrl: body.baseUrl, apiKey: body.apiKey }, { requireModel: false });
    let models: string[];
    try {
      models = await listModels(provider);
    } catch (error) {
      // opencode.ai exposes the same catalogue under a shorter prefix.
      if (provider.origin.hostname !== "opencode.ai") throw error;
      models = await listModels({ ...provider, prefix: "/inference/v1" });
    }
    return NextResponse.json({ models });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
