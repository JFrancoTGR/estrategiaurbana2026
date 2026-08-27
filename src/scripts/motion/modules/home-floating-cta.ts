export function init(root: HTMLElement) {
  const trigger =
    document.querySelector<HTMLElement>("#home-projects-intro");

  if (!trigger) return;

  const visibleClass = "is-visible";

  /*
   * La línea de activación está al 90% del viewport.
   * Cuando el inicio de la siguiente sección supera esa línea,
   * significa que aproximadamente un 10% del viewport ya contiene
   * dicha sección.
   */
  const activationPoint = () => window.innerHeight * 0.9;

  const hasPassedTrigger = () =>
    trigger.getBoundingClientRect().top <= activationPoint();

  const showCTA = () => {
    root.classList.add(visibleClass);
  };

  /*
   * Importante:
   * Si motion se inicializa cuando el usuario ya pasó el trigger
   * —restauración de scroll, futura View Transition, etc.—,
   * mostramos inmediatamente el CTA.
   */
  if (hasPassedTrigger()) {
    showCTA();

    return () => {
      root.classList.remove(visibleClass);
    };
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;

      showCTA();

      /*
       * Es un trigger one-shot.
       * Una vez visible, el CTA deja de depender de esta sección.
       */
      observer.disconnect();
    },
    {
      threshold: 0,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  observer.observe(trigger);

  return () => {
    observer.disconnect();
    root.classList.remove(visibleClass);
  };
}