import { init as initHomeHero } from "./modules/home-hero";
import { init as initHomeFloatingCTA } from "./modules/home-floating-cta"

export type MotionInitializer = (
  root: HTMLElement,
) => void | (() => void);

export const motionRegistry: Record<string, MotionInitializer> = {
  "home-hero": initHomeHero,
  "home-floating-cta": initHomeFloatingCTA,
};