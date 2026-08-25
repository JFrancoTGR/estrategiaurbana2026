import { init as initHomeHero } from "./modules/home-hero";

export type MotionInitializer = (
  root: HTMLElement,
) => void | (() => void);

export const motionRegistry: Record<string, MotionInitializer> = {
  "home-hero": initHomeHero,
};