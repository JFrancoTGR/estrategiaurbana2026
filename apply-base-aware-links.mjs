import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changed = [];

function filePath(relativePath) {
  return path.join(root, ...relativePath.split('/'));
}

function read(relativePath) {
  const target = filePath(relativePath);

  if (!fs.existsSync(target)) {
    throw new Error(`No existe el archivo esperado: ${relativePath}`);
  }

  return fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
}

function write(relativePath, content) {
  const target = filePath(relativePath);

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');

  if (!changed.includes(relativePath)) {
    changed.push(relativePath);
  }
}

function replaceExact(relativePath, search, replacement, expectedCount = 1) {
  const source = read(relativePath);
  const count = source.split(search).length - 1;

  if (count !== expectedCount) {
    throw new Error(
      `${relativePath}: esperaba ${expectedCount} coincidencia(s), encontré ${count}.\n` +
      `Patrón:\n${search}`,
    );
  }

  write(relativePath, source.split(search).join(replacement));
}

function ensureReplaceExact(
  relativePath,
  search,
  replacement,
  alreadyApplied,
  expectedCount = 1,
) {
  const source = read(relativePath);

  if (source.includes(alreadyApplied)) {
    return;
  }

  const count = source.split(search).length - 1;

  if (count !== expectedCount) {
    throw new Error(
      `${relativePath}: esperaba ${expectedCount} coincidencia(s), encontré ${count}.\n` +
      `Patrón:\n${search}`,
    );
  }

  write(relativePath, source.split(search).join(replacement));
}

const utilityPath = 'src/utils/paths.ts';

const utilitySource = `const BASE_URL = import.meta.env.BASE_URL;

const normalizedBase =
  BASE_URL === '/' ? '' : BASE_URL.replace(/\\/+$/, '');

const hasExternalScheme = (path: string) =>
  /^[a-z][a-z\\d+.-]*:/i.test(path);

export function withBase(path: string): string {
  if (
    path.startsWith('#') ||
    path.startsWith('?') ||
    path.startsWith('//') ||
    hasExternalScheme(path)
  ) {
    return path;
  }

  if (path === '' || path === '/') {
    return \`\${normalizedBase}/\`;
  }

  const normalizedPath = \`/\${path.replace(/^\\/+/, '')}\`;

  if (
    normalizedBase &&
    (normalizedPath === normalizedBase ||
      normalizedPath.startsWith(\`\${normalizedBase}/\`))
  ) {
    return normalizedPath;
  }

  return \`\${normalizedBase}\${normalizedPath}\`;
}

export function withoutBase(pathname: string): string {
  if (!normalizedBase) {
    return pathname;
  }

  if (pathname === normalizedBase || pathname === \`\${normalizedBase}/\`) {
    return '/';
  }

  if (pathname.startsWith(\`\${normalizedBase}/\`)) {
    return pathname.slice(normalizedBase.length);
  }

  return pathname;
}
`;

write(utilityPath, utilitySource);

// ---------------------------------------------------------
// Main navbar: links + active state must ignore configured base.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/global/MainNavbar.astro',
  `import marca from '../../assets/img/logos/logo-marca.svg';

const pathname = Astro.url.pathname;`,
  `import marca from '../../assets/img/logos/logo-marca.svg';

import { withBase, withoutBase } from '../../utils/paths';

const pathname = withoutBase(Astro.url.pathname);`,
  `import { withBase, withoutBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/global/MainNavbar.astro',
  `<a href='/' class='brand' aria-label='Estrategia Urbana — Inicio'>`,
  `<a
      href={withBase('/')}
      class='brand'
      aria-label='Estrategia Urbana — Inicio'
    >`,
  `href={withBase('/')}`,
);

{
  const rel = 'src/components/global/MainNavbar.astro';
  let source = read(rel);

  if (!source.includes('href={withBase(item.href)}')) {
    const count = source.split('href={item.href}').length - 1;

    if (count !== 4) {
      throw new Error(`${rel}: esperaba 4 href={item.href}, encontré ${count}.`);
    }

    source = source.split('href={item.href}').join('href={withBase(item.href)}');
    write(rel, source);
  }
}

{
  const rel = 'src/components/global/MainNavbar.astro';
  let source = read(rel);

  if (!source.includes('href={withBase(href)}')) {
    const count = source.split('href={href}').length - 1;

    if (count !== 2) {
      throw new Error(`${rel}: esperaba 2 href={href}, encontré ${count}.`);
    }

    source = source.split('href={href}').join('href={withBase(href)}');
    write(rel, source);
  }
}

ensureReplaceExact(
  'src/components/global/MainNavbar.astro',
  `      <a
        href='/'
        class='mobile-navigation__brand'`,
  `      <a
        href={withBase('/')}
        class='mobile-navigation__brand'`,
  `href={withBase('/')}
        class='mobile-navigation__brand'`,
);

// ---------------------------------------------------------
// Global footer.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/global/Footer.astro',
  `import logo from '../../assets/img/logos/logo-marca.svg';`,
  `import logo from '../../assets/img/logos/logo-marca.svg';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/global/Footer.astro',
  `          href='/'`,
  `          href={withBase('/')}`,
  `href={withBase('/')}`,
);

