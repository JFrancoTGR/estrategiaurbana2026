import gsap from "gsap";

export function init(root: HTMLElement) {
  const media =
    root.querySelector<HTMLElement>('[data-anim="media"]');

  const mark =
    root.querySelector<HTMLElement>('[data-anim="mark"]');

  const title =
    root.querySelector<HTMLElement>('[data-anim="title"]');

  const description =
    root.querySelector<HTMLElement>('[data-anim="description"]');

  const cta =
    root.querySelector<HTMLElement>('[data-anim="cta"]');

  const header =
    document.querySelector<HTMLElement>("[data-site-header]");

  if (!media) return;

  const content = [
    mark,
    title,
    description,
    cta,
  ].filter((element): element is HTMLElement => element !== null);

  const matchMedia = gsap.matchMedia();

  matchMedia.add(
    "(prefers-reduced-motion: no-preference)",
    () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: {
            ease: "power2.out",
          },

          onComplete: () => {
            gsap.set(
              [
                media,
                header,
                ...content,
              ].filter(Boolean),
              {
                clearProps:
                  "opacity,visibility,transform,willChange",
              },
            );
          },
        });

        timeline.fromTo(
          media,
          {
            autoAlpha: 0.44,
            scale: 1.033,
            willChange: "transform, opacity",
          },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.99,
          },
          0,
        );

        if (header) {
          timeline.fromTo(
            header,
            {
              autoAlpha: 0,
              y: -8,
              willChange: "transform, opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.86,
            },
            0.1,
          );
        }

        if (content.length) {
          timeline.fromTo(
            content,
            {
              autoAlpha: 0,
              y: 6,
              willChange: "transform, opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.81,
              stagger: 0.063,
            },
            0.29,
          );
        }
      }, root);

      return () => context.revert();
    },
  );

  return () => matchMedia.revert();
}