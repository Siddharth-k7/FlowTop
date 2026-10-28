import React, { useEffect, useRef, useState, useCallback } from 'react';

interface FrameSequenceCanvasProps {
  progress: number; // 0 to 1
  manifestUrl?: string;
  onFallbackNeeded?: () => void;
  className?: string;
}

interface ManifestData {
  fps: number;
  frameCount: number;
  frames: string[];
  fallbackStaticImage?: string;
  videoUrl?: string;
  scrubVideoUrl?: string;
}

export const FrameSequenceCanvas: React.FC<FrameSequenceCanvasProps> = ({
  progress,
  manifestUrl = '/flowtop/frames/manifest.json',
  onFallbackNeeded,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [isManifestLoaded, setIsManifestLoaded] = useState(false);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState(false);
  const loadedImagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const animationFrameIdRef = useRef<number | null>(null);
  const currentRenderedIndexRef = useRef<number>(-1);

  // 1. Fetch manifest and initialize frames list
  useEffect(() => {
    let isMounted = true;

    async function loadManifest() {
      try {
        const response = await fetch(manifestUrl);
        if (!response.ok) throw new Error('Manifest not found');
        const data: ManifestData = await response.json();

        if (isMounted) {
          if (!data.frames || data.frames.length === 0) {
            onFallbackNeeded?.();
          } else {
            setFrames(data.frames);
          }
          setIsManifestLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsManifestLoaded(true);
          onFallbackNeeded?.();
        }
      }
    }

    loadManifest();
    return () => {
      isMounted = false;
    };
  }, [manifestUrl, onFallbackNeeded]);

  // 2. High-performance canvas render function with nearest-neighbor fallback
  const renderFrame = useCallback(
    (targetIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      // Look up target frame, or find closest available loaded frame (flicker-free)
      let img = loadedImagesRef.current.get(targetIndex);
      let renderIndex = targetIndex;

      if (!img || !img.complete || img.naturalWidth === 0) {
        let minDiff = Infinity;
        let closestIdx = -1;

        for (const [idx, loadedImg] of loadedImagesRef.current.entries()) {
          if (loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0) {
            const diff = Math.abs(idx - targetIndex);
            if (diff < minDiff) {
              minDiff = diff;
              closestIdx = idx;
            }
          }
        }

        if (closestIdx !== -1) {
          img = loadedImagesRef.current.get(closestIdx);
          renderIndex = closestIdx;
        }
      }

      if (!img || !img.complete || img.naturalWidth === 0) {
        return;
      }

      // Handle Retina / HiDPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) return;

      const targetCanvasWidth = Math.round(width * dpr);
      const targetCanvasHeight = Math.round(height * dpr);

      if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Fit aspect ratio (contain) centered
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;

      let renderWidth = width;
      let renderHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        renderHeight = height;
        renderWidth = height * imgRatio;
        offsetX = (width - renderWidth) / 2;
      } else {
        renderWidth = width;
        renderHeight = width / imgRatio;
        offsetY = (height - renderHeight) / 2;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
      ctx.restore();

      currentRenderedIndexRef.current = renderIndex;
    },
    []
  );

  // 3. Progressive multi-tier preloader
  useEffect(() => {
    if (frames.length === 0) return;

    let isCancelled = false;

    const loadSingleFrame = (idx: number): Promise<void> => {
      return new Promise((resolve) => {
        if (loadedImagesRef.current.has(idx)) {
          resolve();
          return;
        }
        const img = new Image();
        img.src = frames[idx];
        img.onload = () => {
          if (!isCancelled) {
            loadedImagesRef.current.set(idx, img);
            if (!isFirstFrameReady) {
              setIsFirstFrameReady(true);
            }
            if (
              currentRenderedIndexRef.current === -1 ||
              idx === Math.min(frames.length - 1, Math.max(0, Math.floor(progress * (frames.length - 1))))
            ) {
              renderFrame(idx);
            }
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    // Tier 1: Immediately fetch initial frame, middle frame, and last frame
    loadSingleFrame(0);
    loadSingleFrame(Math.floor(frames.length / 2));
    loadSingleFrame(frames.length - 1);

    // Tier 2: Fetch window around current progress
    const currentIdx = Math.min(
      frames.length - 1,
      Math.max(0, Math.floor(progress * (frames.length - 1)))
    );
    const windowSize = 8;
    const startWin = Math.max(0, currentIdx - 4);
    const endWin = Math.min(frames.length - 1, currentIdx + windowSize);
    for (let i = startWin; i <= endWin; i++) {
      loadSingleFrame(i);
    }

    // Tier 3: Progressively background-cache remaining frames in idle slices
    let queueIdx = 0;
    const processBatch = () => {
      if (isCancelled || queueIdx >= frames.length) return;

      const batchSize = 6;
      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < batchSize && queueIdx < frames.length; i++) {
        batchPromises.push(loadSingleFrame(queueIdx));
        queueIdx++;
      }

      Promise.all(batchPromises).then(() => {
        if (!isCancelled && queueIdx < frames.length) {
          if ('requestIdleCallback' in window) {
            (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void }).requestIdleCallback(
              processBatch,
              { timeout: 120 }
            );
          } else {
            setTimeout(processBatch, 25);
          }
        }
      });
    };

    const idleTimer = setTimeout(processBatch, 80);

    return () => {
      isCancelled = true;
      clearTimeout(idleTimer);
    };
  }, [frames, progress, isFirstFrameReady, renderFrame]);

  // 4. RequestAnimationFrame-throttled scrub renderer on scroll progress changes
  useEffect(() => {
    if (frames.length === 0) return;

    const frameIndex = Math.min(
      frames.length - 1,
      Math.max(0, Math.floor(progress * (frames.length - 1)))
    );

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    animationFrameIdRef.current = requestAnimationFrame(() => {
      renderFrame(frameIndex);
    });

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [progress, frames, renderFrame]);

  // 5. Handle window resizing to keep canvas sharp and centered
  useEffect(() => {
    const handleResize = () => {
      if (currentRenderedIndexRef.current >= 0) {
        renderFrame(currentRenderedIndexRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderFrame]);

  if (!isManifestLoaded || frames.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-purple-light/40 border-t-purple-deep animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      {/* Loading placeholder before first frame renders */}
      {!isFirstFrameReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-pale/20 backdrop-blur-sm rounded-full animate-pulse">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-deep">
            <span className="w-2 h-2 rounded-full bg-purple-deep animate-ping" />
            <span>Loading Transformation...</span>
          </div>
        </div>
      )}

      {/* Seamless Canvas with edge feathering — No box container border or player shadow */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain transition-transform duration-100 select-none pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 86% at 50% 50%, black 72%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 86% at 50% 50%, black 72%, transparent 100%)',
        }}
        aria-label="Flowtop precision faucet interactive transformation and deconstruction sequence"
      />
    </div>
  );
};