ensureReplaceExact(
  'src/components/global/Footer.astro',
  `<a href={item.href} class='site-footer__navigation-link'>`,
  `<a
                  href={withBase(item.href)}
                  class='site-footer__navigation-link'
                >`,
  `href={withBase(item.href)}`,
);

ensureReplaceExact(
  'src/components/global/Footer.astro',
  `<a href='/contacto' class='site-footer__contact-link'>`,
  `<a
            href={withBase('/contacto')}
            class='site-footer__contact-link'
          >`,
  `href={withBase('/contacto')}`,
);

ensureReplaceExact(
  'src/components/global/Footer.astro',
  `<a href='/aviso-de-privacidad'> Aviso de privacidad </a>`,
  `<a href={withBase('/aviso-de-privacidad')}>
          Aviso de privacidad
        </a>`,
  `href={withBase('/aviso-de-privacidad')}`,
);

// ---------------------------------------------------------
// Base layout public asset.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/layouts/BaseLayout.astro',
  `import Footer from '../components/global/Footer.astro';`,
  `import Footer from '../components/global/Footer.astro';

import { withBase } from '../utils/paths';`,
  `import { withBase } from '../utils/paths';`,
);

ensureReplaceExact(
  'src/layouts/BaseLayout.astro',
  `<link rel='icon' type='image/svg+xml' href='/favicon.svg' />`,
  `<link
      rel='icon'
      type='image/svg+xml'
      href={withBase('/favicon.svg')}
    />`,
  `href={withBase('/favicon.svg')}`,
);

// ---------------------------------------------------------
// Project cards.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/cards/ProjectCard.astro',
  `import ProjectStatusBadge from '../ui/ProjectStatusBadge.astro';`,
  `import ProjectStatusBadge from '../ui/ProjectStatusBadge.astro';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/cards/ProjectCard.astro',
  `const { name, location, price, card } = project.data;`,
  `const { name, location, price, card } = project.data;

const projectHref = withBase(\`/proyectos/\${project.id}\`);`,
  `const projectHref = withBase(\`/proyectos/\${project.id}\`);`,
);

{
  const rel = 'src/components/cards/ProjectCard.astro';
  let source = read(rel);

  if (!source.includes('href={projectHref}')) {
    const search = 'href={`/proyectos/${project.id}`}';
    const count = source.split(search).length - 1;

    if (count !== 2) {
      throw new Error(`${rel}: esperaba 2 enlaces de proyecto, encontré ${count}.`);
    }

    source = source.split(search).join('href={projectHref}');
    write(rel, source);
  }
}

// ---------------------------------------------------------
// Home direct CTAs.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/sections/HomeHero.astro',
  `import type { ImageMetadata } from 'astro';`,
  `import type { ImageMetadata } from 'astro';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/HomeHero.astro',
  `<a href='/contacto' class='home-hero__cta' data-anim='cta'>`,
  `<a
        href={withBase('/contacto')}
        class='home-hero__cta'
        data-anim='cta'
      >`,
  `href={withBase('/contacto')}`,
);

ensureReplaceExact(
  'src/components/sections/HomeProjectsGrid.astro',
  `import ProjectCard from '../cards/ProjectCard.astro';`,
  `import ProjectCard from '../cards/ProjectCard.astro';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/HomeProjectsGrid.astro',
  `<a href='/proyectos-en-venta' class='home-projects-grid__all'>`,
  `<a
        href={withBase('/proyectos-en-venta')}
        class='home-projects-grid__all'
      >`,
  `href={withBase('/proyectos-en-venta')}`,
);

// ---------------------------------------------------------
// Generic hero CTAs.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/sections/SectionHero.astro',
  `import type { ImageMetadata } from 'astro';`,
  `import type { ImageMetadata } from 'astro';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/SectionHero.astro',
  `<a href={cta.href} class='section-hero__cta' data-anim='cta'>`,
  `<a
            href={withBase(cta.href)}
            class='section-hero__cta'
            data-anim='cta'
          >`,
  `href={withBase(cta.href)}`,
);

ensureReplaceExact(
  'src/components/sections/ProjectHero.astro',
  `import type { ImageMetadata } from 'astro';`,
  `import type { ImageMetadata } from 'astro';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/ProjectHero.astro',
  `<a href={cta.href} class='project-hero__cta' data-anim='cta'>`,
  `<a
                href={withBase(cta.href)}
                class='project-hero__cta'
                data-anim='cta'
              >`,
  `href={withBase(cta.href)}`,
);

