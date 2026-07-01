// Sinh icon PWA từ SVG. Chạy 1 lần: node scripts/gen-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Icon ly cà phê trên nền nâu (viewBox 512). Nội dung nằm trong vùng an toàn giữa.
function svg({ bg = true } = {}) {
  const background = bg
    ? `<rect width="512" height="512" rx="96" fill="url(#g)"/>`
    : `<rect width="512" height="512" fill="url(#g)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6f4e37"/>
      <stop offset="1" stop-color="#4b3421"/>
    </linearGradient>
  </defs>
  ${background}
  <!-- khói -->
  <g stroke="#f5efe6" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.9">
    <path d="M214 150 q-22 -26 0 -52 q22 -26 0 -52"/>
    <path d="M300 150 q-22 -26 0 -52 q22 -26 0 -52"/>
  </g>
  <!-- đĩa -->
  <ellipse cx="256" cy="410" rx="150" ry="26" fill="#f5efe6"/>
  <!-- thân ly -->
  <path d="M150 200 h180 v70 a90 90 0 0 1 -180 0 z" fill="#f5efe6"/>
  <!-- cà phê -->
  <ellipse cx="240" cy="200" rx="90" ry="20" fill="#c8a165"/>
  <!-- quai -->
  <path d="M330 210 a46 46 0 0 1 0 92" fill="none" stroke="#f5efe6" stroke-width="24"/>
</svg>`;
}

async function run() {
  const base = Buffer.from(svg({ bg: true }));
  const full = Buffer.from(svg({ bg: false })); // maskable: nền phủ kín

  await sharp(base).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
  await sharp(base).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));
  await sharp(full).resize(512, 512).png().toFile(path.join(outDir, 'icon-maskable-512.png'));
  await sharp(base).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'));
  // favicon nhỏ
  await sharp(base).resize(32, 32).png().toFile(path.join(outDir, 'favicon-32.png'));

  console.log('✅ Đã sinh icon trong public/icons');
}

run().catch((e) => {
  console.error('Lỗi sinh icon:', e);
  process.exit(1);
});
