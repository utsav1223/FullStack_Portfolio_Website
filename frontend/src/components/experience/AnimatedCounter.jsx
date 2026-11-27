import { useEffect, useRef, useState } from 'react';

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  padZero = false,
  duration = 950,
}) {
  const ref = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimatedRef.current) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      hasAnimatedRef.current = true;
      setDisplayValue(value);
      return;
    }

    let rafId = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        observer.disconnect();

        const start = performance.now();
        const step = (now) => {
          const elapsed = now - start;
          const progress = Math.min(1, elapsed / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(Math.round(eased * value));
          if (progress < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            setDisplayValue(value);
          }
        };
        rafId = requestAnimationFrame(step);
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, duration]);

  const formatted = padZero
    ? String(displayValue).padStart(2, '0')
    : String(displayValue);

  return (
    <span ref={ref} className="exp-counter-value">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
