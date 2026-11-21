'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import * as stylex from '@stylexjs/stylex';
import { motion, useMotionValue, useReducedMotion, useSpring, type Variants } from 'motion/react';
import { useRouter } from 'next/navigation';
import WordField, { type WordFieldHandle } from '@/components/landing/core/WordField.tsx';
import { SettingsSheetTrigger } from '@/components/SettingsSheet';
import { getToken, requestLogin } from '@/lib/auth-client';

const GOALS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MOBILE = '@media (max-width: 720px)';
const SHORT = '@media (max-height: 560px)';
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const styles = stylex.create({
  root: {
    position: 'relative',
    boxSizing: 'border-box',
    height: stylex.firstThatWorks('100dvh', '100vh'),
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    paddingInline: 'clamp(20px, 5vw, 56px)',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    backgroundColor: 'var(--color-background-surface)',
    color: 'var(--color-text-primary)',
    fontFamily: "Noto Sans SC, Outfit, system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  glow: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    backgroundImage:
      'radial-gradient(60% 55% at 85% 90%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%), radial-gradient(50% 50% at 8% 8%, color-mix(in srgb, var(--color-accent) 7%, transparent), transparent 70%)',
  },
  header: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: { default: 76, [MOBILE]: 64 },
  },
  logo: {
    fontFamily: "Outfit, Noto Sans SC, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 26,
    letterSpacing: '-0.01em',
    color: 'var(--color-accent)',
    textDecoration: 'none',
  },
  settings: {
    appearance: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 4px',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--color-accent)',
  },
  rule: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: 'var(--color-border-emphasized)',
  },
  main: {
    position: 'relative',
    zIndex: 1,
    flexGrow: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    display: 'flex',
    flexDirection: { default: 'row', [MOBILE]: 'column' },
    alignItems: { default: 'flex-end', [MOBILE]: 'stretch' },
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 32,
  },
  copy: { maxWidth: 760 },
  label: {
    margin: '0 0 14px',
    fontWeight: 700,
    fontSize: 'clamp(14px, 1.5vw, 17px)',
  },
  title: {
    margin: 0,
    display: 'flex',
    flexWrap: 'nowrap',
    fontWeight: 900,
    fontSize: 'clamp(32px, 8vw, 100px)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
  },
  char: { display: 'inline-block', willChange: 'transform' },
  sub: {
    margin: '22px 0 0',
    fontWeight: 500,
    fontSize: 'clamp(15px, 1.7vw, 19px)',
    lineHeight: 1.6,
  },
  chips: {
    display: { default: 'flex', [SHORT]: 'none' },
    flexWrap: 'wrap',
    gap: 10,
    margin: '28px 0 0',
    padding: 0,
    listStyle: 'none',
  },
  chip: {
    appearance: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    fontSize: 14,
    padding: '8px 16px',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: { default: 'var(--color-border-emphasized)', ':hover': 'var(--color-text-secondary)' },
    color: { default: 'var(--color-text-secondary)', ':hover': 'var(--color-text-primary)' },
    backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 4%, transparent)',
    outline: { default: 'none', ':focus-visible': `2px solid ${'var(--color-accent)'}` },
    outlineOffset: 3,
    transitionProperty: 'color, border-color, background-color',
    transitionDuration: '0.2s',
  },
  chipOn: {
    borderColor: 'var(--color-accent)',
    color: 'var(--color-accent)',
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 14%, transparent)',
  },
  ctaWrap: {
    position: 'relative',
    flexShrink: 0,
    width: { default: 'auto', [MOBILE]: '100%' },
  },
  ring: {
    position: 'absolute',
    inset: 0,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'var(--color-accent)',
    opacity: 0,
    pointerEvents: 'none',
  },
  cta: {
    position: 'relative',
    appearance: 'none',
    border: 'none',
    cursor: 'pointer',
    width: { default: 'auto', [MOBILE]: '100%' },
    minWidth: 176,
    padding: '20px 34px',
    borderRadius: 14,
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: 17,
    color: 'var(--color-background-surface)',
    backgroundColor: 'var(--color-accent)',
    boxShadow: '0 10px 40px -10px color-mix(in srgb, var(--color-accent) 50%, transparent)',
    outline: { default: 'none', ':focus-visible': `2px solid ${'var(--color-accent)'}` },
    outlineOffset: 4,
  },
});

