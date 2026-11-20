<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- ASTRYX:START -->
Astryx v0.7.16 · 174 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:
1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx template <Block>` for parts it lacks; `astryx component <Name>` to read props before using one.
Changing an existing page? Keep it: skip step 2 and add blocks/components inside its sections.
Before you deliver a build, run `astryx doctor --built <dir>`; don't deliver it if it fails.

RULES:
- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then Tailwind utilities backed by tokens. No raw hex/px.
- THEMES: palettes and custom colors go through the theme, never :root overrides. To make or change a theme (colors, fonts, corners, spacing, a look from a picture), prefer the experimental theme editor over hand-written theme files: `astryx experimental theme editor new <name> --like neutral`, then `editor set <name> <thing> <value>` or `editor how "<what you want>"`; wire it with `astryx theme add <name>`; after each change look at it with `astryx experimental theme editor show <name> --png` and open the PNGs it writes (changes nothing in the app); a theme change is not done until you have looked at the pictures. In code, extend an imported theme to customize it; `theme eject <slug>` only forks source. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any style={{…}}, raw <div>/<span>, imported .css/@apply, or hardcoded/arbitrary value (bg-[#fff], p-[13px]) with the component or a token-backed utility.

`astryx help` lists every command. Key ones beyond the workflow:
  search "<query>"   find any component / hook / doc / template
  discover <words>   integrations you could add
  docs <topic>       getting-started, principles, tokens, theme … (`astryx docs` lists all)
  docs cli           commands and API reference
  docs authoring     build an integration package, and every field it holds
  upgrade --from <old version> --apply   run after a dependency bump
<!-- ASTRYX:END -->

## Lingora repo notes

**What this is.** AI-generated English practice (grammar + vocabulary) with a Chinese UI. Next.js 16.4 App Router, React 19.3, TypeScript, Zustand, Astryx design system. Single package managed with pnpm 11.0.9 — `pnpm-workspace.yaml` only lists `allowBuilds`, it is not a workspace. No database, auth, or tests.

### Commands

- `pnpm dev` — Turbopack dev server on :3000.
- `pnpm lint` — ESLint 9 flat config, no auto-fix. Single file: `pnpm exec eslint src/app/page.tsx`.
- `pnpm exec tsc --noEmit` — typecheck (there is no npm script).
- `pnpm build` — stop `pnpm dev` first. Both share `.next`; with dev running, `next build` panicked twice with `read_task_output: task TaskId ... no longer exists`.
- `pnpm exec astryx doctor --built src` — design-system/theme check; currently 0 fails, advisory warnings only.
- There is no test runner, CI, or formatter. Don't invent `pnpm test`; verify with typecheck, lint, and the affected flow in the browser.

### Architecture you can't infer from filenames

- AI is configured on the server. `.env` supplies `PROVIDER_API_KEY` and `src/lib/ai/settings.ts` fixes the endpoint to `https://opencode.ai/inference/openai/v1`. `/settings` only selects `model`, which is persisted in the Zustand store; requests carry `{ model }` and never the key. The key stays server-side and must never be logged or sent to the browser.
- Provider calls go through the AI SDK (`ai` v7) with `@ai-sdk/openai-compatible`: `src/lib/ai/client.ts` builds a per-request `createOpenAICompatible` client and calls `generateText`; `{baseURL}/models` stays a raw `fetch` because the SDK has no model-listing API. JSON mode and `conversation_id` are injected with the provider's `transformRequestBody` (v7 rejects system messages inside `messages` by default, so the system prompt is passed as `system`), and errors are re-mapped from `APICallError`/`RetryError` in `src/lib/ai/client.ts`. The endpoint is a constant, so local Ollama/LM Studio endpoints still cannot be used.
- `POST /api/generate` normalizes model output in `normalizeQuestion` and enforces all three question types when `count >= 3`. Changing the `Question` shape in `src/lib/practice-data.ts` means updating that normalizer plus rendering in `practice/session/[id]` and `practice/result/[id]`.
- Grading is client-side: `answer.trim().toLowerCase() === question.answer.trim().toLowerCase()`. The comparison is duplicated in the session and result pages; update both. `/api/grade` does not exist.
- `docs/功能.md` is the original product spec, not the implementation. It still describes Tailwind, shadcn, Zod, IndexedDB practice history, `/mistakes`, `/analytics`, and `/api/grade`; none are implemented. `src/app/mistakes/` and `src/app/analytics/` are empty placeholders.
- Persisted names retain the old product name: the Zustand store key is `englishflow-state`. `discardLegacyCredential()` clears the browser keys earlier builds used (`englishflow-api-key`, `englishflow-encrypted-api-key`) and the `englishflow-credentials` IndexedDB database on load. Renaming the store key silently loses users' history.
- Grammar content is static in `src/lib/practice-data.ts`; `/grammar/[slug]` prebuilds via `generateStaticParams`, so new topics appear by adding them there.

### Next.js 16 specifics

- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `reactCompiler`. Read `node_modules/next/dist/docs/01-app/` before touching routing or caching; this version differs from older App Router defaults.
- `params` and `searchParams` are Promises; await them. `practice/create/page.tsx` opts out of instant-navigation checks with `export const instant = false` because it reads `searchParams`; keep it unless the route is restructured.
- `LayoutProps<"/">` in `src/app/layout.tsx` is a Next-generated global type, not an import.
- Every page is a client component except the `practice/create` server wrapper and `grammar/[slug]`. Pages that read the persisted store wait for `persist.hasHydrated()`; keep that gate to avoid hydration mismatches.

### UI, styling, and theme

- Use Astryx imports (`@astryxdesign/core/VStack`, `.../Card`, …) rather than plain HTML layout. Existing exceptions: `motion.div` for animation and semantic `section`/`header`/`main`.
- The Astryx instructions above mention Tailwind utilities, but **Tailwind is not installed**. Use component props (`gap`, `padding`, `variant`), the classes in `src/app/globals.css` (`page-container`, `page-container--compact|regular|spacious`, `site-header`, `recommendation-grid`, `grammar-grid`, `centered-content`, `result-summary`), and `var(--color-*)`/spacing tokens.
- The app is dark-only: `layout.tsx` sets `data-theme="dark"` and `<Theme mode="dark">`. `globals.css` hardcodes `#261a13`, duplicating the theme's `--color-background-surface`; prefer the token when editing.
- Theme source is `themes/lingora/` (`lingora.settings.json` and custom overrides in `lingora.theme.ts`). `themes/lingora/lingora.{css,js,settings.ts}`, `src/themes/lingora/*`, and `src/astryx-themes.ts` are generated — do not hand-edit. Change palette/tokens with `pnpm exec astryx experimental theme editor ...`, then re-run `astryx doctor --built src`; ESLint ignores both theme directories.
- UI copy is Chinese; English is only for generated question stems/options. Explanations and error messages stay Simplified Chinese.

让你做什么就做什么，不要擅自做任务，不要猜测需求，不懂就问