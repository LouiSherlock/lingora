/**
 * `AUTH_CODE` 允许配置多个登录码，只用英文逗号分隔，
 * 例如 `AUTH_CODE=456789,345623,789034,125256`。
 *
 * 只保留合法的六位数字码；没有合法码时调用方应视为未配置。
 */
export function parseAuthCodes(raw: string | undefined): string[] {
  const codes = (raw ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => /^\d{6}$/.test(code));
  return [...new Set(codes)];
}
