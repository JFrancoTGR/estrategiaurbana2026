const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceRoot = path.resolve('src/assets');
const outputRoot = path.resolve('.webp-optimized-q88');

const MAX_EDGE = 3100;
const QUALITY = 88;
const MIN_SIZE = 300 * 1024;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(full);
    }

    return entry.isFile() && /\.webp$/i.test(entry.name)
      ? [full]
      : [];
  });
}

(async () => {
  const files = walk(sourceRoot);

  let originalTotal = 0;
  let optimizedTotal = 0;
  let processed = 0;
  let skippedTipology = 0;
  let skippedNoSaving = 0;

  for (const file of files) {
    const stat = fs.statSync(file);

    if (stat.size < MIN_SIZE) {
      continue;
    }

    const relative = path.relative(sourceRoot, file);

    /*
     * Excluimos tipologías / floorplans.
     * Conservamos sus originales para no
     * introducir compresión adicional
     * sobre líneas y texto arquitectónico.
     */
    if (
      relative
        .split(path.sep)
        .includes('tipology')
    ) {
      skippedTipology++;

      console.log(
        `SKIP | tipology | ${relative}`
      );

      continue;
    }

    const meta = await sharp(file).metadata();

    const output = path.join(outputRoot, relative);

    fs.mkdirSync(path.dirname(output), {
      recursive: true,
    });

    let pipeline = sharp(file)
      .rotate();

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const longestEdge = Math.max(width, height);

    /*
     * Solo redimensionamos imágenes
     * cuyo lado mayor supera 3100 px.
     */
    if (longestEdge > MAX_EDGE) {
      pipeline = pipeline.resize({
        width:
          width >= height
            ? MAX_EDGE
            : undefined,

        height:
          height > width
            ? MAX_EDGE
            : undefined,

        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    await pipeline
      .webp({
        quality: QUALITY,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(output);

    const optimizedStat = fs.statSync(output);

    /*
     * Si la versión optimizada pesa igual
     * o más que el original, no aporta
     * ningún beneficio y la descartamos.
     */
    if (optimizedStat.size >= stat.size) {
      fs.unlinkSync(output);

      skippedNoSaving++;

      console.log(
        `SKIP | optimized >= original | ${relative}`
      );

      continue;
    }

    originalTotal += stat.size;
    optimizedTotal += optimizedStat.size;
    processed++;

    const originalMB =
      stat.size / 1024 / 1024;

    const optimizedMB =
      optimizedStat.size / 1024 / 1024;

    const reduction =
      100 -
      (optimizedStat.size / stat.size) * 100;

    console.log(
      `${originalMB.toFixed(2).padStart(6)} MB -> ` +
      `${optimizedMB.toFixed(2).padStart(6)} MB | ` +
      `${reduction.toFixed(1).padStart(5)}% | ` +
      relative
    );
  }

  console.log('');
  console.log('----------------------------------------');
  console.log(`Archivos optimizados: ${processed}`);
  console.log(`Tipologías excluidas: ${skippedTipology}`);
  console.log(
    `Sin ahorro / descartados: ${skippedNoSaving}`
  );

  console.log(
    `Original: ${(originalTotal / 1024 / 1024).toFixed(2)} MB`
  );

  console.log(
    `Optimizado: ${(optimizedTotal / 1024 / 1024).toFixed(2)} MB`
  );

  if (originalTotal > 0) {
    console.log(
      `Reducción: ${(
        100 -
        (optimizedTotal / originalTotal) * 100
      ).toFixed(1)}%`
    );
  }

  console.log('----------------------------------------');
})();
