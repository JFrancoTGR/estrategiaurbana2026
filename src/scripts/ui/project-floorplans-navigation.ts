export function initProjectFloorplansNavigation(root: HTMLElement): () => void {
  const shell = root.querySelector<HTMLElement>(
    '[data-floorplan-selector-shell]',
  );
  const selector = root.querySelector<HTMLElement>(
    '[data-floorplan-selector-scroll]',
  );
  const viewer = root.querySelector<HTMLElement>('.project-floorplans__viewer');
  const up = root.querySelector<HTMLButtonElement>('[data-floorplan-nav-up]');
  const down = root.querySelector<HTMLButtonElement>(
    '[data-floorplan-nav-down]',
  );

  if (!shell || !selector || !viewer || !up || !down) return () => {};

  const desktop = window.matchMedia('(min-width: 768px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EPSILON = 2;
  let frame = 0;

  const updateControls = () => {
    const maxScroll = Math.max(
      0,
      selector.scrollHeight - selector.clientHeight,
    );
    const overflowing = desktop.matches && maxScroll > EPSILON;
    const atTop = selector.scrollTop <= EPSILON;
    const atBottom = selector.scrollTop >= maxScroll - EPSILON;

    up.hidden = !overflowing || atTop;
    down.hidden = !overflowing || atBottom;
  };

  const measure = () => {
    frame = 0;

    if (!desktop.matches) {
      selector.style.removeProperty('max-height');
      selector.scrollTop = 0;
      up.hidden = true;
      down.hidden = true;
      return;
    }

    // El viewer ya contiene todos los panels superpuestos en una misma celda.
    // getBoundingClientRect recoge su altura real (incluido el panel más alto).
    const height = viewer.getBoundingClientRect().height;
    if (height <= 0) return;

    selector.style.maxHeight = `${height}px`;
    updateControls();
  };

  const scheduleMeasure = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  };

  const move = (direction: -1 | 1) => {
    // Un avance de aproximadamente 75% conserva parte de la lista anterior
    // como referencia contextual. Scroll nativo permite wheel/touch/keyboard.
    selector.scrollBy({
      top: direction * Math.max(96, Math.round(selector.clientHeight * 0.75)),
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  };

  const goUp = () => move(-1);
  const goDown = () => move(1);
  const ensureActiveVisible = (event: Event) => {
    const target = event.target;
    if (
      !(target instanceof Element) ||
      !target.closest('[data-floorplan-option]')
    )
      return;
    // El cambio de tab lo gestiona el módulo existente.
    // Alineamos el tab pulsado si queda parcialmente fuera del viewport.
    if (!desktop.matches) return;
    const option = target.closest<HTMLElement>('[data-floorplan-option]');
    if (!option) return;
    const upper = option.offsetTop - selector.offsetTop;
    const lower = upper + option.offsetHeight;
    const visibleTop = selector.scrollTop;
    const visibleBottom = visibleTop + selector.clientHeight;
    const destination =
      upper < visibleTop
        ? upper
        : lower > visibleBottom
          ? lower - selector.clientHeight
          : null;
    if (destination !== null) {
      selector.scrollTo({
        top: destination,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }
  };

  up.addEventListener('click', goUp);
  down.addEventListener('click', goDown);
  selector.addEventListener('scroll', updateControls, { passive: true });
  selector.addEventListener('click', ensureActiveVisible);
  desktop.addEventListener('change', scheduleMeasure);

  const observer = new ResizeObserver(scheduleMeasure);
  observer.observe(viewer);
  observer.observe(shell);

  // Una imagen lazy puede modificar la altura medida al terminar de cargar.
  viewer.querySelectorAll('img').forEach((img) => {
    img.addEventListener('load', scheduleMeasure);
  });

  scheduleMeasure();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    up.removeEventListener('click', goUp);
    down.removeEventListener('click', goDown);
    selector.removeEventListener('scroll', updateControls);
    selector.removeEventListener('click', ensureActiveVisible);
    desktop.removeEventListener('change', scheduleMeasure);
    viewer.querySelectorAll('img').forEach((img) => {
      img.removeEventListener('load', scheduleMeasure);
    });
    selector.style.removeProperty('max-height');
  };
}
