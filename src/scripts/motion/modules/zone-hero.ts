import gsap from 'gsap';

export function init(root: HTMLElement) {
  const media = root.querySelector<HTMLElement>('[data-anim="media"]');

  const subtitle = root.querySelector<HTMLElement>('[data-anim="subtitle"]');

  const title = root.querySelector<HTMLElement>('[data-anim="title"]');

  const header = document.querySelector<HTMLElement>('[data-site-header]');

  if (!media) return;

  const mm = gsap.matchMedia();

  const context = gsap.context(() => {
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        defaults: {
          ease: 'power2.out',
        },

        onComplete: () => {
          gsap.set([media, subtitle, title, header].filter(Boolean), {
            clearProps: 'opacity,visibility,transform,willChange',
          });
        },
      });

      timeline.fromTo(
        media,
        {
          autoAlpha: 0.45,
          scale: 1.03,
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
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
          },
          0.1,
        );
      }

      const content = [subtitle, title].filter(
        (element): element is HTMLElement => Boolean(element),
      );

      timeline.fromTo(
        content,
        {
          autoAlpha: 0,
          y: 10,
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
        },
        0.28,
      );
    });
  }, root);

  return () => {
    context.revert();
    mm.revert();
  };
}