export default function Lingora({ onStart }: { onStart?: (level: string) => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const fieldRef = useRef<WordFieldHandle>(null);
  const pendingLevel = useRef<string | null>(null);
  const [selected, setSelected] = useState("A2");

  useEffect(() => {
    const continueAfterLogin = () => {
      const level = pendingLevel.current;
      if (!level) return;
      pendingLevel.current = null;
      onStart?.(level);
      router.push(`/practice/create?level=${level}`);
    };
    const cancelPendingStart = () => {
      pendingLevel.current = null;
    };

    window.addEventListener("auth:success", continueAfterLogin);
    window.addEventListener("auth:cancel", cancelPendingStart);
    return () => {
      window.removeEventListener("auth:success", continueAfterLogin);
      window.removeEventListener("auth:cancel", cancelPendingStart);
    };
  }, [onStart, router]);

  // magnetic CTA
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 350, damping: 20 });
  const y = useSpring(my, { stiffness: 350, damping: 20 });

  const selectLevel = (level: string) => setSelected(level);

  const handleMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.18);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  const handleStart = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    fieldRef.current?.burst(r.left + r.width / 2, r.top + r.height / 2);
    if (!getToken()) {
      pendingLevel.current = selected;
      requestLogin();
      return;
    }
    onStart?.(selected);
    router.push(`/practice/create?level=${selected}`);
  };

  // entrance orchestration (skipped when the user prefers reduced motion)
  const initial = reduce ? false : 'hidden';
  const fade = (delay = 0, from = {}) => ({
    initial: reduce ? false : { opacity: 0, ...from },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE_OUT },
  });

  const titleVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } },
  };
  const charVariants: Variants = {
    hidden: { opacity: 0, y: 70, rotate: 8 },
    show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
  };
  const chipsVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 1.2 } },
  };
  const chipVariants: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 18 } },
  };

  const heading = '今天想练什么？';

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.glow)} />
      <WordField ref={fieldRef} reduceMotion={!!reduce} />

      <header {...stylex.props(styles.header)}>
        <motion.a href="#" {...stylex.props(styles.logo)} {...fade(0.2)}>Lingora</motion.a>
        <SettingsSheetTrigger />
        <motion.span
          {...stylex.props(styles.rule)}
          style={{ originX: 0 }}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
      </header>

      <main {...stylex.props(styles.main)}>
        <section {...stylex.props(styles.hero)}>
          <div {...stylex.props(styles.copy)}>
            <motion.p {...stylex.props(styles.label)} {...fade(0.35, { x: -14 })}>
              专属英语练习空间
            </motion.p>

            <motion.h1
              aria-label={heading}
              variants={titleVariants}
              initial={initial}
              animate="show"
              {...stylex.props(styles.title)}
            >
              {Array.from(heading).map((c, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  variants={charVariants}
                  whileHover={reduce ? undefined : {
                    y: -16,
                    transition: { type: 'spring', stiffness: 300, damping: 12 },
                  }}
                  {...stylex.props(styles.char)}
                >
                  {c}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p {...stylex.props(styles.sub)} {...fade(1.1)}>
              设定目标，AI 会为你生成一组专属英语练习。
            </motion.p>

            <motion.ul
              aria-label="练习目标"
              variants={chipsVariants}
              initial={initial}
              animate="show"
              {...stylex.props(styles.chips)}
            >
              {GOALS.map((g) => {
                const on = selected === g;
                return (
                  <motion.li key={g} variants={chipVariants}>
                    <motion.button
                      type="button"
                      aria-pressed={on}
                      onClick={() => selectLevel(g)}
                      whileTap={reduce ? undefined : { scale: 0.88 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                      {...stylex.props(styles.chip, on && styles.chipOn)}
                    >
                      {g}
                    </motion.button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          <motion.div
            {...stylex.props(styles.ctaWrap)}
            initial={reduce ? false : { opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 1.3 }}
          >
            {!reduce && (
              <motion.span
                aria-hidden="true"
                {...stylex.props(styles.ring)}
                animate={{ opacity: [0.55, 0], scaleX: [1, 1.35], scaleY: [1, 1.7] }}
                transition={{ duration: 2.2, delay: 2, repeat: Infinity, repeatDelay: 0.6, ease: 'easeOut' }}
              />
            )}
            <motion.button
              type="button"
              {...stylex.props(styles.cta)}
              onClick={handleStart}
              onPointerMove={handleMove}
              onPointerLeave={handleLeave}
              style={{ x, y }}
              whileHover={reduce ? undefined : { scale: 1.05 }}
              whileTap={reduce ? undefined : { scale: 0.95 }}
            >
              开始 AI 练习
            </motion.button>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
