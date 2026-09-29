import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ProjectCardsDetail {
  cards: HTMLElement[];
}

export function init(root: HTMLElement) {
  const matchMedia = gsap.matchMedia();

  matchMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const context = gsap.context(() => {
      const animateCardsIn = (cards: HTMLElement[]) => {
        if (!cards.length) {
          return;
        }

        gsap.fromTo(
          cards,
          {
            autoAlpha: 0,
            y: 15,

            willChange: 'transform, opacity',
          },
          {
            autoAlpha: 1,
            y: 0,

            duration: 0.7,
            stagger: 0.065,

            ease: 'power2.out',
            overwrite: 'auto',

            onComplete: () => {
              gsap.set(cards, {
                clearProps: 'opacity,visibility,transform,willChange',
              });
            },
          },
        );

        /*
         * Reveal y filtrado pueden
         * modificar la altura total
         * del documento.
         */
        ScrollTrigger.refresh();
      };

      const handleCardsIn = (event: Event) => {
        const customEvent = event as CustomEvent<ProjectCardsDetail>;

        const cards = customEvent.detail?.cards ?? [];

        animateCardsIn(cards);
      };

      root.addEventListener('projects:revealed', handleCardsIn);

      root.addEventListener('projects:filtered', handleCardsIn);

      return () => {
        root.removeEventListener('projects:revealed', handleCardsIn);

        root.removeEventListener('projects:filtered', handleCardsIn);
      };
    }, root);

    return () => {
      const cards = root.querySelectorAll<HTMLElement>('[data-project-card]');

      gsap.killTweensOf(cards);

      context.revert();
    };
  });

  return () => matchMedia.revert();
}
