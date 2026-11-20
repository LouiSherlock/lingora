const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function getLoginRateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.delete(key);
    return { limited: false, retryAfter: 0 };
  }

  return {
    limited: entry.count >= MAX_FAILURES,
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }

  // Keep the process-local limiter bounded if requests arrive with many IPs.
  if (attempts.size > 10_000) {
    for (const [attemptKey, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(attemptKey);
    }
  }
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
