import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

export function initBackToTop() {
  const button =
    document.querySelector<HTMLButtonElement>('[data-back-to-top]');

  if (!button) return;

  let scrollTween: gsap.core.Tween | null = null;

  const handleClick = () => {
    scrollTween?.kill();

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const smoother = ScrollSmoother.get();

    if (smoother) {
      if (reducedMotion) {
        smoother.scrollTop(0);
        return;
      }

      const distance = Math.abs(smoother.scrollTop());

      const duration = gsap.utils.clamp(0.8, 1.6, distance / 2200);

      scrollTween = gsap.to(smoother, {
        scrollTop: 0,
        duration,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });

      return;
    }

    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  };

  button.addEventListener('click', handleClick);

  return () => {
    scrollTween?.kill();

    button.removeEventListener('click', handleClick);
  };
}
