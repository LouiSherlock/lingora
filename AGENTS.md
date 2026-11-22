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

**What this is.** AI-generated English practice (grammar + vocabulary) with a Chinese UI. Next.js 16.4.6 App Router, React 19.3, TypeScript, Zustand, Astryx. Single package with pnpm 11.0.9; `pnpm-workspace.yaml` only lists build approvals, it is not a workspace. No database, CI, or formatter; auth uses a configured six-digit code and one-hour JWT.

### Commands

- `pnpm dev` — Turbopack dev server on :3000.
- `pnpm lint` — ESLint 9 flat config, no auto-fix. One file: `pnpm exec eslint src/app/page.tsx`.
- `pnpm exec tsc --noEmit` — typecheck; there is no npm script.
- `pnpm test` — Vitest (4 files under `tests/`; `vitest.config.mts` maps `@/*` to `src/*`). One file: `pnpm exec vitest run tests/lib/practice-grade.test.ts`.
- `pnpm theme:build` — rebuild the theme outputs from `src/lingora-themes.ts`; `--check` verifies freshness.
- `pnpm exec astryx doctor --built src` — design-system/theme check; currently 0 fails, advisory warnings only.
- `pnpm build` — stop `pnpm dev` first. Both use `.next`; concurrent runs have crashed with `read_task_output: task TaskId ... no longer exists`.

### AI request path

- Credentials are server-only: `.env` provides `PROVIDER_API_KEY`; `.env*` is gitignored. Never log, commit, or send the key to the browser. The base URL is fixed to `https://opencode.ai/inference/openai/v1` in `src/lib/ai/settings.ts`.
- Protected API requests use `Authorization: Bearer <JWT>` through `src/lib/auth-client.ts`; `src/proxy.ts` guards APIs, client-side `AuthGuard` redirects unauthenticated non-home pages, and AI API route handlers repeat JWT verification as defense in depth. Configure `AUTH_SECRET` (at least 32 characters) and one or more six-digit `AUTH_CODE`s in `.env.local` (comma-separated with English commas, e.g. `AUTH_CODE=456789,345623`; any of them logs in); do not commit real values. Tokens are stored only in localStorage; do not add an auth cookie.
- `opencode` is a singleton `createOpenAICompatible` client created at module load, so it reads `PROVIDER_API_KEY` at server start. Restart after changing `.env`. `readModel()` validates the browser's `{ model }`; routes never accept `baseUrl` or `apiKey`.
- The `/settings` route only redirects home. The actual settings UI is `src/components/SettingsSheet.tsx` in the home header; it selects a model only. Zustand settings are `{ model, models }`; `src/lib/client-ai.ts` keeps legacy-key cleanup and `getClientAISettings()`.
- `POST /api/generate` is non-streaming JSON (`generateText` + `responseFormat`). `POST /api/explain` streams UI messages (`streamText` + `toUIMessageStreamResponse`); `TutorSheet` consumes it with `@ai-sdk/react` `useChat` + `DefaultChatTransport`.
- There is no server conversation/session id; `src/lib/ai/session.ts` was removed. Tutor history is persisted client-side in the Zustand store (`tutorMessages`, capped at the last 40) and restored into `useChat` when `TutorSheet` mounts.
- The tutor sheet's open state is `?tutor=open` on the session URL, written with `history.replaceState` (not `router.replace`) so refresh reopens the sheet without a route transition or interrupting the stream.
- `/api/models` is a raw `fetch` because the SDK has no model-listing API; on failure it retries `https://opencode.ai/inference/v1/models`.
- Provider failures map to Chinese `AiError` messages in `errors.ts` / `client.ts`; keep user-facing errors Chinese.
- Wrong-question regeneration sends up to 12,000 characters of context (`custom`).
- Changing `Question`/`Practice` in `src/lib/practice-data.ts` means updating `src/lib/ai/practice/normalize.ts`, `src/lib/practice-grade.ts`, and rendering in `practice/session/[id]` and `practice/result/[id]`.

### Deterministic rules

- Grading lives only in `src/lib/practice-grade.ts` (`normalizeAnswer`, `isAnswerCorrect`, `answerLabel`). Do not compare answers in pages. `/api/grade` does not exist.
- The Zustand store key is `englishflow-state`; renaming it loses users' history. `discardLegacyCredential()` clears the old `englishflow-api-key`, `englishflow-encrypted-api-key`, and `englishflow-credentials` IndexedDB database.
- `docs/功能.md` is the original product spec, not the implementation; it still names Tailwind, shadcn, IndexedDB, `/grammar`, `/mistakes`, `/analytics`, and `/api/grade`, which do not exist.

