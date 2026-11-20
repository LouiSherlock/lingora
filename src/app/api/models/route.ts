import { toErrorBody } from '@/lib/ai/errors';
import { NextResponse } from 'next/server';

export async function POST() {
  try {

    return NextResponse.json({
      models: [
        'deepseek-v4.1-flash',
        'gpt-6-luna',
        'qwen3.7-plus',
        'qwen3.8-flash',
        'deepseek-v4-pro',
        'hy4',
        'glm-5.3-flash',
        'kimi-k3',
        'kimi-k3.1-pro',
        'qwen3.8-max',
        'grok-4.7',
        'step-5-preview',
        'qwen4-max',
        'gemini-4-argon',
        'glm-5.2',
        'kimi-k2.7-code',
        'hy4-preview',
        'gpt-5.6-luna',
        'minimax-m3',
        'mimo-v2.6-pro',
        'claude-haiku-5-5',
        'minimax-m3.1-flash',
        'hy3',
        'glm-5.3',
        'longcat-2.0',
        'mimo-v2.6-flash',
        'muse-spark-1.2-contributor',
        'muse-spark-1.3-contributor',
        'beam-free',
        'hy4-flash-free',
        'iceman-contributor-free',
        'longcat-2.5-free'
      ]
    });
  } catch (error) {
    const { status, body } = toErrorBody(error);
    return NextResponse.json(body, { status });
  }
}
