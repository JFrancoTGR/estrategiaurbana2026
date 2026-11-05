import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export function initProjectSubnav(root: HTMLElement) {
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
   * HEADER HEIGHT
   * =========================
   *
   * Centralizamos la lectura de la
   * altura del header.
   *
   * El valor se consulta dinámicamente
   * para contemplar cambios responsive
   * y recalculaciones de ScrollTrigger.
   */

  const getHeaderHeight = () => {
    const value = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--header-height-scrolled',
      ),
    );

    return Number.isFinite(value) ? value : 0;
  };

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
   *
   * El offset se recalcula durante
   * los refresh de ScrollTrigger.
   *
   * Esto evita utilizar alturas
   * obsoletas después de cambios
   * de viewport o breakpoints.
   */

  const trigger = ScrollTrigger.create({
    trigger: root,

    start: () => `top top+=${Math.round(getHeaderHeight()) - 1}`,

    endTrigger: smoothContent,
    end: 'bottom bottom',

    pin: true,
    pinSpacing: false,

    invalidateOnRefresh: true,
  });

  /*
   * =========================
   * ACTIVE SECTION TRACKING
   * =========================
   *
   * El estado activo responde a la
   * posición real del scroll.
   *
   * No depende del hash de la URL.
   *
   * Solo se consideran las secciones
   * que tienen un enlace renderizado
   * dinámicamente en el subnav.
   */

  const sections = links
    .map((link) => {
      const href = link.getAttribute('href');

      if (!href?.startsWith('#')) {
        return null;
      }

      const section = document.getElementById(href.slice(1));

      return section ? { link, section } : null;
    })
    .filter((item) => item !== null);

  /*
   * =========================
   * ACTIVE LINK STATE
   * =========================
   *
   * Centralizamos la actualización
   * visual y semántica del enlace.
   */

  const setActiveLink = (activeLink: HTMLAnchorElement) => {
    links.forEach((link) => {
      const isActive = link === activeLink;

      link.classList.toggle('is-active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  /*
   * =========================
   * ACTIVATION OFFSET
   * =========================
   *
   * La línea de activación se sitúa
   * inmediatamente debajo del header
   * y del subnav.
   */

  const getActivationOffset = () => {
    return Math.round(getHeaderHeight() + root.offsetHeight + 2);
  };

  /*
   * =========================
   * SECTION SCROLL TRIGGERS
   * =========================
   *
   * onEnter:
   * Activa la sección al entrar
   * desde arriba.
   *
   * onLeaveBack:
   * Recupera la sección anterior
   * cuando regresamos haciendo scroll.
   *
   * Los offsets se recalculan
   * durante los refresh.
   */

  const sectionTriggers = sections.map(({ link, section }, index) =>
    ScrollTrigger.create({
      trigger: section,

      start: () => `top top+=${getActivationOffset()}`,

      invalidateOnRefresh: true,

      onEnter: () => {
        setActiveLink(link);
      },

      onLeaveBack: () => {
        const previous = sections[Math.max(0, index - 1)];

        if (previous) {
          setActiveLink(previous.link);
        }
      },
    }),
  );

  /*
   * =========================
   * SCROLL STATE SYNCHRONIZATION
   * =========================
   *
   * Determinamos la sección activa
   * utilizando la posición real
   * del documento.
   *
   * Esta función se ejecuta:
   *
   * - Durante la inicialización.
   * - Después de un refresh.
   * - Cuando finaliza el scroll.
   *
   * No ejecutamos cálculos adicionales
   * continuamente durante el scroll.
   */

  const syncActiveLinkFromScroll = () => {
    if (sections.length === 0) {
      return;
    }

    const scrollPosition = trigger.scroll();

    const maxScroll = ScrollTrigger.maxScroll(window);

    let activeIndex = 0;

    /*
     * Caso especial:
     *
     * Si alcanzamos el final del documento,
     * activamos la última sección disponible.
     *
     * Esto contempla secciones finales
     * pequeñas o viewports muy altos.
     */

    if (maxScroll > 0 && scrollPosition >= maxScroll - 2) {
      activeIndex = sections.length - 1;
    } else {
      /*
       * Comportamiento normal:
       *
       * Identificamos la última sección
       * cuyo inicio ya atravesó nuestra
       * línea de activación.
       */

      sectionTriggers.forEach((sectionTrigger, index) => {
        if (scrollPosition >= sectionTrigger.start - 1) {
          activeIndex = index;
        }
      });
    }

    const activeSection = sections[activeIndex];

    if (activeSection) {
      setActiveLink(activeSection.link);
    }
  };

  /*
   * =========================
   * INTERNAL ANCHOR NAVIGATION
   * =========================
   *
   * No dejamos que el navegador procese
   * los hashes de forma nativa porque
   * el contenido está administrado por
   * ScrollSmoother.
   *
   * ScrollSmoother mantiene sincronizados:
   *
   * - Scroll nativo.
   * - Transform del smooth-content.
   * - ScrollTrigger.
   * - Elementos pinned.
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
       * del clic para contemplar posibles
       * cambios responsive.
       */

      const anchorOffset = Math.round(getHeaderHeight() + root.offsetHeight);

      const smoother = ScrollSmoother.get();

      /*
       * Actualizamos el hash manualmente.
       *
       * Conservamos URLs como:
       *
       * /proyectos/naos-resort-living#location
       *
       * sin provocar saltos nativos.
       */

      if (window.location.hash !== href) {
        window.history.pushState(null, '', href);
      }

      /*
       * Activamos inmediatamente el enlace
       * seleccionado.
       *
       * Durante el desplazamiento animado,
       * los ScrollTriggers pueden actualizar
       * el indicador conforme atravesamos
       * las secciones intermedias.
       *
       * Conservamos intencionalmente
       * este comportamiento visual.
       */

      setActiveLink(link);

      /*
       * =========================
       * SCROLLSMOOTHER NAVIGATION
       * =========================
       */

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

          onComplete: syncActiveLinkFromScroll,
        });

        return;
      }

      /*
       * =========================
       * NATIVE SCROLL FALLBACK
       * =========================
       *
       * Para escenarios donde
       * ScrollSmoother esté deshabilitado,
       * por ejemplo prefers-reduced-motion.
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

  /*
   * =========================
   * INITIAL STATE
   * =========================
   *
   * Sincronizamos el estado inicial
   * y registramos los eventos globales
   * de ScrollTrigger.
   */

  syncActiveLinkFromScroll();

  updateScrollIndicator();

  /*
   * Recalcular estado activo después
   * de actualizaciones de geometría.
   */

  ScrollTrigger.addEventListener('refresh', syncActiveLinkFromScroll);

  /*
   * Verificar el estado final después
   * de cualquier desplazamiento.
   *
   * Esto protege contra posibles
   * inconsistencias durante saltos
   * grandes o scroll programático.
   */

  ScrollTrigger.addEventListener('scrollEnd', syncActiveLinkFromScroll);

  /*
   * Indicador de desplazamiento
   * horizontal para mobile.
   */

  scroller?.addEventListener('scroll', updateScrollIndicator, {
    passive: true,
  });

  window.addEventListener('resize', updateScrollIndicator, {
    passive: true,
  });

  /*
   * =========================
   * CLEANUP
   * =========================
   *
   * Destruimos todas las instancias
   * y eliminamos los listeners cuando
   * Astro desmonta la página.
   *
   * Evitamos estados residuales
   * durante la navegación transversal.
   */

  return () => {
    /*
     * Eliminar ScrollTriggers
     */

    sectionTriggers.forEach((sectionTrigger) => {
      sectionTrigger.kill();
    });

    trigger.kill();

    /*
     * Eliminar listeners de navegación
     */

    linkHandlers.forEach(({ link, handleClick }) => {
      link.removeEventListener('click', handleClick);
    });

    /*
     * Eliminar listeners del indicador
     * de scroll horizontal.
     */

    scroller?.removeEventListener('scroll', updateScrollIndicator);

    window.removeEventListener('resize', updateScrollIndicator);

    /*
     * Eliminar listeners globales
     * de ScrollTrigger.
     */

    ScrollTrigger.removeEventListener('refresh', syncActiveLinkFromScroll);

    ScrollTrigger.removeEventListener('scrollEnd', syncActiveLinkFromScroll);

    /*
     * Limpiar estado del componente
     */

    delete root.dataset.canScrollRight;
  };
}
