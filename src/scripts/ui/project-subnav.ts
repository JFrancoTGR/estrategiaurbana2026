import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export function initProjectSubnav(root: HTMLElement) {
  const fixedRoot = document.querySelector<HTMLElement>(
    '[data-project-subnav="fixed"]',
  );

  if (!fixedRoot) return;

  const navs = [root, fixedRoot];
  const links = navs.flatMap((nav) =>
    Array.from(
      nav.querySelectorAll<HTMLAnchorElement>('[data-project-subnav-link]'),
    ),
  );
  const flowLinks = Array.from(
    root.querySelectorAll<HTMLAnchorElement>('[data-project-subnav-link]'),
  );
  const scrollers = navs
    .map((nav) => nav.querySelector<HTMLElement>('.page-shell'))
    .filter((scroller): scroller is HTMLElement => Boolean(scroller));

  const getHeaderHeight = () => {
    const value = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--header-height-scrolled',
      ),
    );
    return Number.isFinite(value) ? value : 0;
  };

  const updateScrollIndicators = () => {
    for (const nav of navs) {
      const scroller = nav.querySelector<HTMLElement>('.page-shell');
      if (!scroller) continue;
      const max = scroller.scrollWidth - scroller.clientWidth;
      nav.dataset.canScrollRight = String(
        max > 4 && scroller.scrollLeft < max - 4,
      );
    }
  };

  // La representación fija es una capa de viewport; la de flujo actúa
  // como referencia geométrica y conserva el espacio natural del documento.
  let isFixed = false;

  const setFixed = (next: boolean) => {
    if (isFixed === next) return;

    isFixed = next;

    fixedRoot.classList.toggle('is-fixed-visible', next);
    root.classList.toggle('is-flow-hidden', next);

    fixedRoot.toggleAttribute('inert', !next);
    fixedRoot.setAttribute('aria-hidden', String(!next));

    root.toggleAttribute('inert', next);
    root.setAttribute('aria-hidden', String(next));
  };

  const pinThreshold = ScrollTrigger.create({
    trigger: root,
    start: () => `top top+=${Math.round(getHeaderHeight()) - 1}`,
    end: 'max',
    invalidateOnRefresh: true,
    onEnter: () => setFixed(true),
    onLeaveBack: () => setFixed(false),
    onRefresh: (self) => setFixed(self.scroll() >= self.start),
  });

  const sections = flowLinks
    .map((link) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return null;
      const section = document.getElementById(href.slice(1));
      return section ? { link, section } : null;
    })
    .filter((item) => item !== null);

  const setActiveLink = (activeLink: HTMLAnchorElement) => {
    const href = activeLink.getAttribute('href');
    links.forEach((link) => {
      const active = link.getAttribute('href') === href;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const getActivationOffset = () =>
    Math.round(getHeaderHeight() + root.offsetHeight + 2);

  const sectionTriggers = sections.map(({ link, section }, index) =>
    ScrollTrigger.create({
      trigger: section,
      start: () => `top top+=${getActivationOffset()}`,
      invalidateOnRefresh: true,
      onEnter: () => setActiveLink(link),
      onLeaveBack: () => {
        const previous = sections[Math.max(0, index - 1)];
        if (previous) setActiveLink(previous.link);
      },
    }),
  );

  const syncActiveLinkFromScroll = () => {
    if (sections.length === 0) return;
    const scrollPosition = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
    const maxScroll = ScrollTrigger.maxScroll(window);
    let activeIndex = 0;

    if (maxScroll > 0 && scrollPosition >= maxScroll - 2) {
      activeIndex = sections.length - 1;
    } else {
      sectionTriggers.forEach((sectionTrigger, index) => {
        if (scrollPosition >= sectionTrigger.start - 1) activeIndex = index;
      });
    }

    const activeSection = sections[activeIndex];
    if (activeSection) setActiveLink(activeSection.link);
  };

  const linkHandlers = links.map((link) => {
    const handleClick = (event: MouseEvent) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      event.preventDefault();
      const anchorOffset = Math.round(getHeaderHeight() + root.offsetHeight);
      const smoother = ScrollSmoother.get();

      if (window.location.hash !== href) {
        window.history.pushState(null, '', href);
      }
      setActiveLink(link);

      if (smoother) {
        const destination = Math.min(
          ScrollTrigger.maxScroll(window),
          smoother.offset(target, `top ${anchorOffset}px`),
        );
        const distance = Math.abs(destination - smoother.scrollTop());
        gsap.to(smoother, {
          scrollTop: destination,
          duration: gsap.utils.clamp(0.8, 1.6, distance / 2200),
          ease: 'power3.inOut',
          overwrite: 'auto',
          onComplete: syncActiveLinkFromScroll,
        });
        return;
      }

      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - anchorOffset;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    };
    link.addEventListener('click', handleClick);
    return { link, handleClick };
  });

  syncActiveLinkFromScroll();
  updateScrollIndicators();
  ScrollTrigger.addEventListener('refresh', syncActiveLinkFromScroll);
  ScrollTrigger.addEventListener('scrollEnd', syncActiveLinkFromScroll);
  scrollers.forEach((scroller) =>
    scroller.addEventListener('scroll', updateScrollIndicators, {
      passive: true,
    }),
  );
  window.addEventListener('resize', updateScrollIndicators, { passive: true });

  return () => {
    sectionTriggers.forEach((trigger) => trigger.kill());
    pinThreshold.kill();
    linkHandlers.forEach(({ link, handleClick }) =>
      link.removeEventListener('click', handleClick),
    );
    scrollers.forEach((scroller) =>
      scroller.removeEventListener('scroll', updateScrollIndicators),
    );
    window.removeEventListener('resize', updateScrollIndicators);
    ScrollTrigger.removeEventListener('refresh', syncActiveLinkFromScroll);
    ScrollTrigger.removeEventListener('scrollEnd', syncActiveLinkFromScroll);
    navs.forEach((nav) => delete nav.dataset.canScrollRight);
  };
}
