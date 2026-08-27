let initialized = false;

export function initProjectStatusBadges() {
  if (initialized) return;

  initialized = true;

  const badges =
    document.querySelectorAll<HTMLButtonElement>(
      '[data-project-status]',
    );

  const isTouchLike =
    window.matchMedia('(hover: none), (pointer: coarse)');

  badges.forEach((badge) => {
    badge.addEventListener('click', () => {
      if (!isTouchLike.matches) return;

      const isExpanded =
        badge.classList.toggle('is-expanded');

      badge.setAttribute(
        'aria-expanded',
        String(isExpanded),
      );
    });
  });
}