import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLS = 56;
const ROWS = 80;
const PADDING = 0.02;

const geojson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ph-country-lowres.geojson'), 'utf8'),
);

function collectPolygons(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) => ring.map(([lon, lat]) => [lon, lat]));
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap((polygon) =>
      polygon.map((ring) => ring.map(([lon, lat]) => [lon, lat])),
    );
  }
  return [];
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygons(lon, lat, polygons) {
  for (const ring of polygons) {
    if (pointInRing(lon, lat, ring)) return true;
  }
  return false;
}

const polygons = geojson.features.flatMap((feature) => collectPolygons(feature.geometry));

let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

for (const ring of polygons) {
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
}

const lonSpan = maxLon - minLon;
const latSpan = maxLat - minLat;
const paddedMinLon = minLon - lonSpan * PADDING;
const paddedMaxLon = maxLon + lonSpan * PADDING;
const paddedMinLat = minLat - latSpan * PADDING;
const paddedMaxLat = maxLat + latSpan * PADDING;

const rows = [];
let landCount = 0;

for (let row = 0; row < ROWS; row += 1) {
  let line = '';
  const lat = paddedMaxLat - ((row + 0.5) / ROWS) * (paddedMaxLat - paddedMinLat);
  for (let col = 0; col < COLS; col += 1) {
    const lon = paddedMinLon + ((col + 0.5) / COLS) * (paddedMaxLon - paddedMinLon);
    const land = pointInPolygons(lon, lat, polygons);
    if (land) landCount += 1;
    line += land ? '1' : '0';
  }
  rows.push(line);
}

const output = `/** Auto-generated from NAMRIA/PSGC country GeoJSON — do not edit by hand. */
export const PH_MATRIX_COLS = ${COLS};
export const PH_MATRIX_ROWS = ${ROWS};

/** Each row is a string of '1' (land) / '0' (ocean) cells, west→east. */
export const PH_MATRIX_ROWS_DATA: readonly string[] = [
${rows.map((row) => `  '${row}',`).join('\n')}
] as const;

export const PH_MATRIX_LAND_COUNT = ${landCount};
`;

fs.writeFileSync(
  path.join(__dirname, '../src/features/auth/authPhilippinesMatrixData.ts'),
  output,
  'utf8',
);

console.log(`Generated ${COLS}x${ROWS} matrix with ${landCount} land cells.`);
