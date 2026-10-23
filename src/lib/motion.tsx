import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion, type Variants } from "framer-motion";

/* Shared motion vocabulary — one easing, one rhythm, used everywhere. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/* Parent that reveals its children one after another. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/* Child: rises 14px and fades in. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/* Child for list rows: slides in from the reading start. */
export const slideRow = (rtl: boolean): Variants => ({
  hidden: { opacity: 0, x: rtl ? 12 : -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
});

/* Page transition used by the admin layout. */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: EASE } },
};

/* A number that counts up to its value when it comes into view. */
export const CountUp = ({
  value,
  duration = 1.1,
  format = (n: number) => Math.round(n).toLocaleString("en-US"),
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const from = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !inView) {
      el.textContent = format(reduce ? value : from.current);
      if (reduce) from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    from.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduce]);

  return <span ref={ref}>{format(0)}</span>;
};
