import { NextResponse } from "next/server";
import { listModels } from "@/lib/ai/client";
import { toErrorBody } from "@/lib/ai/errors";
import { readModel } from "@/lib/ai/settings";

export async function POST() {
  try {
    readModel({}, { requireModel: false });
    let models: string[];
    try {
      models = await listModels();
    } catch {
      models = await listModels("/inference/v1/models");
    }
    return NextResponse.json({ models });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
