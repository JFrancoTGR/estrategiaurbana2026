import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

let smoother: ScrollSmoother | null = null;

export function initSmoothScroll() {
  const wrapper =
    document.querySelector<HTMLElement>("[data-smooth-wrapper]");

  const content =
    document.querySelector<HTMLElement>("[data-smooth-content]");

  if (!wrapper || !content) return;

  if (
    window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
  ) {
    return;
  }

  smoother?.kill();

  smoother = ScrollSmoother.create({
    wrapper,
    content,

    smooth: 1.2,

    effects: false,

    smoothTouch: 0,
  });

  return () => {
    smoother?.kill();
    smoother = null;
  };
}