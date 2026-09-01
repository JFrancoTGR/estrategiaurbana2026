import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function init(root: HTMLElement) {
  const background =
    root.querySelector<HTMLElement>(
      '[data-anim="background"]',
    );

  const eyebrow =
    root.querySelector<HTMLElement>(
      '[data-anim="eyebrow"]',
    );

  const title =
    root.querySelector<HTMLElement>(
      '[data-anim="title"]',
    );

  const description =
    root.querySelector<HTMLElement>(
      '[data-anim="description"]',
    );

  const mm = gsap.matchMedia();

  mm.add(
    '(prefers-reduced-motion: no-preference)',
    () => {
      const context = gsap.context(() => {
        if (background) {
          gsap.fromTo(
            background,
            {
              yPercent: -21,
            },
            {
              yPercent: 21,

              ease: 'none',

              scrollTrigger: {
                trigger: root,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
        }

        const introItems = [
          eyebrow,
          title,
          description,
        ].filter(Boolean);

        if (introItems.length) {
          gsap.fromTo(
            introItems,
            {
              autoAlpha: 0,
              y: 10,
            },
            {
              autoAlpha: 1,
              y: 0,

              duration: 0.72,
              stagger: 0.1,

              ease: 'power2.out',

              scrollTrigger: {
                trigger: root,
                start: 'top 68%',
                once: true,
              },

              clearProps: 'opacity,visibility,transform',
            },
          );
        }
      }, root);

      return () => {
        context.revert();
      };
    },
  );

  return () => {
    mm.revert();
  };
}