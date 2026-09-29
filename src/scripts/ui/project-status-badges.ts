export function initProjectStatusBadges(root: ParentNode = document) {
  const badges = root.querySelectorAll<HTMLButtonElement>(
    '[data-project-status]',
  );

  const isTouchLike = window.matchMedia('(hover: none), (pointer: coarse)');

  const cleanups: Array<() => void> = [];

  badges.forEach((badge) => {
    const handleClick = () => {
      if (!isTouchLike.matches) {
        return;
      }

      const isExpanded = badge.classList.toggle('is-expanded');

      badge.setAttribute('aria-expanded', String(isExpanded));
    };

    badge.addEventListener('click', handleClick);

    cleanups.push(() => {
      badge.removeEventListener('click', handleClick);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
