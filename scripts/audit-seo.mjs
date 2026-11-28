import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://estrategiaurbana.com.mx';
const root = path.resolve('dist');
const output = path.resolve('seo-audit.json');
const strict = process.argv.includes('--production');

if (!fs.existsSync(root)) {
  console.error('No existe dist/. Ejecuta la auditoría desde la raíz del proyecto con un build disponible.');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : entry.isFile() && /\.html$/i.test(file) ? [file] : [];
  });
}

function decode(value = '') {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, entity) => {
    const key = entity.toLowerCase();
    if (key.startsWith('#')) {
      const n = key.startsWith('#x') ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : all;
    }
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }[key] ?? all;
  }).trim();
}

function attrs(tag) {
  const result = {};
  const source = tag.replace(/^<[^\s/>]+\s*/, '').replace(/\s*\/?>$/, '');
  for (const m of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return result;
}

function tags(head, name) {
  return [...head.matchAll(new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi'))].map(m => attrs(m[0]));
}

function routeFor(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return '/' + file.slice(0, -'index.html'.length);
  return '/' + file;
}

function validAbsoluteUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol); }
  catch { return false; }
}

const fields = ['title', 'description', 'canonical', 'og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name', 'og:locale', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
const generic = /^(t[ií]tulo del sitio|descripci[oó]n del sitio)$/i;
const files = walk(root).sort();
if (!files.length) { console.error('No se encontraron HTML en dist/.'); process.exit(1); }

const pages = files.map(file => {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const route = routeFor(relative);
  const expectedCanonical = new URL(route, SITE).href;
  const html = fs.readFileSync(file, 'utf8');
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  const head = (headMatch?.[1] ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  const metas = tags(head, 'meta');
  const links = tags(head, 'link');
  const values = {};
  const occurrences = {};
  function add(key, list) { values[key] = list[0] ?? ''; occurrences[key] = list.length; }
  add('title', [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)].map(m => decode(m[1])));
  add('canonical', links.filter(a => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')).map(a => a.href ?? ''));
  for (const key of [...fields.filter(k => !['title', 'canonical'].includes(k)), 'robots']) {
    add(key, metas.filter(a => (a.name ?? '').toLowerCase() === key || (a.property ?? '').toLowerCase() === key).map(a => a.content ?? ''));
  }
  const noindex = metas.some(a => ['robots', 'googlebot'].includes((a.name ?? '').toLowerCase()) && /(?:^|[\s,])(?:noindex|none)(?:$|[\s,])/i.test(a.content ?? ''));
  const excluded = /^(404\.html|404\/index\.html)$/i.test(relative);
  const issues = [];
  if (!headMatch) issues.push('HEAD_MISSING');
  for (const key of fields) {
    if (!values[key]) issues.push(`MISSING:${key}`);
    if (occurrences[key] > 1) issues.push(`MULTIPLE:${key}`);
  }
  for (const key of ['title', 'description']) if (generic.test(values[key])) issues.push(`PLACEHOLDER:${key}`);
  for (const key of ['canonical', 'og:url']) if (values[key] && values[key] !== expectedCanonical) issues.push(`URL_MISMATCH:${key}`);
  for (const key of ['og:image', 'twitter:image']) if (values[key] && !validAbsoluteUrl(values[key])) issues.push(`INVALID_ABSOLUTE_URL:${key}`);
  if (noindex) issues.push('NOINDEX');
  return { file: relative, route, expectedCanonical, excluded, values, occurrences, noindex, issues };
});

const included = pages.filter(p => !p.excluded);
const duplicates = {};
for (const key of ['title', 'description', 'canonical']) {
  const groups = new Map();
  for (const p of included) {
    const value = p.values[key].trim();
    if (!value) continue;
    const normalized = key === 'canonical' ? value : value.replace(/\s+/g, ' ').toLowerCase();
    if (!groups.has(normalized)) groups.set(normalized, []);
    groups.get(normalized).push(p);
  }
  duplicates[key] = [...groups.values()].filter(g => g.length > 1).map(g => ({ value: g[0].values[key], pages: g.map(p => p.route) }));
  for (const group of groups.values()) if (group.length > 1) for (const p of group) p.issues.push(`DUPLICATE:${key}`);
}

const summary = {
  html: pages.length,
  publicCandidates: included.length,
  excluded: pages.length - included.length,
  coverage: Object.fromEntries([...fields, 'robots'].map(key => [key, included.filter(p => Boolean(p.values[key])).length])),
  correctCanonical: included.filter(p => p.occurrences.canonical === 1 && p.values.canonical === p.expectedCanonical).length,
  correctOgUrl: included.filter(p => p.occurrences['og:url'] === 1 && p.values['og:url'] === p.expectedCanonical).length,
  noindex: included.filter(p => p.noindex).length,
  duplicateGroups: Object.fromEntries(Object.entries(duplicates).map(([k,v]) => [k,v.length])),
  withIssues: included.filter(p => p.issues.length).length,
};

fs.writeFileSync(output, JSON.stringify({ site: SITE, mode: strict ? 'production' : 'baseline', summary, duplicates, pages }, null, 2) + '\n');
console.log('\n=== AUDITORÍA SEO: ' + (strict ? 'PRODUCCIÓN' : 'LÍNEA BASE') + ' ===');
console.log('HTML analizados:', summary.html);
console.log('Páginas candidatas a indexación:', summary.publicCandidates);
console.log('Excluidas (404):', summary.excluded);
for (const [key, count] of Object.entries(summary.coverage)) console.log(key.padEnd(22), `${count}/${included.length}`);
console.log('Canonical correctas: ', `${summary.correctCanonical}/${included.length}`);
console.log('OG URL correctas:    ', `${summary.correctOgUrl}/${included.length}`);
console.log('Páginas noindex:', summary.noindex);
for (const [key, count] of Object.entries(summary.duplicateGroups)) console.log(`Grupos duplicados (${key}):`, count);
console.log('Páginas con observaciones:', summary.withIssues);
console.log('Reporte detallado:', output);
if (strict && (!included.length || summary.withIssues)) process.exitCode = 1;
