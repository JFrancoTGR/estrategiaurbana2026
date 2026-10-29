export function init(root: HTMLElement) {
  const elements = root.querySelectorAll<HTMLElement>('[data-anim]');

  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    elements.forEach((element) => {
      element.classList.add('is-visible');
    });

    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;

      elements.forEach((element) => {
        element.classList.add('is-visible');
      });

      observer.disconnect();
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -18% 0px',
    },
  );

  observer.observe(root);

  return () => {
    observer.disconnect();
  };
}
