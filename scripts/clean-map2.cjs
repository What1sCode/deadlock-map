const sharp = require('sharp');
const path = require('path');

async function main() {
  const INPUT  = path.join(__dirname, '../public/map-clean.png');
  const OUTPUT = path.join(__dirname, '../public/map-clean2.png');

  const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Lane colours we want to PROTECT (don't erase these)
  function isLaneColour(r, g, b) {
    const yellow = r > 130 && g > 100 && b < 90 && r > b + 60;   // yellow lane
    const green  = g > 100 && g > r + 20 && g > b + 20;           // green lane
    const cyan   = b > 100 && g > 80 && r < 120;                  // blue/cyan lane
    const cream  = r > 175 && g > 165 && b > 140;                  // base half-circles
    return yellow || green || cyan || cream;
  }

  // Any foreground pixel that is NOT a lane colour is a rogue icon
  const BG = { r: 25, g: 27, b: 26 };
  let erased = 0;

  for (let i = 0; i < width * height; i++) {
    const r = data[i*channels], g = data[i*channels+1], b = data[i*channels+2];
    const a = channels===4 ? data[i*channels+3] : 255;
    if (a < 50) continue;

    const bright = Math.max(r, g, b) > 55;
    if (bright && !isLaneColour(r, g, b)) {
      data[i*channels]   = BG.r;
      data[i*channels+1] = BG.g;
      data[i*channels+2] = BG.b;
      erased++;
    }
  }

  console.log(`Erased ${erased} rogue-icon pixels`);

  await sharp(Buffer.from(data), { raw: { width, height, channels } })
    .png().toFile(OUTPUT);
  console.log(`Saved → ${OUTPUT}`);
}

main().catch(console.error);
