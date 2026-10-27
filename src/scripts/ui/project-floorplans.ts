import GLightbox from 'glightbox';

export function initProjectFloorplans(root: HTMLElement) {
  const options = Array.from(
    root.querySelectorAll<HTMLButtonElement>(
      '[data-floorplan-option]',
    ),
  );

  const panels = Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-floorplan-panel]',
    ),
  );

  if (!options.length || !panels.length) {
    return;
  }

  let activeIndex = 0;

  let activeLightbox: ReturnType<typeof GLightbox> | null = null;

  const isMobile = () =>
    window.matchMedia('(max-width: 767px)').matches;

  /* ------------------------------
     Active floorplan
  ------------------------------ */

  const setActive = (index: number) => {
    activeIndex = index;

    options.forEach((option, optionIndex) => {
      const active = optionIndex === index;

      option.classList.toggle('is-active', active);

      option.setAttribute(
        'aria-selected',
        active ? 'true' : 'false',
      );
    });

    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;

      panel.classList.toggle('is-active', active);

      panel.setAttribute(
        'aria-hidden',
        active ? 'false' : 'true',
      );
    });
  };

  /* ------------------------------
     Mobile GLightbox
  ------------------------------ */

  const openMobileFloorplan = (
    option: HTMLButtonElement,
  ) => {
    const href = option.dataset.floorplanImage;

    if (!href) {
      return;
    }

    const title =
      option.dataset.floorplanTitle ?? '';

    const variant =
      option.dataset.floorplanVariant ?? '';

    activeLightbox?.destroy();

    activeLightbox = GLightbox({
      /*
       * GLightbox 3.3.1 tipa incorrectamente
       * `elements` como una tupla vacía,
       * aunque soporta arrays de slides.
       */
      elements: [
        {
          href,
          type: 'image',
          title,
          description: variant,          
        },
      ] as any,

      descPosition: 'top',
      
      touchNavigation: true,
      keyboardNavigation: true,
      loop: false,
    });

    activeLightbox.open();
  };

  /* ------------------------------
     Events
  ------------------------------ */

  const handleOptionClick = (event: Event) => {
    const option = event.currentTarget;

    if (!(option instanceof HTMLButtonElement)) {
      return;
    }

    const index = Number(
      option.dataset.floorplanIndex,
    );

    if (!Number.isFinite(index)) {
      return;
    }

    setActive(index);

    if (!isMobile()) {
      return;
    }

    /*
     * Igual que en DeliveredProjects:
     * liberamos el focus antes de insertar
     * el overlay de GLightbox.
     */
    option.blur();

    requestAnimationFrame(() => {
      openMobileFloorplan(option);
    });
  };

  options.forEach((option) => {
    option.addEventListener(
      'click',
      handleOptionClick,
    );
  });

  setActive(activeIndex);

  /* ------------------------------
     Cleanup
  ------------------------------ */

  return () => {
    options.forEach((option) => {
      option.removeEventListener(
        'click',
        handleOptionClick,
      );
    });

    activeLightbox?.destroy();

    activeLightbox = null;
  };
}