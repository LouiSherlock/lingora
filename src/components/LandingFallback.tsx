'use client';

import * as stylex from '@stylexjs/stylex';
import { motion, useReducedMotion } from 'motion/react';

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    height: stylex.firstThatWorks('100dvh', '100vh'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-background-surface)',
    backgroundImage:
      'radial-gradient(40% 40% at 50% 50%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%)',
  },
  svg: { width: 'min(160px, 40vw)', height: 'auto', overflow: 'visible' },
  star: {
    fill: 'var(--color-accent)',
    stroke: 'var(--color-accent)',
    strokeWidth: 1.5,
    strokeLinejoin: 'round',
  },
});

const BIG = 'M50 32 C54 58 62 66 88 70 C62 74 54 82 50 108 C46 82 38 74 12 70 C38 66 46 58 50 32 Z';
const SMALL_A = 'M95 11 C96.5 20 100 23.5 109 25 C100 26.5 96.5 30 95 39 C93.5 30 90 26.5 81 25 C90 23.5 93.5 20 95 11 Z';
const SMALL_B = 'M22 14 C23 19 25 21 30 22 C25 23 23 25 22 30 C21 25 19 23 14 22 C19 21 21 19 22 14 Z';

const STARS = [
  { d: BIG, delay: 0, pulse: [1, 1.1, 1], dur: 2.2 },
  { d: SMALL_A, delay: 0.25, pulse: [1, 1.35, 1], dur: 1.6 },
  { d: SMALL_B, delay: 0.5, pulse: [1, 1.5, 1], dur: 1.9 },
];

export default function LandingFallback() {
  const reduce = useReducedMotion();

  return (
    <div role="status" aria-label="正在加载首页" {...stylex.props(styles.root)}>
      <svg viewBox="0 0 120 120" aria-hidden="true" {...stylex.props(styles.svg)}>
        {STARS.map((s) => (
          <motion.g
            key={s.d}
            animate={reduce ? undefined : { scale: s.pulse, opacity: [1, 0.7, 1] }}
            transition={{
              duration: s.dur,
              delay: 1.4 + s.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.path
              d={s.d}
              {...stylex.props(styles.star)}
              initial={reduce ? false : { pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{
                pathLength: { duration: 1, delay: s.delay, ease: 'easeInOut' },
                fillOpacity: { duration: 0.5, delay: 0.9 + s.delay },
              }}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}