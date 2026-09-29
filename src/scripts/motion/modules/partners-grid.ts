import gsap from 'gsap';

export function init(root: HTMLElement) {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-partner-card]')];

  if (!cards.length) {
    return;
  }

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set(cards, {
      autoAlpha: 0,
      y: 20,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              cards.indexOf(a.target as HTMLElement) -
              cards.indexOf(b.target as HTMLElement),
          );

        visibleEntries.forEach((entry, index) => {
          const card = entry.target as HTMLElement;

          observer.unobserve(card);

          gsap.to(card, {
            autoAlpha: 1,
            y: 0,

            duration: 0.72,

            delay: index * 0.075,

            ease: 'power2.out',

            clearProps: 'opacity,visibility,transform',
          });
        });
      },
      {
        threshold: 0.12,

        rootMargin: '0px 0px -15% 0px',
      },
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();

      gsap.killTweensOf(cards);

      gsap.set(cards, {
        clearProps: 'opacity,visibility,transform',
      });
    };
  });

  return () => {
    mm.revert();
  };
}
