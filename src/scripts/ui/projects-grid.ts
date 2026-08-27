export function initProjectsGrid(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('[data-projects-more]');

  if (!button) return;

  const batchSize = Number(root.dataset.revealBatch) || 4;

  const getHiddenCards = () =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-hidden]'));

  const updateButton = () => {
    button.hidden = getHiddenCards().length === 0;
  };

  const revealNextBatch = () => {
    const batch = getHiddenCards().slice(0, batchSize);

    batch.forEach((card) => {
      card.removeAttribute('data-reveal-hidden');
    });

    /*
     * Motion podrá escuchar este evento
     * posteriormente sin acoplar GSAP
     * a esta lógica funcional.
     */
    root.dispatchEvent(
      new CustomEvent('projects:revealed', {
        detail: {
          cards: batch,
        },
      }),
    );

    updateButton();
  };

  button.addEventListener('click', revealNextBatch);

  updateButton();

  return () => {
    button.removeEventListener('click', revealNextBatch);
  };
}
