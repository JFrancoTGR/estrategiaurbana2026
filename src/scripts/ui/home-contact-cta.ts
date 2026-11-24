import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export function initHomeContactCTA() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    '[data-home-contact-cta]',
  );

  const target = document.getElementById('contacto');

  if (!target || !links.length) return;

  let scrollTween: gsap.core.Tween | null = null;

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();

    const headerHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--header-height-scrolled',
      ),
    );

    const offset = Number.isFinite(headerHeight) ? Math.round(headerHeight) : 0;

    const smoother = ScrollSmoother.get();

    scrollTween?.kill();

    if (smoother) {
      const destination = gsap.utils.clamp(
        0,
        ScrollTrigger.maxScroll(window),
        smoother.offset(target, `top ${offset}px`),
      );

      const distance = Math.abs(destination - smoother.scrollTop());

      const duration = gsap.utils.clamp(0.8, 1.6, distance / 2200);

      scrollTween = gsap.to(smoother, {
        scrollTop: destination,
        duration,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });

      return;
    }

    const targetTop =
      target.getBoundingClientRect().top + window.scrollY - offset;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    window.scrollTo({
      top: targetTop,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  links.forEach((link) => {
    link.addEventListener('click', handleClick);
  });

  return () => {
    scrollTween?.kill();

    links.forEach((link) => {
      link.removeEventListener('click', handleClick);
    });
  };
}
