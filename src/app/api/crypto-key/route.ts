import { NextResponse } from "next/server";
import { getTransportPublicKey } from "@/lib/server-crypto";

export async function GET() {
  return NextResponse.json({ publicKey: getTransportPublicKey() }, { headers: { "Cache-Control": "no-store" } });
}
