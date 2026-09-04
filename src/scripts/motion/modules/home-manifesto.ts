import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type FrameAsset = ImageBitmap | HTMLImageElement;

const BUFFER_RADIUS = 4;
const CACHE_LIMIT = 24;

const SCROLL_DISTANCE = 6.7;

const CTA_REVEAL_PROGRESS = 0.72;

export function init(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>(
    '[data-sequence-canvas]',
  );

  const sequenceBase = root.dataset.sequenceBase;

  const frameCount = Number(root.dataset.frameCount);

  if (
    !canvas ||
    !sequenceBase ||
    !Number.isFinite(frameCount) ||
    frameCount <= 0
  ) {
    return;
  }

  const context2d = canvas.getContext('2d', {
    alpha: false,
  });

  if (!context2d) return;

  const cache = new Map<number, FrameAsset>();

  const pending = new Map<number, Promise<FrameAsset | null>>();

  let desiredFrame = 0;
  let renderedFrame = -1;

  let ctaVisible = false;

  let frameRequest = 0;
  let drawQueued = false;

  let queuedFrame = -1;
  let queuedAsset: FrameAsset | null = null;

  const clampFrame = (index: number) =>
    Math.max(0, Math.min(frameCount - 1, index));

  const getNearestCachedFrame = (target: number) => {
    if (cache.has(target)) {
      return target;
    }

    let nearest: number | null = null;
    let nearestDistance = Infinity;

    cache.forEach((_, index) => {
      const distance = Math.abs(index - target);

      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });

    return nearest;
  };

  const queueDraw = (index: number, asset: FrameAsset) => {
    /*
     * Siempre conservamos el estado
     * visual más reciente solicitado.
     */
    queuedFrame = index;
    queuedAsset = asset;

    /*
     * Si ya hay un repaint esperando,
     * no creamos otro.
     */
    if (drawQueued) {
      return;
    }

    drawQueued = true;

    frameRequest = requestAnimationFrame(() => {
      drawQueued = false;

      if (!queuedAsset || queuedFrame < 0) {
        return;
      }

      drawCover(queuedAsset);

      renderedFrame = queuedFrame;

      root.classList.add('is-canvas-ready');

      //   console.log('DRAW', renderedFrame, 'TARGET', desiredFrame);
    });
  };

  const getFrameUrl = (index: number) => {
    const number = String(index + 1).padStart(4, '0');

    return `${sequenceBase}/frame-${number}.webp`;
  };

  const closeFrame = (asset: FrameAsset) => {
    if ('close' in asset && typeof asset.close === 'function') {
      asset.close();
    }
  };

  const trimCache = (anchor: number) => {
    if (cache.size <= CACHE_LIMIT) {
      return;
    }

    const candidates = [...cache.keys()]
      .filter((index) => index !== anchor && index !== queuedFrame)
      .sort((a, b) => Math.abs(b - anchor) - Math.abs(a - anchor));

    while (cache.size > CACHE_LIMIT && candidates.length) {
      const index = candidates.shift();

      if (index === undefined) break;

      const asset = cache.get(index);

      if (asset) {
        closeFrame(asset);
      }

      cache.delete(index);
    }
  };

  const loadImageFallback = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.decoding = 'async';

      image.onload = () => {
        resolve(image);
      };

      image.onerror = reject;

      image.src = url;
    });

  const loadFrame = async (index: number): Promise<FrameAsset | null> => {
    const cached = cache.get(index);

    if (cached) {
      return cached;
    }

    const existing = pending.get(index);

    if (existing) {
      return existing;
    }

    const promise = (async () => {
      try {
        const url = getFrameUrl(index);

        let asset: FrameAsset;

        if ('createImageBitmap' in window) {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`Frame ${index} failed`);
          }

          const blob = await response.blob();

          asset = await createImageBitmap(blob);
        } else {
          asset = await loadImageFallback(url);
        }

        cache.set(index, asset);

        trimCache(desiredFrame);

        return asset;
      } catch (error) {
        console.warn('Manifesto frame failed:', index, error);

        return null;
      } finally {
        pending.delete(index);
      }
    })();

    pending.set(index, promise);

    return promise;
  };

  const drawCover = (asset: FrameAsset) => {
    const sourceWidth =
      asset instanceof HTMLImageElement ? asset.naturalWidth : asset.width;

    const sourceHeight =
      asset instanceof HTMLImageElement ? asset.naturalHeight : asset.height;

    if (!sourceWidth || !sourceHeight) {
      return;
    }

    const scale = Math.max(
      canvas.width / sourceWidth,

      canvas.height / sourceHeight,
    );

    const width = sourceWidth * scale;

    const height = sourceHeight * scale;

    const x = (canvas.width - width) / 2;

    const y = (canvas.height - height) / 2;

    context2d.clearRect(0, 0, canvas.width, canvas.height);

    context2d.drawImage(asset, x, y, width, height);
  };

  const warmAround = (anchor: number) => {
    const indexes: number[] = [];

    for (let distance = 0; distance <= BUFFER_RADIUS; distance++) {
      const forward = anchor + distance;

      const backward = anchor - distance;

      if (forward >= 0 && forward < frameCount) {
        indexes.push(forward);
      }

      if (distance > 0 && backward >= 0 && backward < frameCount) {
        indexes.push(backward);
      }
    }

    indexes.forEach((index) => {
      void loadFrame(index);
    });
  };

  const renderFrame = (index: number) => {
    desiredFrame = clampFrame(index);

    /*
     * 1. Si el frame exacto
     * ya está decodificado,
     * pintamos inmediatamente.
     */
    const exact = cache.get(desiredFrame);

    if (exact) {
      queueDraw(desiredFrame, exact);

      warmAround(desiredFrame);

      return;
    }

    /*
     * 2. Si todavía no está,
     * usamos temporalmente el
     * frame disponible más cercano.
     */
    const nearestIndex = getNearestCachedFrame(desiredFrame);

    if (nearestIndex !== null) {
      const nearest = cache.get(nearestIndex);

      if (nearest) {
        queueDraw(nearestIndex, nearest);
      }
    }

    /*
     * 3. Pedimos el frame exacto.
     * Cuando llegue, sólo sustituye
     * al provisional si sigue siendo
     * el target actual.
     */
    const requestedFrame = desiredFrame;

    void loadFrame(requestedFrame).then((asset) => {
      if (!asset || requestedFrame !== desiredFrame) {
        return;
      }

      queueDraw(requestedFrame, asset);
    });

    /*
     * 4. Mientras tanto adelantamos
     * el buffer cercano.
     */
    warmAround(desiredFrame);
  };

  const requestFrame = (index: number) => {
    renderFrame(index);
  };

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.round(rect.width * dpr);

    const height = Math.round(rect.height * dpr);

    if (canvas.width === width && canvas.height === height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const asset = cache.get(renderedFrame);

    if (asset) {
      drawCover(asset);
    }
  };

  const matchMedia = gsap.matchMedia();

  matchMedia.add(
    '(min-width: 835px) and (prefers-reduced-motion: no-preference)',
    () => {
      resizeCanvas();
      void loadFrame(0).then((firstFrame) => {
        if (!firstFrame) {
          return;
        }

        drawCover(firstFrame);

        desiredFrame = 0;
        renderedFrame = 0;

        root.classList.add('is-canvas-ready');

        warmAround(0);
      });

      const resizeObserver = new ResizeObserver(resizeCanvas);

      resizeObserver.observe(canvas);

      /*
       * Precarga antes de alcanzar
       * físicamente la sección.
       */
      const preloadObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) {
            return;
          }

          warmAround(0);

          preloadObserver.disconnect();
        },
        {
          rootMargin: '100% 0px 100% 0px',

          threshold: 0.01,
        },
      );

      preloadObserver.observe(root);

      const playhead = {
        frame: 0,
      };

      const animation = gsap.to(playhead, {
        frame: frameCount - 1,

        ease: 'none',

        onUpdate: () => {
          requestFrame(Math.round(playhead.frame));

          const progress = playhead.frame / (frameCount - 1);

          const shouldShowCTA = progress >= CTA_REVEAL_PROGRESS;

          if (shouldShowCTA !== ctaVisible) {
            ctaVisible = shouldShowCTA;

            root.classList.toggle('is-cta-visible', shouldShowCTA);
          }
        },

        scrollTrigger: {
          trigger: root,

          start: 'top top',

          end: () => '+=' + window.innerHeight * SCROLL_DISTANCE,

          pin: true,

          scrub: 0.39,

          anticipatePin: 1,

          invalidateOnRefresh: true,
        },
      });

      /*
       * Garantiza que el primer
       * frame del canvas pueda
       * sustituir al fallback.
       */
      requestFrame(0);

      return () => {
        preloadObserver.disconnect();

        resizeObserver.disconnect();

        animation.kill();

        cancelAnimationFrame(frameRequest);
        drawQueued = false;
        queuedFrame = -1;
        queuedAsset = null;

        pending.clear();

        cache.forEach(closeFrame);

        cache.clear();

        root.classList.remove('is-canvas-ready', 'is-cta-visible');
        ctaVisible = false;
      };
    },
  );

  return () => {
    matchMedia.revert();
  };
}
