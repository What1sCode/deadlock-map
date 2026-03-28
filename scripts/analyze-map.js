const sharp = require('sharp');
const path = require('path');

async function main() {
  const INPUT = path.join(__dirname, '../public/map.png');
  const { data, info } = await sharp(INPUT).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Image: ${width}x${height}, channels: ${channels}`);

  // Foreground = pixels that are meaningfully colored (not dark background)
  // Use max(R,G,B) > threshold
  const THRESHOLD = 55;
  const fg = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2];
    const a = channels === 4 ? data[i * channels + 3] : 255;
    fg[i] = a > 50 && Math.max(r, g, b) > THRESHOLD ? 1 : 0;
  }

  // Connected components BFS
  const labels = new Int32Array(width * height).fill(-1);
  const sizes = [];
  let num = 0;
  const queue = new Int32Array(width * height);

  for (let start = 0; start < width * height; start++) {
    if (!fg[start] || labels[start] !== -1) continue;
    let head = 0, tail = 0;
    queue[tail++] = start;
    labels[start] = num;
    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width, y = Math.floor(idx / width);
      for (const n of [y>0?idx-width:-1, y<height-1?idx+width:-1, x>0?idx-1:-1, x<width-1?idx+1:-1]) {
        if (n >= 0 && fg[n] && labels[n] === -1) { labels[n] = num; queue[tail++] = n; }
      }
    }
    sizes[num] = tail;
    num++;
  }

  // Sort and display
  const sorted = sizes.map((s,i) => ({label:i,size:s})).sort((a,b) => b.size-a.size);
  console.log(`\nTotal components: ${num}`);
  console.log('\nTop 25 component sizes (these are what we KEEP if large):');
  sorted.slice(0, 25).forEach((c, i) => console.log(`  #${i+1}: ${c.size} px`));

  // Show distribution
  const buckets = { tiny: 0, small: 0, medium: 0, large: 0 };
  for (const s of sizes) {
    if (s < 50) buckets.tiny++;
    else if (s < 500) buckets.small++;
    else if (s < 5000) buckets.medium++;
    else buckets.large++;
  }
  console.log('\nSize distribution:');
  console.log(`  < 50px (tiny icons):   ${buckets.tiny}`);
  console.log(`  50–500px (small icons): ${buckets.small}`);
  console.log(`  500–5000px (medium):    ${buckets.medium}`);
  console.log(`  5000px+ (lanes/base):   ${buckets.large}`);
}

main().catch(console.error);