### Next.js 16 specifics

- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `reactCompiler`. Read `node_modules/next/dist/docs/01-app/` before changing routing or caching.
- `params` and `searchParams` are Promises. `practice/create/page.tsx` keeps `export const instant = false` because it reads `searchParams`.
- `LayoutProps<"/">` in `src/app/layout.tsx` is a Next-generated global type, not an import.
- Interactive pages are client components; `src/app/page.tsx` and the `practice/create` wrapper are server components (home and create delegate to client components). Pages that read the persisted store gate on `persist.hasHydrated()` (see the `useSyncExternalStore` pattern in the session page) to avoid hydration mismatches.

### UI, styling, theme

- Use Astryx components first, then Tailwind v4 utilities. `tailwindcss` + `@tailwindcss/postcss` are installed and wired through `postcss.config.mjs`; `src/app/globals.css` declares `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;` above every `@import` and loads `@astryxdesign/core/tailwind-theme.css`, so `text-primary`, `bg-surface`, `p-4`, `rounded-lg` resolve to theme tokens. Preflight is intentionally not imported (Astryx's reset wins). Keep app CSS in `@layer base` / `@layer components`; unlayered rules, and StyleX's runtime-injected atomic classes, outrank every Tailwind utility. The app is dark-only (`data-theme="dark"`, `<Theme mode="dark">`).
- App-specific CSS lives in `globals.css` (`page-container*`, `site-header`, grids, `tutor-sheet*`, scrollbars, bottom-sheet width). Add classes there rather than new CSS files.
- Theme source is `src/lingora-themes.ts` (`export default defineTheme(...)`, extends butter). Put app-only variables under `localTokens` (e.g. `--layout-page-width`) and component overrides under `components` (e.g. banner error color). Run `pnpm theme:build`; verify freshness with the same build plus `--check`. `src/themes/lingora/{css,js,d.ts}` is generated and must not be hand-edited. The experimental theme editor is not wired here (no CLI-managed theme folder), so edit the source and build. ESLint ignores the theme directories.
- **StyleX unlayered-injection pitfalls (hit repeatedly in this repo):** `.babelrc.js` sets `runtimeInjection: true`, so app `stylex.create` atomic classes are injected as **unlayered** `<style>` and persist across soft navigations. Unlayered rules beat every `@layer` (including `astryx-base` / `astryx-theme`) regardless of specificity, and they are not removed on navigation. Consequences:
  - **Same value = same hash.** An app style using a value identical to Astryx's produces the *same* hashed class (e.g. `background-color: transparent` → `.xjbqb8w`, `color: var(--color-text-primary)` → `.x1tgijvj0`). The app's unlayered copy then globally overrides Astryx's layered `:hover` or themed value — this is why `List`/`Item` had no hover and `Button variant="secondary"` text was off-white instead of gold. Rule: don't redeclare a value Astryx already uses; prefer inheriting it (e.g. a root need not set `color: var(--color-text-primary)` — `body` already does). If you must set it, use a different equivalent notation (`rgba(0, 0, 0, 0)` instead of `transparent`).
  - **Pages poison each other.** A class injected by one page stays active on later pages (the `<style>` is global and never unmounted), so a bug may appear only after visiting another route ("直接进入正常，先回首页再进就坏"). When fixing, grep the whole `src/`, not just the current page.
  - **Never restyle an Astryx layout primitive's `display` via `className` + `@layer components`.** `<HStack className="result-stats">` + `.result-stats { display: grid }` fails on soft navigation (CSS chunk / layer order differs; it only works after a refresh). Use the matching component instead — the result stat cards now use `<Grid columns={3} gap={3}>`.
  - **Diagnose** by reading `getComputedStyle` and walking `document.styleSheets` for every rule matching the element's property, looking for an `(UNLAYERED)` / `<inline>` rule that beats a layered Astryx one; also compare computed styles with and without the `style[data-stylex]` sheet.
- UI copy is Chinese; English is only for generated question stems/options. Explanations and error messages stay Simplified Chinese.

