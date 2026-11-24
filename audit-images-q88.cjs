// Auditoría de imágenes de producción: no modifica ni genera imágenes.
// Ejecutar desde la raíz del proyecto Astro: node .\audit-images-q88.cjs
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = process.cwd();
const SCAN_ROOTS = ['src', 'public'];
const EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg']);
const QUALITY = 88;
const MIN_REDUCTION = 0.20;

const rows = [];
const errors = [];
const excluded = [];
const rel = file => path.relative(ROOT, file).split(path.sep).join('/');
const mib = bytes => `${(bytes / 1048576).toFixed(2)} MiB`;
const pct = n => `${(n * 100).toFixed(1)}%`;
const sum = (items, key) => items.reduce((total, item) => total + (item[key] ?? 0), 0);
const bySize = (a, b) => b.bytes - a.bytes || a.file.localeCompare(b.file);

async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    errors.push({ file: rel(dir), error: error.message });
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      excluded.push(rel(file));
      continue;
    }
    if (entry.isDirectory()) await walk(file);
    else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      await inspect(file);
    }
  }
}

async function inspect(file) {
  const ext = path.extname(file).toLowerCase();
  const row = { file: rel(file), ext, bytes: 0, status: 'ERROR' };
  rows.push(row);
  try {
    row.bytes = (await fs.stat(file)).size;
    const meta = await sharp(file).metadata();
    row.format = meta.format;
    row.width = meta.width;
    row.height = meta.height;
    row.alpha = Boolean(meta.hasAlpha);
    row.pages = meta.pages ?? 1;
    const expected = ['.jpg', '.jpeg'].includes(ext) ? 'jpeg' : ext.slice(1);
    if (meta.format !== expected) {
      row.status = 'FORMAT_MISMATCH';
      return;
    }
    if (row.file.split('/').some(part => ['tipology', 'typology', 'tipologies', 'typologies'].includes(part.toLowerCase()))) {
      row.status = 'TIPOLOGIA_EXCLUIDA';
      return;
    }
    if (row.pages > 1) {
      row.status = 'ANIMADA_EXCLUIDA';
      return;
    }
    // Simulación en memoria, sin resize y sin escribir en disco.
    const output = await sharp(file).webp({ quality: QUALITY }).toBuffer();
    row.q88Bytes = output.length;
    row.savings = row.bytes - row.q88Bytes;
    row.reduction = row.savings / row.bytes;
    row.status = row.reduction >= MIN_REDUCTION ? 'CANDIDATA' : 'SIN_AHORRO_SIGNIFICATIVO';
  } catch (error) {
    errors.push({ file: row.file, error: error.message });
  }
}

function section(title, items, render) {
  console.log(`\n=== ${title} (${items.length}) ===`);
  if (!items.length) console.log('Ninguna.');
  else for (const item of items) console.log(render(item));
}

async function main() {
  console.log(`AUDITORIA DE IMAGENES | Q${QUALITY} | umbral ${pct(MIN_REDUCTION)}`);
  console.log(`Raiz: ${ROOT}`);
  console.log(`Directorios: ${SCAN_ROOTS.join(', ')}`);
  for (const dir of SCAN_ROOTS) await walk(path.join(ROOT, dir));

  const candidates = rows.filter(r => r.status === 'CANDIDATA').sort((a, b) => b.savings - a.savings);
  const webpCandidates = candidates.filter(r => r.ext === '.webp');
  const conversionCandidates = candidates.filter(r => r.ext !== '.webp');
  const nonWebp = rows.filter(r => r.ext !== '.webp').sort(bySize);
  const typologies = rows.filter(r => r.status === 'TIPOLOGIA_EXCLUIDA');
  const animated = rows.filter(r => r.status === 'ANIMADA_EXCLUIDA');
  const mismatches = rows.filter(r => r.status === 'FORMAT_MISMATCH');
  const insignificant = rows.filter(r => r.status === 'SIN_AHORRO_SIGNIFICATIVO');
  const formatLine = r => `${r.file} | ${mib(r.bytes)} | ${r.width ?? '?'}x${r.height ?? '?'} | ${r.format ?? '?'} | ${r.status}`;
  const candidateLine = r => `${mib(r.bytes)} -> ${mib(r.q88Bytes)} | ${pct(r.reduction)} | ${r.width}x${r.height} | ${r.file}`;

  console.log('\n=== INVENTARIO POR EXTENSION ===');
  for (const ext of EXTENSIONS) {
    const items = rows.filter(r => r.ext === ext);
    console.log(`${ext.padEnd(6)} ${String(items.length).padStart(5)} archivos | ${mib(sum(items, 'bytes'))}`);
  }
  section('WEBP CON AHORRO SIGNIFICATIVO', webpCandidates, candidateLine);
  section('PNG/JPG/JPEG CON AHORRO AL CONVERTIR A WEBP', conversionCandidates, candidateLine);
  section('TODOS LOS PNG/JPG/JPEG', nonWebp, formatLine);
  section('15 IMAGENES MAS PESADAS (O MENOS)', [...rows].sort(bySize).slice(0, 15), formatLine);
  section('EXTENSION Y FORMATO REAL NO COINCIDEN', mismatches, formatLine);
  section('IMAGENES ANIMADAS NO PROCESADAS', animated, formatLine);
  section('ERRORES DE LECTURA O CODIFICACION', errors, r => `${r.file} | ${r.error}`);
  section('ENLACES SIMBOLICOS NO RECORRIDOS', excluded, r => r);

  console.log('\n=== RESUMEN ===');
  console.log(`Imagenes inventariadas: ${rows.length}`);
  console.log(`Peso total inventariado: ${mib(sum(rows, 'bytes'))}`);
  console.log(`WebP candidatas a Q88: ${webpCandidates.length}`);
  console.log(`Ahorro potencial WebP: ${mib(sum(webpCandidates, 'savings'))}`);
  console.log(`PNG/JPG/JPEG: ${nonWebp.length}`);
  console.log(`Candidatas a conversion WebP: ${conversionCandidates.length}`);
  console.log(`Ahorro potencial por conversion: ${mib(sum(conversionCandidates, 'savings'))}`);
  console.log(`Sin ahorro significativo: ${insignificant.length}`);
  console.log(`Tipologias excluidas de la simulacion: ${typologies.length}`);
  console.log(`Animadas excluidas de la simulacion: ${animated.length}`);
  console.log(`Discrepancias de formato: ${mismatches.length}`);
  console.log(`Errores: ${errors.length}`);
  console.log('No se modificaron archivos de imagen.');
  if (errors.length || mismatches.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
