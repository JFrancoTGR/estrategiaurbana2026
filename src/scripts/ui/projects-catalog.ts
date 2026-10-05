const DEFAULT_INITIAL_COUNT = 8;
const DEFAULT_REVEAL_BATCH = 4;

export function initProjectsCatalog(root: HTMLElement) {
  const marketSelect = root.querySelector<HTMLSelectElement>(
    '[data-project-filter="market"]',
  );

  const statusSelect = root.querySelector<HTMLSelectElement>(
    '[data-project-filter="status"]',
  );

  const moreButton = root.querySelector<HTMLButtonElement>(
    '[data-projects-more]',
  );

  const emptyState = root.querySelector<HTMLElement>('[data-projects-empty]');

  const cards = Array.from(
    root.querySelectorAll<HTMLElement>('[data-project-card]'),
  );

  if (!marketSelect || !statusSelect || !moreButton) {
    return;
  }

  const initialCount =
    Number(root.dataset.initialCount) || DEFAULT_INITIAL_COUNT;

  const batchSize = Number(root.dataset.revealBatch) || DEFAULT_REVEAL_BATCH;

  const getHiddenMatchingCards = () =>
    cards.filter(
      (card) => !card.hidden && card.hasAttribute('data-reveal-hidden'),
    );

  const updateButton = () => {
    moreButton.hidden = getHiddenMatchingCards().length === 0;
  };

  const applyFilters = () => {
    const market = marketSelect.value;

    const status = statusSelect.value;

    const matchingCards: HTMLElement[] = [];

    cards.forEach((card) => {
      const matchesMarket = market === 'all' || card.dataset.market === market;

      const matchesStatus = status === 'all' || card.dataset.status === status;

      const matches = matchesMarket && matchesStatus;

      card.hidden = !matches;

      card.removeAttribute('data-reveal-hidden');

      if (matches) {
        matchingCards.push(card);
      }
    });

    matchingCards.forEach((card, index) => {
      if (index >= initialCount) {
        card.setAttribute('data-reveal-hidden', '');
      }
    });

    const visibleCards = matchingCards.slice(0, initialCount);

    if (emptyState) {
      emptyState.hidden = matchingCards.length > 0;
    }

    updateButton();

    root.dispatchEvent(
      new CustomEvent('projects:filtered', {
        detail: {
          cards: visibleCards,

          market,
          status,

          visibleCount: visibleCards.length,

          totalMatches: matchingCards.length,
        },
      }),
    );
  };

  const revealNextBatch = () => {
    const batch = getHiddenMatchingCards().slice(0, batchSize);

    batch.forEach((card) => {
      card.removeAttribute('data-reveal-hidden');
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

  marketSelect.addEventListener('change', applyFilters);

  statusSelect.addEventListener('change', applyFilters);

  moreButton.addEventListener('click', revealNextBatch);

  /*
   * No llamamos applyFilters()
   * durante initialization.
   *
   * Astro ya entregó las primeras
   * ocho cards correctamente visibles.
   */
  updateButton();

  return () => {
    marketSelect.removeEventListener('change', applyFilters);

    statusSelect.removeEventListener('change', applyFilters);

    moreButton.removeEventListener('click', revealNextBatch);
  };
}
