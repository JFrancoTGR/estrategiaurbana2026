type Cleanup = () => void;

type PageInitializer = () => void | Cleanup;

export function mountOnPageLoad(initializer: PageInitializer) {
  let cleanup: Cleanup | undefined;

  const destroy = () => {
    cleanup?.();
    cleanup = undefined;
  };

  const mount = () => {
    destroy();

    const result = initializer();

    if (typeof result === 'function') {
      cleanup = result;
    }
  };

  document.addEventListener('astro:before-swap', destroy);

  document.addEventListener('astro:page-load', mount);
}

export function mountPageUI<T extends HTMLElement>(
  selector: string,
  initializer: (root: T) => void | Cleanup,
) {
  mountOnPageLoad(() => {
    const root = document.querySelector<T>(selector);

    if (!root) {
      return;
    }

    return initializer(root);
  });
}
