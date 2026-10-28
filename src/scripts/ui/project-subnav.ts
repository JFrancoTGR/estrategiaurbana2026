import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

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

  const links = Array.from(
    root.querySelectorAll<HTMLAnchorElement>('[data-project-subnav-link]'),
  );

  if (!smoothContent) {
    return;
  }

  /*
   * =========================
   * MOBILE SCROLL INDICATOR
   * =========================
   */

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

  /*
   * =========================
   * SUBNAV PIN
   * =========================
   */

  const trigger = ScrollTrigger.create({
    trigger: root,

    start: `top top+=${pinOffset}`,

    endTrigger: smoothContent,
    end: 'bottom bottom',

    pin: true,
    pinSpacing: false,

    invalidateOnRefresh: true,
  });

  /*
   * =========================
   * INTERNAL ANCHOR NAVIGATION
   * =========================
   *
   * No dejamos que el navegador procese
   * los hashes de forma nativa porque el
   * contenido está administrado por
   * ScrollSmoother.
   *
   * ScrollSmoother.scrollTo() mantiene
   * sincronizados:
   *
   * - scroll nativo
   * - transform del smooth-content
   * - ScrollTrigger
   * - elementos pinned
   */

  const linkHandlers = links.map((link) => {
    const handleClick = (event: MouseEvent) => {
      const href = link.getAttribute('href');

      if (!href || !href.startsWith('#')) {
        return;
      }

      const target = document.querySelector<HTMLElement>(href);

      if (!target) {
        return;
      }

      event.preventDefault();

      /*
       * Calculamos el offset en el momento
       * del click para no depender de una
       * altura capturada antes de posibles
       * cambios responsive.
       */
      const currentHeaderHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--header-height-scrolled',
        ),
      );

      const safeHeaderHeight = Number.isFinite(currentHeaderHeight)
        ? currentHeaderHeight
        : 0;

      const anchorOffset = Math.round(safeHeaderHeight + root.offsetHeight);

      const smoother = ScrollSmoother.get();

      /*
       * Actualizamos el hash manualmente.
       * De esta forma conservamos URLs como:
       *
       * /proyectos/naos-resort-living#location
       *
       * sin provocar el salto nativo.
       */
      if (window.location.hash !== href) {
        window.history.pushState(null, '', href);
      }

      /*
       * Marcamos visualmente el link
       * seleccionado inmediatamente.
       */
      links.forEach((item) => {
        item.classList.toggle('is-active', item === link);
      });

      if (smoother) {
        const destination = Math.min(
          ScrollTrigger.maxScroll(window),
          smoother.offset(target, `top ${anchorOffset}px`),
        );

        const currentScroll = smoother.scrollTop();

        const distance = Math.abs(destination - currentScroll);

        const duration = gsap.utils.clamp(0.8, 1.6, distance / 2200);

        gsap.to(smoother, {
          scrollTop: destination,
          duration,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });

        return;
      }

      /*
       * Fallback por si ScrollSmoother
       * está deshabilitado, por ejemplo
       * prefers-reduced-motion.
       */
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - anchorOffset;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    };

    link.addEventListener('click', handleClick);

    return {
      link,
      handleClick,
    };
  });

  const syncActiveLinkFromHash = () => {
    const currentHash = window.location.hash || '#project';

    links.forEach((link) => {
      const href = link.getAttribute('href');

      link.classList.toggle('is-active', href === currentHash);
    });
  };

  /*
   * =========================
   * INITIAL STATE
   * =========================
   */

  syncActiveLinkFromHash();
  updateScrollIndicator();

  scroller?.addEventListener('scroll', updateScrollIndicator, {
    passive: true,
  });

  window.addEventListener('resize', updateScrollIndicator, {
    passive: true,
  });

  window.addEventListener('hashchange', syncActiveLinkFromHash);

  /*
   * =========================
   * CLEANUP
   * =========================
   */

  return () => {
    trigger.kill();

    linkHandlers.forEach(({ link, handleClick }) => {
      link.removeEventListener('click', handleClick);
    });

    scroller?.removeEventListener('scroll', updateScrollIndicator);

    window.removeEventListener('resize', updateScrollIndicator);

    window.removeEventListener('hashchange', syncActiveLinkFromHash);

    delete root.dataset.canScrollRight;
  };
}
