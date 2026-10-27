export function initProjectFloorplans(root: HTMLElement) {
  const options = root.querySelectorAll<HTMLButtonElement>(
    '[data-floorplan-option]',
  );

  const panels = root.querySelectorAll<HTMLElement>('[data-floorplan-panel]');

  const modal = root.querySelector<HTMLElement>('[data-floorplan-modal]');

  const modalPanels = root.querySelectorAll<HTMLElement>(
    '[data-floorplan-modal-panel]',
  );

  const closeButtons = root.querySelectorAll<HTMLButtonElement>(
    '[data-floorplan-close]',
  );

  if (!options.length || !panels.length) {
    return;
  }

  let activeIndex = 0;

  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

  const setActive = (index: number) => {
    activeIndex = index;

    options.forEach((option, optionIndex) => {
      const active = optionIndex === index;

      option.classList.toggle('is-active', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;

      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  };

  const setModalPanel = (index: number) => {
    modalPanels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;

      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  };

  const openModal = (index: number) => {
    if (!modal) {
      return;
    }

    setModalPanel(index);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    document.documentElement.classList.add('floorplan-modal-open');
  };

  const closeModal = () => {
    if (!modal) {
      return;
    }

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    document.documentElement.classList.remove('floorplan-modal-open');
  };

  const handleOptionClick = (event: Event) => {
    const option = event.currentTarget as HTMLButtonElement;

    const index = Number(option.dataset.floorplanIndex);

    if (!Number.isFinite(index)) {
      return;
    }

    setActive(index);

    if (isMobile()) {
      openModal(index);
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  options.forEach((option) => {
    option.addEventListener('click', handleOptionClick);
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', handleKeydown);

  setActive(activeIndex);

  return () => {
    options.forEach((option) => {
      option.removeEventListener('click', handleOptionClick);
    });

    closeButtons.forEach((button) => {
      button.removeEventListener('click', closeModal);
    });

    document.removeEventListener('keydown', handleKeydown);

    document.documentElement.classList.remove('floorplan-modal-open');
  };
}
