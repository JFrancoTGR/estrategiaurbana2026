import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function init(root: HTMLElement) {
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

  const elements = [
    eyebrow,
    title,
    description,
  ].filter(
    (element): element is HTMLElement =>
      element !== null,
  );

  if (!elements.length) return;

  const matchMedia = gsap.matchMedia();

  matchMedia.add(
    "(prefers-reduced-motion: no-preference)",
    () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top 68%",
            once: true,    
            markers: false,        
          },

          defaults: {
            ease: "power2.out",
          },

          onComplete: () => {
            gsap.set(elements, {
              clearProps:
                "opacity,visibility,transform,willChange",
            });
          },
        });

        if (eyebrow) {
          timeline.fromTo(
            eyebrow,
            {
              autoAlpha: 0,
              y: 8,
              willChange: "transform, opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
            },
            0,
          );
        }

        if (title) {
          timeline.fromTo(
            title,
            {
              autoAlpha: 0,
              y: 14,
              willChange: "transform, opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.78,
            },
            0.1,
          );
        }

        if (description) {
          timeline.fromTo(
            description,
            {
              autoAlpha: 0,
              y: 10,
              willChange: "transform, opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.68,
            },
            0.24,
          );
        }
      }, root);

      return () => context.revert();
    },
  );

  return () => matchMedia.revert();
}