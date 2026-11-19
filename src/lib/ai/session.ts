const LIMIT = 200;

/**
 * Conversation ids are provider-issued and opaque.
 *
 * `id` is deliberately NOT a candidate: an OpenAI-compatible response returns the
 * completion id there (`chatcmpl-…`), which identifies one answer, not a
 * conversation. Sending it back as `conversation_id` is meaningless at best.
 */
const FIELDS = ["session_id", "conversation_id", "sessionId", "conversationId"] as const;
const HEADERS = ["x-session-id", "x-conversation-id"] as const;

/** Trims a client-supplied id before it is forwarded upstream. */
export function readSessionId(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, LIMIT) : "";
}

/** Reads the conversation id a provider actually returned, or "" when it returned none. */
export function pickSessionId(payload: unknown, response?: Response): string {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  for (const field of FIELDS) {
    const value = source[field];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, LIMIT);
  }
  if (response) {
    for (const header of HEADERS) {
      const value = response.headers.get(header);
      if (value?.trim()) return value.trim().slice(0, LIMIT);
    }
  }
  return "";
}

/** Adds `conversation_id` only when there is one to continue. */
export function withConversation<T extends Record<string, unknown>>(body: T, sessionId: string): T {
  return sessionId ? { ...body, conversation_id: sessionId } : body;
}
