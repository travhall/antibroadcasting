const fs = require("fs");
const ttf2woff2 = require("ttf2woff2").default;

const inputPath = "./public/fonts/Dominique-VF.ttf";
const outputPath = "./public/fonts/Dominique-VF.woff2";

try {
  const ttfBuffer = fs.readFileSync(inputPath);
  const woff2Buffer = ttf2woff2(ttfBuffer);
  fs.writeFileSync(outputPath, woff2Buffer);

  const originalSize = (ttfBuffer.length / 1024).toFixed(1);
  const newSize = (woff2Buffer.length / 1024).toFixed(1);
  const savings = (
    ((ttfBuffer.length - woff2Buffer.length) / ttfBuffer.length) *
    100
  ).toFixed(1);

  console.log(`✓ Converted Dominique-VF.ttf to .woff2`);
  console.log(
    `  Original: ${originalSize}KB → WOFF2: ${newSize}KB (${savings}% smaller)`,
  );
} catch (err) {
  console.error("Conversion failed:", err.message);
  process.exit(1);
}
