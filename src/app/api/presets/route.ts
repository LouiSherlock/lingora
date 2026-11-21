import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/api-auth';
import presets from '@/data/preset.json';

/** 返回知识点 / 主题预设数据（服务端读取 preset.json，避免打进客户端包）。 */
export async function GET(request: Request) {
  const authResponse = await authorizeApiRequest(request);
  if (authResponse) return authResponse;

  return NextResponse.json(presets);
}
