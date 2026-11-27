import { useEffect, useRef, useState } from 'react';
import ExperienceCard from './ExperienceCard';

export default function ExperienceTimeline({ items }) {
  const timelineRef = useRef(null);
  const [lineProgress, setLineProgress] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setLineProgress(1);
      return;
    }

    let rafId = 0;
    const updateLine = () => {
      rafId = 0;
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const total = rect.height + viewportH * 0.35;
      const passed = viewportH * 0.72 - rect.top;
      const next = total > 0 ? Math.min(1, Math.max(0, passed / total)) : 0;
      setLineProgress(next);
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(updateLine);
    };

    updateLine();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items.length]);

  return (
    <div ref={timelineRef} className="exp-timeline">
      <div className="exp-timeline-rail" aria-hidden="true">
        <div
          className="exp-timeline-rail-fill"
          style={{ transform: `scaleY(${lineProgress})` }}
        />
      </div>

      <div className="exp-timeline-items">
        {items.map((item, idx) => (
          <ExperienceCard key={item.id || idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
}
