import gsap from 'gsap';

export function init(root: HTMLElement) {
  const media = root.querySelector<HTMLElement>('[data-anim="media"]');

  const title = root.querySelector<HTMLElement>('[data-anim="title"]');

  const cta = root.querySelector<HTMLElement>('[data-anim="cta"]');

  const header = document.querySelector<HTMLElement>('[data-site-header]');

  if (!media) return;

  const content = [title, cta].filter(
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
          gsap.set([media, header, ...content].filter(Boolean), {
            clearProps: 'opacity,visibility,transform,willChange',
          });
        },
      });

      timeline.fromTo(
        media,
        {
          autoAlpha: 0.45,
          scale: 1.025,
          willChange: 'transform, opacity',
        },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.95,
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

      if (content.length) {
        timeline.fromTo(
          content,
          {
            autoAlpha: 0,
            y: 8,
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
    }, root);

    return () => context.revert();
  });

  return () => matchMedia.revert();
}
