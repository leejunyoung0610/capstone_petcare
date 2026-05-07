/**
 * PWA 아이콘 생성 스크립트.
 *
 * 입력:  public/favicon.svg  (브랜드 로고 — 보라톤)
 * 출력:
 *   public/icon-192.png            (192×192, 흰 배경 + 로고)
 *   public/icon-512.png            (512×512, 흰 배경 + 로고)
 *   public/icon-maskable-512.png   (512×512, 보라 배경 + 흰 로고 — maskable safe-area 80%)
 *   public/apple-touch-icon.png    (180×180, iOS 홈화면용)
 *
 * 실행:  npm run pwa:icons
 *
 * Tailwind / 카카오 등과 무관 — sharp 한 번만 도는 빌드 보조 스크립트.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");
const srcSvgPath = path.join(publicDir, "favicon.svg");

if (!fs.existsSync(srcSvgPath)) {
  console.error(`[pwa-icons] favicon.svg 가 없습니다: ${srcSvgPath}`);
  process.exit(1);
}

const svgRaw = fs.readFileSync(srcSvgPath);

// 흰색 로고용 SVG — 보라색 fill(#863bff/#7e14ff)을 흰색으로 치환
const svgWhite = Buffer.from(
  svgRaw
    .toString()
    .replace(/#863bff/gi, "#ffffff")
    .replace(/#7e14ff/gi, "#ffffff")
    .replace(/#47bfff/gi, "#ffffff")
    .replace(/#ede6ff/gi, "#ffffff")
    .replace(
      /color\(display-p3 [^)]+\)/gi,
      "color(display-p3 1 1 1)"
    )
);

async function makeIcon({ size, bg, logo, logoRatio, outName }) {
  const inner = Math.round(size * logoRatio);
  const logoBuf = await sharp(logo)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const out = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logoBuf, gravity: "center" }])
    .png()
    .toBuffer();

  const outPath = path.join(publicDir, outName);
  fs.writeFileSync(outPath, out);
  const kb = (out.length / 1024).toFixed(1);
  console.log(`  ✓ ${outName.padEnd(28)} ${size}×${size}  ${kb} KB`);
}

console.log("[pwa-icons] generating...");

// 표준 any 아이콘 — 흰 배경 + 원본 보라 로고. 작은 안전여백.
await makeIcon({
  size: 192,
  bg: { r: 255, g: 255, b: 255, alpha: 1 },
  logo: svgRaw,
  logoRatio: 0.62,
  outName: "icon-192.png",
});
await makeIcon({
  size: 512,
  bg: { r: 255, g: 255, b: 255, alpha: 1 },
  logo: svgRaw,
  logoRatio: 0.62,
  outName: "icon-512.png",
});

// Maskable 아이콘 — 보라 배경 + 흰 로고. 안전영역 80% 권장.
await makeIcon({
  size: 512,
  bg: { r: 126, g: 20, b: 255, alpha: 1 }, // #7e14ff
  logo: svgWhite,
  logoRatio: 0.5, // 80% safe area 안에 충분히 들어가도록 50%
  outName: "icon-maskable-512.png",
});

// iOS Apple touch icon (180×180) — 흰 배경 + 보라 로고.
await makeIcon({
  size: 180,
  bg: { r: 255, g: 255, b: 255, alpha: 1 },
  logo: svgRaw,
  logoRatio: 0.62,
  outName: "apple-touch-icon.png",
});

console.log("[pwa-icons] done.");
