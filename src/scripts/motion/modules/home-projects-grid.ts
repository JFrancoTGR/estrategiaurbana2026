import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ProjectsRevealedDetail {
  cards: HTMLElement[];
}

export function init(root: HTMLElement) {
  const matchMedia = gsap.matchMedia();

  matchMedia.add(
    "(prefers-reduced-motion: no-preference)",
    () => {
      const context = gsap.context(() => {
        const animateCardsIn = (
          cards: HTMLElement[],
        ) => {
          if (!cards.length) return;

          gsap.fromTo(
            cards,
            {
              autoAlpha: 0,
              y: 15,
              willChange: "transform, opacity",
            },
            {
              autoAlpha: 1,
              y: 0,

              duration: 0.7,
              stagger: 0.065,

              ease: "power2.out",
              overwrite: "auto",

              onComplete: () => {
                gsap.set(cards, {
                  clearProps:
                    "opacity,visibility,transform,willChange",
                });
              },
            },
          );

          /*
           * Las cards ya dejaron de tener display:none,
           * por lo que el documento acaba de cambiar de altura.
           */
          ScrollTrigger.refresh();
        };

        const handleReveal = (event: Event) => {
          const customEvent =
            event as CustomEvent<ProjectsRevealedDetail>;

          const cards =
            customEvent.detail?.cards ?? [];

          animateCardsIn(cards);
        };

        root.addEventListener(
          "projects:revealed",
          handleReveal,
        );

        return () => {
          root.removeEventListener(
            "projects:revealed",
            handleReveal,
          );
        };
      }, root);

      return () => {
        const cards =
          root.querySelectorAll<HTMLElement>(
            "[data-project-card]",
          );

        gsap.killTweensOf(cards);

        context.revert();
      };
    },
  );

  return () => matchMedia.revert();
}