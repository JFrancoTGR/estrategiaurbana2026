import GLightbox from 'glightbox';

const DEFAULT_REVEAL_BATCH = 4;

interface GalleryItem {
  href: string;
  alt: string;
}

export function initDeliveredProjects(root: HTMLElement) {
  const moreButton = root.querySelector<HTMLButtonElement>(
    '[data-delivered-projects-more]',
  );

  const projects = Array.from(
    root.querySelectorAll<HTMLElement>('[data-delivered-project]'),
  );

  const revealBatch = Number(root.dataset.revealBatch) || DEFAULT_REVEAL_BATCH;

  let activeLightbox: ReturnType<typeof GLightbox> | null = null;

  /* ------------------------------
     Progressive reveal
  ------------------------------ */

  const getHiddenProjects = () =>
    projects.filter((project) => project.hasAttribute('data-reveal-hidden'));

  const updateButton = () => {
    if (!moreButton) {
      return;
    }

    moreButton.hidden = getHiddenProjects().length === 0;
  };

  const revealNextBatch = () => {
    const batch = getHiddenProjects().slice(0, revealBatch);

    batch.forEach((project) => {
      project.removeAttribute('data-reveal-hidden');
    });

    root.dispatchEvent(
      new CustomEvent('projects:revealed', {
        detail: {
          cards: batch,
        },
      }),
    );

    updateButton();
  };

  /* ------------------------------
     Gallery
  ------------------------------ */

  const openGallery = (card: HTMLElement) => {
    const rawGallery = card.dataset.gallery;

    if (!rawGallery) {
      return;
    }

    let gallery: GalleryItem[];

    try {
      gallery = JSON.parse(rawGallery);
    } catch {
      return;
    }

    if (!gallery.length) {
      return;
    }

    activeLightbox?.destroy();

    const lightboxElements = gallery.map((item) => ({
      href: item.href,
      type: 'image',
      title: item.alt,
    }));

    activeLightbox = GLightbox({
      /*
       * GLightbox 3.3.1 tipa incorrectamente `elements`
       * como una tupla vacía (`[]`), aunque su API
       * soporta arrays de configuración de slides.
       */
      elements: lightboxElements as any,

      touchNavigation: true,
      keyboardNavigation: true,
      loop: false,
    });

    activeLightbox.open();
  };

  const handleGalleryClick = (event: Event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const trigger = target.closest<HTMLElement>('[data-gallery-trigger]');

    if (!trigger || !root.contains(trigger)) {
      return;
    }

    const card = trigger.closest<HTMLElement>('[data-delivered-project-card]');

    if (!card) {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    requestAnimationFrame(() => {
      openGallery(card);
    });
  };

  /* ------------------------------
     Events
  ------------------------------ */

  moreButton?.addEventListener('click', revealNextBatch);

  root.addEventListener('click', handleGalleryClick);

  updateButton();

  return () => {
    moreButton?.removeEventListener('click', revealNextBatch);

    root.removeEventListener('click', handleGalleryClick);

    activeLightbox?.destroy();

    activeLightbox = null;
  };
}
