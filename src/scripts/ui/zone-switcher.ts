import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initZoneSwitcher(root: HTMLElement) {
  const headerHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--header-height-scrolled',
    ),
  );

  const pinOffset = Math.round(headerHeight) - 1;

  const smoothContent = document.querySelector<HTMLElement>(
    '[data-smooth-content]',
  );

  if (!smoothContent) {
    return;
  }

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

  return () => {
    trigger.kill();
  };
}