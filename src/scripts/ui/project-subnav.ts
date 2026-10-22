import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initProjectSubnav(root: HTMLElement) {
  const headerHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--header-height-scrolled',
    ),
  );

  const pinOffset = Math.round(headerHeight) - 1;

  const smoothContent = document.querySelector<HTMLElement>(
    '[data-smooth-content]',
  );

  const scroller = root.querySelector<HTMLElement>('.page-shell');

  if (!smoothContent) {
    return;
  }

  const updateScrollIndicator = () => {
    if (!scroller) {
      root.dataset.canScrollRight = 'false';
      return;
    }

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

    const threshold = 4;

    const canScrollRight =
      maxScrollLeft > threshold &&
      scroller.scrollLeft < maxScrollLeft - threshold;

    root.dataset.canScrollRight = String(canScrollRight);
  };

  const trigger = ScrollTrigger.create({
    trigger: root,

    start: `top top+=${pinOffset}`,

    endTrigger: smoothContent,
    end: 'bottom bottom',

    pin: true,
    pinSpacing: false,
    pinType: 'fixed',
    pinReparent: true,

    invalidateOnRefresh: true,
  });

  updateScrollIndicator();

  scroller?.addEventListener('scroll', updateScrollIndicator, {
    passive: true,
  });

  window.addEventListener('resize', updateScrollIndicator, { passive: true });

  return () => {
    trigger.kill();

    scroller?.removeEventListener('scroll', updateScrollIndicator);

    window.removeEventListener('resize', updateScrollIndicator);

    delete root.dataset.canScrollRight;
  };
}
