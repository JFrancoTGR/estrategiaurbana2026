import { init as initHomeHero } from "./modules/home-hero";
import { init as initHomeFloatingCTA } from "./modules/home-floating-cta";
import { init as initHomeProjectsIntro } from "./modules/home-projects-intro";
import { init as initHomeProjectsGrid } from "./modules/home-projects-grid";
import { init as initHomePartners } from "./modules/home-partners";

export type MotionInitializer = (
  root: HTMLElement,
) => void | (() => void);

export const motionRegistry: Record<string, MotionInitializer> = {
  "home-hero": initHomeHero,
  "home-floating-cta": initHomeFloatingCTA,
  "home-projects-intro": initHomeProjectsIntro,
  "home-projects-grid": initHomeProjectsGrid,
  "home-partners": initHomePartners,
};