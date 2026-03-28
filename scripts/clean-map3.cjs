const sharp = require('sharp');
const path = require('path');

async function main() {
  const INPUT  = path.join(__dirname, '../public/map-clean2.png');
  const OUTPUT = path.join(__dirname, '../public/map-clean3.png');

  const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const BG = { r: 25, g: 27, b: 26 };

  // Target the golden figure — center of map, roughly x:595-675, y:575-670
  const regions = [
    { x1: 590, y1: 565, x2: 680, y2: 675 },
  ];

  let erased = 0;
  for (const { x1, y1, x2, y2 } of regions) {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const i = y * width + x;
        const r = data[i*channels], g = data[i*channels+1], b = data[i*channels+2];
        // Only erase if it's not the dark background
        if (Math.max(r, g, b) > 50) {
          data[i*channels]   = BG.r;
          data[i*channels+1] = BG.g;
          data[i*channels+2] = BG.b;
          erased++;
        }
      }
    }
  }

  console.log(`Erased ${erased} pixels`);
  await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toFile(OUTPUT);
  console.log(`Saved → ${OUTPUT}`);
}

main().catch(console.error);
