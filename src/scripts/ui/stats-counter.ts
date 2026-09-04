type StatCounter = {
  element: HTMLElement;
  target: number;
  formatter: Intl.NumberFormat;
};

const DURATION = 1100;

const easeOutCubic = (
  progress: number,
) => {
  return 1 - Math.pow(
    1 - progress,
    3,
  );
};

export function initStatsCounter(
  root: HTMLElement,
) {
  const elements = [
    ...root.querySelectorAll<HTMLElement>(
      '[data-stat-value]',
    ),
  ];

  if (!elements.length) {
    return;
  }

  const counters: StatCounter[] =
    elements.flatMap((element) => {
      const target =
        Number(element.dataset.value);

      if (!Number.isFinite(target)) {
        return [];
      }

      const minimumIntegerDigits =
        Number(
          element.dataset
            .minimumIntegerDigits ?? 1,
        );

      const minimumFractionDigits =
        Number(
          element.dataset
            .minimumFractionDigits ?? 0,
        );

      const maximumFractionDigits =
        Number(
          element.dataset
            .maximumFractionDigits ?? 0,
        );

      const useGrouping =
        element.dataset.useGrouping !==
        'false';

      const formatter =
        new Intl.NumberFormat('es-MX', {
          minimumIntegerDigits,

          minimumFractionDigits,

          maximumFractionDigits,

          useGrouping,
        });

      return [
        {
          element,
          target,
          formatter,
        },
      ];
    });

  if (!counters.length) {
    return;
  }

  const prefersReducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

  const renderFinalValues = () => {
    counters.forEach(
      ({
        element,
        target,
        formatter,
      }) => {
        element.textContent =
          formatter.format(target);
      },
    );
  };

  /*
   * Reduced motion mantiene
   * siempre la información final.
   */
  if (prefersReducedMotion) {
    renderFinalValues();

    return;
  }

  /*
   * El HTML viene del servidor con
   * el valor real como fallback.
   *
   * Una vez inicializado JS,
   * preparamos el estado inicial.
   */
  counters.forEach(
    ({
      element,
      formatter,
    }) => {
      element.textContent =
        formatter.format(0);
    },
  );

  let animationFrame = 0;

  let started = false;

  const startCounter = () => {
    if (started) {
      return;
    }

    started = true;

    const startTime =
      performance.now();

    const tick = (
      currentTime: number,
    ) => {
      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(
          elapsed / DURATION,
          1,
        );

      const eased =
        easeOutCubic(progress);

      counters.forEach(
        ({
          element,
          target,
          formatter,
        }) => {
          const current =
            target * eased;

          element.textContent =
            formatter.format(current);
        },
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(tick);

        return;
      }

      /*
       * Garantizamos que el último
       * repaint sea exactamente
       * el valor configurado.
       */
      renderFinalValues();
    };

    animationFrame =
      requestAnimationFrame(tick);
  };

  const observer =
    new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        startCounter();

        observer.disconnect();
      },
      {
        threshold: 0.3,
      },
    );

  observer.observe(root);

  return () => {
    observer.disconnect();

    cancelAnimationFrame(
      animationFrame,
    );

    renderFinalValues();
  };
}