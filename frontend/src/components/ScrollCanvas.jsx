import { useEffect, useRef, useState } from 'react';

const DESKTOP_CONFIG = {
  count: 241,
  dir: 'photos_zip',
  maxDpr: 2,
  concurrency: 16,
};

const PHONE_CONFIG = {
  count: 300,
  dir: 'phone_photo',
  maxDpr: 1.5,
  concurrency: 10,
};

const getIsPortrait = () =>
  typeof window !== 'undefined' && window.innerWidth < window.innerHeight;

export default function ScrollCanvas({ onProgress }) {
  const canvasRef = useRef(null);
  const progressCbRef = useRef(onProgress);
  progressCbRef.current = onProgress;

  const [isPortrait, setIsPortrait] = useState(getIsPortrait);

  useEffect(() => {
    const checkOrientation = () => {
      const next = getIsPortrait();
      setIsPortrait((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('resize', checkOrientation, { passive: true });
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    const cfg = isPortrait ? PHONE_CONFIG : DESKTOP_CONFIG;
    const frameCount = cfg.count;
    const framePath = (index) =>
      `/${cfg.dir}/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`;

    const frames = new Array(frameCount);
    const ready = new Uint8Array(frameCount);

    let width = 0;
    let height = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let lastDrawnFrame = -1;
    let lastTime = performance.now();
    let rafId = 0;
    let disposed = false;

    function computeProgress() {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      return maxScroll > 0
        ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
        : 0;
    }

    function updateScrollTarget() {
      targetProgress = computeProgress();
      if (progressCbRef.current) {
        progressCbRef.current(targetProgress);
      }
      scheduleRender();
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawnFrame = -1;
      updateScrollTarget();
    }

    function findNearestReady(index) {
      if (ready[index]) return index;
      for (let offset = 1; offset < frameCount; offset++) {
        if (index - offset >= 0 && ready[index - offset]) return index - offset;
        if (index + offset < frameCount && ready[index + offset]) return index + offset;
      }
      return -1;
    }

    function drawImageCover(img, alpha) {
      if (!img || !img.naturalWidth || !img.naturalHeight) return;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const viewAspect = width / height;

      let drawW;
      let drawH;
      if (viewAspect > imgAspect) {
        drawW = width;
        drawH = width / imgAspect;
      } else {
        drawH = height;
        drawW = height * imgAspect;
      }

      const x = (width - drawW) * 0.5;
      const y = (height - drawH) * 0.5;

      ctx.globalAlpha = alpha;
      ctx.drawImage(img, x, y, drawW, drawH);
    }

    function drawFrame(exactFrame) {
      const indexA = Math.min(frameCount - 1, Math.floor(exactFrame));
      const indexB = Math.min(frameCount - 1, indexA + 1);
      const blend = exactFrame - indexA;

      const resolvedA = findNearestReady(indexA);
      if (resolvedA === -1) return;

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      drawImageCover(frames[resolvedA], 1);

      if (
        resolvedA === indexA &&
        indexB !== indexA &&
        blend > 0.01 &&
        ready[indexB]
      ) {
        drawImageCover(frames[indexB], blend);
      }

      ctx.globalAlpha = 1;
      lastDrawnFrame = exactFrame;
    }

    function render(now) {
      rafId = 0;
      if (disposed) return;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.0001) {
        currentProgress = targetProgress;
      } else {
        const ease = 1 - Math.exp(-10 * dt);
        currentProgress += diff * ease;
      }

      const exactFrame = currentProgress * (frameCount - 1);
      if (Math.abs(exactFrame - lastDrawnFrame) > 0.001) {
        drawFrame(exactFrame);
      }

      if (currentProgress !== targetProgress) {
        rafId = requestAnimationFrame(render);
      }
    }

    function scheduleRender() {
      if (!rafId && !disposed) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(render);
      }
    }

    function loadFrame(index) {
      return new Promise((resolve) => {
        if (disposed) {
          resolve();
          return;
        }
        const img = new Image();
        img.decoding = 'async';
        img.src = framePath(index);
        frames[index] = img;

        const markReady = () => {
          if (disposed) {
            resolve();
            return;
          }
          ready[index] = 1;
          if (
            index === 0 ||
            Math.abs(currentProgress * (frameCount - 1) - index) < 2
          ) {
            lastDrawnFrame = -1;
            scheduleRender();
          }
          resolve();
        };

        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode().then(markReady, markReady);
          } else {
            markReady();
          }
        };
        img.onerror = resolve;
      });
    }

    async function preloadFrames() {
      const initialIndex = Math.min(
        frameCount - 1,
        Math.round(computeProgress() * (frameCount - 1))
      );
      await loadFrame(initialIndex);

      let nextIndex = 0;
      async function worker() {
        while (nextIndex < frameCount && !disposed) {
          const idx = nextIndex++;
          if (idx === initialIndex) continue;
          await loadFrame(idx);
        }
      }

      await Promise.all(Array.from({ length: cfg.concurrency }, worker));
    }

    currentProgress = computeProgress();
    targetProgress = currentProgress;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollTarget();
    });
    resizeObserver.observe(document.body);

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });

    resizeCanvas();
    preloadFrames();

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPortrait]);

  return (
    <>
      <div className="scroll-canvas-layer" aria-hidden="true">
        <canvas ref={canvasRef} className="scroll-canvas" />
      </div>
      <div className="scroll-scrim" aria-hidden="true" />
    </>
  );
}
