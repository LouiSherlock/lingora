'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type p5 from 'p5';
import * as stylex from '@stylexjs/stylex';

const WORDS = [
  'hello', 'how are you?', 'nice to meet you', 'pronunciation', 'grammar', 'fluency',
  'Let\u2019s practice', 'speak up', 'listening', 'vocabulary', 'could you repeat that?',
  'I\u2019d like to', 'by the way', 'sounds good', 'idioms', 'small talk', 'tell me more',
  'good morning', 'what do you think?', 'accent', 'rhythm', 'keep going',
];

type Burst = { x: number; y: number; vx: number; vy: number; life: number; word: string; isWord: boolean };
type Word = { word: string; x: number; y: number; size: number; vx: number; vy: number; alpha: number; rot: number; phase: number };
type WordFieldProps = { reduceMotion?: boolean };
export type WordFieldHandle = { burst: (x: number, y: number) => void };

const styles = stylex.create({
  host: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    color: 'var(--color-accent)',
  },
});

/**
 * Full-screen p5 canvas: drifting English phrases that scatter from the pointer.
 * Call ref.current.burst(x, y) to emit gold particles and words.
 */
const WordField = forwardRef<WordFieldHandle, WordFieldProps>(function WordField({ reduceMotion = false }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const burstsRef = useRef<Burst[]>([]);

  useImperativeHandle(ref, () => ({
    burst(x, y) {
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 4.5;
        burstsRef.current.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          word: WORDS[(Math.random() * WORDS.length) | 0],
          isWord: Math.random() < 0.35,
        });
      }
    },
  }), []);

  useEffect(() => {
    const ptr = { x: -9999, y: -9999 };
    let accentRgb: [number, number, number] = [0, 0, 0];
    const onMove = (e: PointerEvent) => { ptr.x = e.clientX; ptr.y = e.clientY; };
    const onLeave = () => { ptr.x = ptr.y = -9999; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);

    const sketch = (p: p5) => {
      let items: Word[] = [];
      const count = () => Math.max(14, Math.min(34, Math.floor((p.width * p.height) / 42000)));

      const make = (i: number): Word => {
        const size = p.random(13, 34);
        return {
          word: WORDS[i % WORDS.length],
          x: p.random(p.width),
          y: p.random(p.height),
          size,
          vx: p.random(0.12, 0.5) * (size / 22) * (p.random() < 0.5 ? -1 : 1),
          vy: p.random(-0.12, 0.12),
          alpha: p.map(size, 13, 34, 0.1, 0.22),
          rot: p.random(-0.12, 0.12),
          phase: p.random(1000),
        };
      };
      const seed = () => { items = Array.from({ length: count() }, (_, i) => make(i)); };

      p.setup = () => {
        const resolvedColor = hostRef.current ? getComputedStyle(hostRef.current).color.match(/\d+/g)?.map(Number) : undefined;
        if (resolvedColor && resolvedColor.length >= 3) accentRgb = [resolvedColor[0], resolvedColor[1], resolvedColor[2]];
        const c = p.createCanvas(window.innerWidth, window.innerHeight);
        c.elt.style.display = 'block';
        p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        p.textFont('Outfit, Noto Sans SC, sans-serif');
        p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.CENTER);
        seed();
        if (reduceMotion) p.noLoop(); // draws a single static frame
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
        seed();
      };

      p.draw = () => {
        p.clear();
        const t = p.frameCount * 0.01;

        for (const it of items) {
          if (!reduceMotion) {
            it.x += it.vx;
            it.y += it.vy + Math.sin(t + it.phase) * 0.08;
            const dx = it.x - ptr.x;
            const dy = it.y - ptr.y;
            const d = Math.hypot(dx, dy);
            if (d < 170 && d > 1) {
              const f = (170 - d) / 170;
              it.x += (dx / d) * f * 2.2;
              it.y += (dy / d) * f * 2.2;
            }
          }
          p.textSize(it.size);
          const w = p.textWidth(it.word);
          if (it.vx > 0 && it.x > p.width + 10) { it.x = -w - 10; it.y = p.random(p.height); }
          if (it.vx < 0 && it.x < -w - 10) { it.x = p.width + 10; it.y = p.random(p.height); }

          const near = Math.max(0, 1 - Math.hypot(it.x + w / 2 - ptr.x, it.y - ptr.y) / 230);
          p.push();
          p.translate(it.x, it.y);
          p.rotate(it.rot);
          p.noStroke();
          p.fill(...accentRgb, (it.alpha + near * 0.55) * 255);
          p.text(it.word, 0, 0);
          p.pop();
        }

        const bursts = burstsRef.current;
        for (let j = bursts.length - 1; j >= 0; j--) {
          const b = bursts[j];
          b.x += b.vx; b.y += b.vy;
          b.vx *= 0.94; b.vy = b.vy * 0.94 + 0.03;
          b.life -= 0.016;
          if (b.life <= 0) { bursts.splice(j, 1); continue; }
          p.noStroke();
          p.fill(...accentRgb, b.life * 255);
          if (b.isWord) { p.textSize(16); p.text(b.word, b.x, b.y); }
          else p.circle(b.x, b.y, 3 + b.life * 5);
        }
      };
    };

    let cancelled = false;
    let instance: p5 | undefined;
    void import('p5').then(({ default: P5 }) => {
      if (!cancelled && hostRef.current) instance = new P5(sketch, hostRef.current);
    });
    return () => {
      cancelled = true;
      instance?.remove();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [reduceMotion]);

  return <div ref={hostRef} aria-hidden="true" {...stylex.props(styles.host)} />;
});

export default WordField;
