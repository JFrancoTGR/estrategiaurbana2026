import { motionRegistry } from "./registry";
import { initSmoothScroll } from "./global/smooth-scroll";

let cleanups: Array<() => void> = [];

export function destroyMotion() {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
}

export function initMotion() {
  destroyMotion();

  const smoothCleanup = initSmoothScroll();

  if (typeof smoothCleanup === "function") {
    cleanups.push(smoothCleanup);
  }

  const roots =
    document.querySelectorAll<HTMLElement>("[data-motion]");

  roots.forEach((root) => {
    const moduleName = root.dataset.motion;

    if (!moduleName) return;

    const initialize = motionRegistry[moduleName];

    if (!initialize) return;

    const cleanup = initialize(root);

    if (typeof cleanup === "function") {
      cleanups.push(cleanup);
    }
  });

  document.documentElement.classList.remove(
    "motion-preload",
  );
}