// ---------------------------------------------------------
// Zone switcher.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/sections/ZoneSwitcher.astro',
  `import type { CollectionEntry } from 'astro:content';`,
  `import type { CollectionEntry } from 'astro:content';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/ZoneSwitcher.astro',
  `href={\`/zonas/\${zone.id}\`}`,
  `href={withBase(\`/zonas/\${zone.id}\`)}`,
  `href={withBase(\`/zonas/\${zone.id}\`)}`,
);

// ---------------------------------------------------------
// Event hrefs may be internal hashes or external URLs.
// withBase() deliberately preserves both.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/cards/EventCard.astro',
  `---\ninterface Props {`,
  `---\nimport { withBase } from '../../utils/paths';

interface Props {`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/cards/EventCard.astro',
  `href={event.href}`,
  `href={withBase(event.href)}`,
  `href={withBase(event.href)}`,
);

// ---------------------------------------------------------
// Existing BASE_URL concatenations become centralized too,
// avoiding dependence on a trailing slash in astro.config.
// ---------------------------------------------------------
ensureReplaceExact(
  'src/components/sections/HomePartners.astro',
  `import backgroundImage from '../../assets/img/home/partners-background.webp';`,
  `import backgroundImage from '../../assets/img/home/partners-background.webp';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/HomePartners.astro',
  `const partnersHref = \`\${import.meta.env.BASE_URL}socios-estrategicos\`;`,
  `const partnersHref = withBase('/socios-estrategicos');`,
  `const partnersHref = withBase('/socios-estrategicos');`,
);

ensureReplaceExact(
  'src/components/sections/HomeDeliveredProjects.astro',
  `import deliveredProjectsImage from '../../assets/img/home/delivered-projects.webp';`,
  `import deliveredProjectsImage from '../../assets/img/home/delivered-projects.webp';

import { withBase } from '../../utils/paths';`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/HomeDeliveredProjects.astro',
  `const portfolioHref = \`\${import.meta.env.BASE_URL}portafolio\`;`,
  `const portfolioHref = withBase('/portafolio');`,
  `const portfolioHref = withBase('/portafolio');`,
);

ensureReplaceExact(
  'src/components/sections/HomeVideo.astro',
  `---\nconst posterLoopWebm = \`\${import.meta.env.BASE_URL}media/home/manifesto/video/poster-loop.webm\`;\nconst posterLoopMp4 = \`\${import.meta.env.BASE_URL}media/home/manifesto/video/poster-loop.mp4\`;\nconst videoSrc = \`\${import.meta.env.BASE_URL}media/home/manifesto/video/manifesto-1080.mp4\`;\n---`,
  `---\nimport { withBase } from '../../utils/paths';\n\nconst posterLoopWebm = withBase(\n  '/media/home/manifesto/video/poster-loop.webm',\n);\nconst posterLoopMp4 = withBase(\n  '/media/home/manifesto/video/poster-loop.mp4',\n);\nconst videoSrc = withBase(\n  '/media/home/manifesto/video/manifesto-1080.mp4',\n);\n---`,
  `import { withBase } from '../../utils/paths';`,
);

ensureReplaceExact(
  'src/components/sections/HomeManifesto.astro',
  `---\nconst FRAME_COUNT = 185;\n\nconst sequenceBase = \`\${import.meta.env.BASE_URL}media/home/manifesto/sequence/desktop\`;\n\nconst posterSrc = \`\${sequenceBase}/frame-0001.webp\`;\n\nconst videoSrc = \`\${import.meta.env.BASE_URL}media/home/manifesto/video/manifesto-1080.mp4\`;\n---`,
  `---\nimport { withBase } from '../../utils/paths';\n\nconst FRAME_COUNT = 185;\n\nconst sequenceBase = withBase('/media/home/manifesto/sequence/desktop');\n\nconst posterSrc = \`\${sequenceBase}/frame-0001.webp\`;\n\nconst videoSrc = withBase('/media/home/manifesto/video/manifesto-1080.mp4');\n---`,
  `import { withBase } from '../../utils/paths';`,
);

console.log('');
console.log('Base-aware links aplicados correctamente.');
console.log('');
console.log('Archivos modificados:');
for (const relativePath of changed) {
  console.log(`  - ${relativePath}`);
}
console.log('');
console.log("Asegúrate de que astro.config.mjs tenga base: '/web2026/' durante QA.");
console.log('Después ejecuta:');
console.log('  npm run build');
console.log('  git diff --check');
