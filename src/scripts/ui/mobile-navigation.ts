export function initMobileNavigation(
  root: HTMLElement,
) {
  const toggle =
    root.querySelector<HTMLButtonElement>(
      "[data-menu-toggle]",
    );

  const navigation =
    root.querySelector<HTMLElement>(
      "[data-mobile-navigation]",
    );

  if (!toggle || !navigation) return;

  const links =
    navigation.querySelectorAll<HTMLAnchorElement>(
      "a",
    );

  const setOpen = (open: boolean) => {
    root.classList.toggle(
      "menu-is-open",
      open,
    );

    toggle.classList.toggle(
      "is-active",
      open,
    );

    navigation.classList.toggle(
      "is-open",
      open,
    );

    toggle.setAttribute(
      "aria-expanded",
      String(open),
    );

    toggle.setAttribute(
      "aria-label",
      open
        ? "Cerrar menú"
        : "Abrir menú",
    );

    navigation.setAttribute(
      "aria-hidden",
      String(!open),
    );

    document.documentElement.classList.toggle(
      "menu-open",
      open,
    );
  };

  const handleToggle = () => {
    const isOpen =
      toggle.getAttribute("aria-expanded") ===
      "true";

    setOpen(!isOpen);
  };

  const handleKeydown = (
    event: KeyboardEvent,
  ) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  toggle.addEventListener(
    "click",
    handleToggle,
  );

  links.forEach((link) => {
    link.addEventListener("click", () => {
      setOpen(false);
    });
  });

  document.addEventListener(
    "keydown",
    handleKeydown,
  );

  return () => {
    toggle.removeEventListener(
      "click",
      handleToggle,
    );

    document.removeEventListener(
      "keydown",
      handleKeydown,
    );

    setOpen(false);
  };
}