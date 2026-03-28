const sharp = require('sharp');
const path = require('path');

async function main() {
  const INPUT  = path.join(__dirname, '../public/map.png');
  const OUTPUT = path.join(__dirname, '../public/map-clean.png');

  const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`Image: ${width}x${height}, ch:${channels}`);

  // ── Step 1: build foreground mask ─────────────────────────────────────────
  const THRESHOLD = 55;
  const fg = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i*channels], g = data[i*channels+1], b = data[i*channels+2];
    const a = channels===4 ? data[i*channels+3] : 255;
    fg[i] = a > 50 && Math.max(r,g,b) > THRESHOLD ? 1 : 0;
  }

  // ── Step 2: connected components ──────────────────────────────────────────
  const labels = new Int32Array(width * height).fill(-1);
  const sizes  = [];
  const sumR = [], sumG = [], sumB = [];
  let num = 0;
  const queue = new Int32Array(width * height);

  for (let start = 0; start < width * height; start++) {
    if (!fg[start] || labels[start] !== -1) continue;
    let head = 0, tail = 0;
    queue[tail++] = start;
    labels[start] = num;
    let sr = 0, sg = 0, sb = 0;

    while (head < tail) {
      const idx = queue[head++];
      sr += data[idx*channels]; sg += data[idx*channels+1]; sb += data[idx*channels+2];
      const x = idx % width, y = Math.floor(idx / width);
      for (const n of [y>0?idx-width:-1, y<height-1?idx+width:-1, x>0?idx-1:-1, x<width-1?idx+1:-1]) {
        if (n >= 0 && fg[n] && labels[n] === -1) { labels[n] = num; queue[tail++] = n; }
      }
    }
    sizes[num] = tail;
    sumR[num] = sr; sumG[num] = sg; sumB[num] = sb;
    num++;
  }

  // ── Step 3: decide what to keep ───────────────────────────────────────────
  // KEEP if:
  //   a) Large component (the lane network)             → size >= 4000
  //   b) Medium-large component that is white/grey      → base logos (the cream half-circles)
  //   c) Medium-large component that is lane-colored    → lane junction elements
  const keep = new Uint8Array(num);

  for (let c = 0; c < num; c++) {
    const sz = sizes[c];
    const avgR = sumR[c] / sz, avgG = sumG[c] / sz, avgB = sumB[c] / sz;
    const avgBrightness = (avgR + avgG + avgB) / 3;

    if (sz >= 4000) {
      keep[c] = 1; // lane lines (main network)
    } else if (sz >= 400) {
      // Keep white/near-white components (base logos) or clearly lane-colored ones
      const isWhitish = avgR > 160 && avgG > 160 && avgB > 160;
      const isYellow  = avgR > 150 && avgG > 120 && avgB < 100;
      const isGreen   = avgG > 130 && avgR < 120 && avgB < 120;
      const isCyan    = avgB > 130 && avgG > 100 && avgR < 120;

      if (isWhitish || isYellow || isGreen || isCyan) keep[c] = 1;

      console.log(`  comp ${c}: size=${sz} avg=(${avgR.toFixed(0)},${avgG.toFixed(0)},${avgB.toFixed(0)}) keep=${keep[c]}`);
    }
  }

  // ── Step 4: erase non-kept foreground pixels ──────────────────────────────
  // Sample background: use the darkest patches of the jungle.
  // We'll use nearest-background-pixel approach: for each erased pixel,
  // copy from a background pixel nearby. Simple version: use a fixed dark colour
  // that matches the jungle. Sample it from a known background area.

  // Sample bg from a point we know is background (slightly inside the circle, jungle area)
  // Approximate jungle center background: let's sample several points
  const samplePoints = [
    [632, 400], [632, 900], [400, 656], [900, 656],  // mid-jungle
    [500, 500], [800, 500], [500, 800], [800, 800],
  ];
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (const [sx, sy] of samplePoints) {
    const i = sy * width + sx;
    if (!fg[i]) {
      bgR += data[i*channels]; bgG += data[i*channels+1]; bgB += data[i*channels+2];
      bgCount++;
    }
  }
  if (bgCount === 0) { bgR = 25; bgG = 25; bgB = 30; bgCount = 1; }
  bgR = Math.round(bgR/bgCount);
  bgG = Math.round(bgG/bgCount);
  bgB = Math.round(bgB/bgCount);
  console.log(`\nBackground colour sampled: rgb(${bgR},${bgG},${bgB})`);

  let erased = 0;
  for (let i = 0; i < width * height; i++) {
    if (labels[i] >= 0 && !keep[labels[i]]) {
      data[i*channels]   = bgR;
      data[i*channels+1] = bgG;
      data[i*channels+2] = bgB;
      erased++;
    }
  }

  console.log(`Erased ${erased} pixels across ${num} components`);

  await sharp(Buffer.from(data), { raw: { width, height, channels } })
    .png().toFile(OUTPUT);
  console.log(`\nSaved → ${OUTPUT}`);
}

main().catch(console.error);
