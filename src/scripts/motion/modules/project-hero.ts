import gsap from 'gsap';

export function init(root: HTMLElement) {
  const media = root.querySelector<HTMLElement>('[data-anim="media"]');

  const eyebrow = root.querySelector<HTMLElement>('[data-anim="eyebrow"]');

  const title = root.querySelector<HTMLElement>('[data-anim="title"]');

  const divider = root.querySelector<HTMLElement>('[data-anim="divider"]');

  const stats = root.querySelector<HTMLElement>('[data-anim="stats"]');

  const cta = root.querySelector<HTMLElement>('[data-anim="cta"]');

  const header = document.querySelector<HTMLElement>('[data-site-header]');

  if (!media) return;

  const identity = [eyebrow, title].filter(
    (element): element is HTMLElement => element !== null,
  );

  const meta = [stats, cta].filter(
    (element): element is HTMLElement => element !== null,
  );

  const matchMedia = gsap.matchMedia();

  matchMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power2.out',
        },

        onComplete: () => {
          gsap.set(
            [media, header, ...identity, divider, ...meta].filter(Boolean),
            {
              clearProps:
                'opacity,visibility,transform,transformOrigin,willChange',
            },
          );
        },
      });

      timeline.fromTo(
        media,
        {
          autoAlpha: 0.45,
          scale: 1.03,
          willChange: 'transform, opacity',
        },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 1.05,
        },
        0,
      );

      if (header) {
        timeline.fromTo(
          header,
          {
            autoAlpha: 0,
            y: -8,
            willChange: 'transform, opacity',
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
          },
          0.1,
        );
      }

      if (identity.length) {
        timeline.fromTo(
          identity,
          {
            autoAlpha: 0,
            y: 10,
            willChange: 'transform, opacity',
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.08,
          },
          0.28,
        );
      }

      if (divider) {
        timeline.fromTo(
          divider,
          {
            scaleX: 0,
            transformOrigin: 'left center',
            willChange: 'transform',
          },
          {
            scaleX: 1,
            duration: 0.75,
          },
          0.46,
        );
      }

      if (meta.length) {
        timeline.fromTo(
          meta,
          {
            autoAlpha: 0,
            y: 8,
            willChange: 'transform, opacity',
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
          },
          0.58,
        );
      }
    }, root);

    return () => context.revert();
  });

  return () => matchMedia.revert();
}
