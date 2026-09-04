// Génère les icônes PNG de l'application (PWA + favicon) sans dépendance
// externe : dessin de formes simples pixel par pixel puis encodage PNG "à la
// main" (IHDR/IDAT/IEND avec zlib intégré à Node).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = chunk('IDAT', deflateSync(raw, { level: 9 }));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeCanvas(size) {
  const rgba = Buffer.alloc(size * size * 4);
  return {
    size,
    rgba,
    set(x, y, [r, g, b, a]) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (y * size + x) * 4;
      const srcA = a / 255;
      const dstA = rgba[i + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA <= 0) return;
      for (let c = 0; c < 3; c++) {
        const src = [r, g, b][c];
        const dst = rgba[i + c];
        rgba[i + c] = Math.round((src * srcA + dst * dstA * (1 - srcA)) / outA);
      }
      rgba[i + 3] = Math.round(outA * 255);
    },
    fillCircle(cx, cy, r, color, feather = 1.2) {
      for (let y = Math.floor(cy - r - feather); y <= cy + r + feather; y++) {
        for (let x = Math.floor(cx - r - feather); x <= cx + r + feather; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d <= r - feather) {
            this.set(x, y, color);
          } else if (d <= r + feather) {
            const alpha = Math.max(0, 1 - (d - (r - feather)) / (feather * 2));
            this.set(x, y, [color[0], color[1], color[2], Math.round(color[3] * alpha)]);
          }
        }
      }
    },
    fillRect(x0, y0, x1, y1, color) {
      for (let y = Math.max(0, Math.floor(y0)); y < Math.min(size, Math.ceil(y1)); y++) {
        for (let x = Math.max(0, Math.floor(x0)); x < Math.min(size, Math.ceil(x1)); x++) {
          this.set(x, y, color);
        }
      }
    },
    fillTriangle(ax, ay, bx, by, cx, cy, color) {
      const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
      const maxX = Math.min(size, Math.ceil(Math.max(ax, bx, cx)));
      const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
      const maxY = Math.min(size, Math.ceil(Math.max(ay, by, cy)));
      const sign = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const d1 = sign(x, y, ax, ay, bx, by);
          const d2 = sign(x, y, bx, by, cx, cy);
          const d3 = sign(x, y, cx, cy, ax, ay);
          const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
          const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
          if (!(hasNeg && hasPos)) this.set(x, y, color);
        }
      }
    },
  };
}

function drawIcon(size) {
  const c = makeCanvas(size);
  const bgTop = [12, 16, 28, 255];
  const bgBottom = [20, 27, 46, 255];
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const col = [0, 1, 2].map((i) => Math.round(bgTop[i] + (bgBottom[i] - bgTop[i]) * t));
    c.fillRect(0, y, size, y + 1, [col[0], col[1], col[2], 255]);
  }

  // Lune
  const moonR = size * 0.2;
  c.fillCircle(size * 0.68, size * 0.3, moonR, [244, 212, 124, 255]);
  c.fillCircle(size * 0.6, size * 0.26, moonR * 0.85, [bgTop[0], bgTop[1], bgTop[2], 255]);

  // Étoiles
  const stars = [
    [size * 0.15, size * 0.18],
    [size * 0.3, size * 0.35],
    [size * 0.1, size * 0.42],
  ];
  for (const [sx, sy] of stars) c.fillCircle(sx, sy, size * 0.008, [255, 255, 255, 200]);

  // Silhouette de village (toits triangulaires) + sapin
  const baseY = size * 0.72;
  c.fillRect(0, baseY, size, size, [7, 9, 16, 255]);
  const roofColor = [7, 9, 16, 255];
  c.fillTriangle(size * 0.05, baseY, size * 0.22, size * 0.5, size * 0.38, baseY, roofColor);
  c.fillTriangle(size * 0.3, baseY, size * 0.5, size * 0.42, size * 0.68, baseY, roofColor);
  c.fillTriangle(size * 0.6, baseY, size * 0.8, size * 0.55, size * 0.98, baseY, roofColor);

  // Silhouette de loup (oreilles + tête stylisée) au premier plan
  const wolfColor = [16, 19, 28, 255];
  const cx = size * 0.5;
  const cy = size * 0.86;
  c.fillTriangle(cx - size * 0.22, cy + size * 0.02, cx - size * 0.1, cy - size * 0.22, cx - size * 0.02, cy + size * 0.02, wolfColor);
  c.fillTriangle(cx + size * 0.22, cy + size * 0.02, cx + size * 0.1, cy - size * 0.22, cx + size * 0.02, cy + size * 0.02, wolfColor);
  c.fillTriangle(cx - size * 0.24, cy + size * 0.08, cx, cy - size * 0.06, cx + size * 0.24, cy + size * 0.08, wolfColor);
  c.fillCircle(cx - size * 0.08, cy - size * 0.02, size * 0.012, [244, 212, 124, 255]);
  c.fillCircle(cx + size * 0.08, cy - size * 0.02, size * 0.012, [244, 212, 124, 255]);

  return c.rgba;
}

for (const size of [192, 512]) {
  const rgba = drawIcon(size);
  writeFileSync(new URL(`../public/icons/icon-${size}.png`, import.meta.url), encodePNG(size, size, rgba));
  console.log(`icon-${size}.png généré`);
}
