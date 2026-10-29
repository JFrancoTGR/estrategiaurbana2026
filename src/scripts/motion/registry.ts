import { init as initEditorialReveal } from './modules/editorial-reveal';
import { init as initHomeHero } from './modules/home-hero';
import { init as initHomeFloatingCTA } from './modules/home-floating-cta';
import { init as initHomeProjectsIntro } from './modules/home-projects-intro';
import { init as initHomeProjectsGrid } from './modules/home-projects-grid';
import { init as initHomePartners } from './modules/home-partners';
import { init as initHomeManifesto } from './modules/home-manifesto';
import { init as initHomeDeliveredProjects } from './modules/home-delivered-projects';
import { init as initPartnersGrid } from './modules/partners-grid';
import { init as initProjectHero } from './modules/project-hero';

import { init as initZoneHero } from './modules/zone-hero';
import { init as initProjectsListingHero } from './modules/project-listing-hero';
import { init as initProjectsGrid } from './modules/projects-grid';

export type MotionInitializer = (root: HTMLElement) => void | (() => void);

export const motionRegistry: Record<string, MotionInitializer> = {
  'home-hero': initHomeHero,
  'home-floating-cta': initHomeFloatingCTA,
  'home-projects-intro': initHomeProjectsIntro,
  'home-projects-grid': initHomeProjectsGrid,
  'home-partners': initHomePartners,
  'home-team-intro': initEditorialReveal,
  'home-manifesto': initHomeManifesto,
  'home-delivered-projects': initHomeDeliveredProjects,
  'home-zones-intro': initEditorialReveal,

  'zone-hero': initZoneHero,
  'section-hero': initProjectsListingHero,

  'projects-grid': initProjectsGrid,
  'partners-grid': initPartnersGrid,
  'project-hero': initProjectHero,
  'project-intro': initEditorialReveal,
  'project-location': initEditorialReveal,
  'project-amenities': initEditorialReveal,
  'project-gallery': initEditorialReveal,
};
