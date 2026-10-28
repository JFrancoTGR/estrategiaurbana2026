import GLightbox from 'glightbox';

export function initProjectGallery(root: HTMLElement) {
  const triggers = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-project-gallery-trigger]'),
  );

  if (!triggers.length) {
    return;
  }

  const elements = triggers
    .map((trigger) => {
      const href = trigger.dataset.galleryImage;

      if (!href) {
        return null;
      }

      return {
        href,
        type: 'image',
        alt: trigger.dataset.galleryAlt ?? '',
      };
    })
    .filter(Boolean);

  if (!elements.length) {
    return;
  }

  const lightbox = GLightbox({
    elements: elements as any,

    touchNavigation: true,
    keyboardNavigation: true,
    loop: false,
  });

  const handlers = triggers.map((trigger, index) => {
    const handleClick = () => {
      trigger.blur();

      requestAnimationFrame(() => {
        lightbox.openAt(index);
      });
    };

    trigger.addEventListener('click', handleClick);

    return {
      trigger,
      handleClick,
    };
  });

  return () => {
    handlers.forEach(({ trigger, handleClick }) => {
      trigger.removeEventListener('click', handleClick);
    });

    lightbox.destroy();
  };
}
