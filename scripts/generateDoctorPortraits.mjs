// Draws the illustrated portraits of the demo doctors (no photos of real people) into public/doctors/.
// Run from the frontend folder: node scripts/generateDoctorPortraits.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/doctors");

const SKIN = {
  light: ["#F6D3B6", "#E8B892"],
  wheat: ["#EDBF97", "#D9A174"],
  tan: ["#D69C70", "#BE8358"],
  brown: ["#B07A50", "#966240"],
  deep: ["#8A5A3A", "#73472C"],
};
const HAIR = { black: "#1E1A1D", dark: "#3A2A22", brown: "#6B4329", auburn: "#8A4B2A", grey: "#8E949C" };
const SCRUBS = { blue: "#3674AB", teal: "#2F8F83", navy: "#22406B", violet: "#6366C9", green: "#3E8E6A", rose: "#B4536B" };
const BACKGROUNDS = {
  sky: ["#E3EFFB", "#C7DEF5"],
  mint: ["#DFF5EE", "#BDE8DA"],
  lavender: ["#ECEBFB", "#D6D3F5"],
  aqua: ["#DDF4F7", "#B9E6EE"],
  sand: ["#FBF0DC", "#F3DDB5"],
  blush: ["#FBE9EE", "#F4CDD8"],
};

const hairBack = (style, color) =>
  ({
    long: `<path d="M134 186 C126 112 166 90 200 90 C236 90 276 110 268 190 C270 246 276 286 290 318 L110 318 C124 286 132 246 134 186 Z" fill="${color}"/>`,
    bob: `<path d="M136 184 C128 112 168 94 200 94 C234 94 274 110 266 184 L268 246 C250 256 236 250 232 238 L168 238 C164 250 150 256 132 246 Z" fill="${color}"/>`,
    bun: `<circle cx="200" cy="92" r="27" fill="${color}"/>`,
  })[style] || "";

const hairFront = (style, color) =>
  ({
    short: `<path d="M146 184 C138 118 170 100 202 100 C240 100 264 122 255 184 C250 152 234 138 204 138 C176 138 156 152 146 184 Z" fill="${color}"/>`,
    side: `<path d="M145 186 C136 116 176 96 212 100 C250 104 266 132 255 182 C250 160 238 146 220 140 C200 152 170 156 145 186 Z" fill="${color}"/>`,
    long: `<path d="M146 182 C144 126 176 108 204 108 C236 108 258 128 254 182 C244 150 226 138 206 138 C186 144 164 156 146 182 Z" fill="${color}"/>`,
    bob: `<path d="M146 182 C144 124 176 106 204 106 C236 106 258 126 254 182 C240 158 218 146 196 144 C176 148 160 160 146 182 Z" fill="${color}"/>`,
    bun: `<path d="M147 180 C146 128 176 112 202 112 C232 112 256 130 253 180 C240 152 222 142 200 142 C180 142 160 152 147 180 Z" fill="${color}"/>`,
    curly: [
      [152, 160, 18], [166, 136, 20], [188, 122, 21], [214, 120, 21], [238, 132, 20], [252, 156, 18], [146, 186, 14], [258, 182, 14],
    ].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`).join(""),
    receding: `<path d="M148 172 C146 132 168 116 200 116 C232 116 254 132 252 172 C246 150 238 144 228 142 C218 132 182 132 172 142 C162 144 154 150 148 172 Z" fill="${color}"/>`,
  })[style] || "";

const portrait = ({ skin, hair, hairStyle, scrubs, background, glasses = false, beard = false, earrings = false }) => {
  const [skinTone, skinShade] = SKIN[skin];
  const hairColor = HAIR[hair];
  const [bgFrom, bgTo] = BACKGROUNDS[background];
  const scrub = SCRUBS[scrubs];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgFrom}"/><stop offset="1" stop-color="${bgTo}"/></linearGradient>
    <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9EFF5"/></linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="190" r="132" fill="#FFFFFF" opacity="0.35"/>
  <g transform="translate(200 400) scale(1.12) translate(-200 -400)">
  ${hairBack(hairStyle, hairColor)}
  <!-- neck -->
  <path d="M176 232 L224 232 L228 292 L200 318 L172 292 Z" fill="${skinShade}"/>
  <!-- white coat and scrubs -->
  <path d="M36 400 C38 334 86 296 150 284 L250 284 C314 296 362 334 364 400 Z" fill="url(#coat)" stroke="#D5DEE8" stroke-width="2"/>
  <path d="M164 285 L200 344 L236 285 Z" fill="${scrub}"/>
  <path d="M150 284 L164 285 L200 344 L178 400 L132 400 L146 330 Z" fill="#F4F7FA" stroke="#D5DEE8" stroke-width="2" stroke-linejoin="round"/>
  <path d="M250 284 L236 285 L200 344 L222 400 L268 400 L254 330 Z" fill="#F4F7FA" stroke="#D5DEE8" stroke-width="2" stroke-linejoin="round"/>
  <!-- pocket with pens and an ID badge -->
  <rect x="96" y="346" width="40" height="34" rx="4" fill="#FFFFFF" stroke="#D5DEE8" stroke-width="2"/>
  <rect x="104" y="334" width="5" height="18" rx="2" fill="${scrub}"/><rect x="113" y="338" width="5" height="14" rx="2" fill="#94A3B8"/>
  <rect x="262" y="340" width="40" height="28" rx="5" fill="${scrub}"/><rect x="269" y="349" width="26" height="4" rx="2" fill="#FFFFFF" opacity="0.9"/><rect x="269" y="357" width="16" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6"/>
  <!-- stethoscope -->
  <path d="M166 288 C154 320 160 352 186 366" fill="none" stroke="#2F3B4C" stroke-width="6" stroke-linecap="round"/>
  <path d="M234 288 C248 318 246 338 232 352" fill="none" stroke="#2F3B4C" stroke-width="6" stroke-linecap="round"/>
  <path d="M186 366 C196 372 206 370 214 362" fill="none" stroke="#2F3B4C" stroke-width="6" stroke-linecap="round"/>
  <circle cx="232" cy="362" r="13" fill="#B8C3D1" stroke="#2F3B4C" stroke-width="4"/><circle cx="232" cy="362" r="5" fill="#2F3B4C"/>
  <!-- head -->
  <ellipse cx="146" cy="192" rx="11" ry="16" fill="${skinShade}"/>
  <ellipse cx="254" cy="192" rx="11" ry="16" fill="${skinShade}"/>
  ${earrings ? `<circle cx="146" cy="210" r="4" fill="#E6B54A"/><circle cx="254" cy="210" r="4" fill="#E6B54A"/>` : ""}
  <ellipse cx="200" cy="182" rx="54" ry="64" fill="${skinTone}"/>
  ${beard ? `<path d="M147 186 C148 248 176 268 200 268 C224 268 252 248 253 186 C246 220 236 234 222 236 C214 228 186 228 178 236 C164 234 154 220 147 186 Z" fill="${hairColor}"/>` : ""}
  ${hairFront(hairStyle, hairColor)}
  <!-- face -->
  <path d="M172 168 Q182 162 192 167" fill="none" stroke="${hairColor}" stroke-width="4" stroke-linecap="round"/>
  <path d="M208 167 Q218 162 228 168" fill="none" stroke="${hairColor}" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="182" cy="184" rx="4.5" ry="5.5" fill="#1F2937"/><ellipse cx="218" cy="184" rx="4.5" ry="5.5" fill="#1F2937"/>
  <circle cx="183.5" cy="182" r="1.5" fill="#FFFFFF"/><circle cx="219.5" cy="182" r="1.5" fill="#FFFFFF"/>
  ${glasses ? `<circle cx="182" cy="185" r="15" fill="#FFFFFF" fill-opacity="0.15" stroke="#27303D" stroke-width="3"/><circle cx="218" cy="185" r="15" fill="#FFFFFF" fill-opacity="0.15" stroke="#27303D" stroke-width="3"/><path d="M197 184 Q200 181 203 184" fill="none" stroke="#27303D" stroke-width="3"/>` : ""}
  <path d="M200 190 Q195 204 202 207" fill="none" stroke="${skinShade}" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="168" cy="206" r="8" fill="#F08A8A" opacity="0.25"/><circle cx="232" cy="206" r="8" fill="#F08A8A" opacity="0.25"/>
  ${beard
    ? `<path d="M186 220 Q200 230 214 220" fill="none" stroke="#F3E3D3" stroke-width="3.5" stroke-linecap="round"/>`
    : `<path d="M185 218 Q200 232 215 218" fill="none" stroke="#9A4A45" stroke-width="3.5" stroke-linecap="round"/>`}
  </g>
</svg>
`;
};

// one portrait per demo doctor (file name = part of the email before @)
const DOCTORS = {
  doctor: { skin: "wheat", hair: "dark", hairStyle: "long", scrubs: "blue", background: "sky", glasses: true, earrings: true },
  "ananya.rao": { skin: "tan", hair: "black", hairStyle: "bun", scrubs: "teal", background: "mint", earrings: true },
  "vikram.mehta": { skin: "wheat", hair: "black", hairStyle: "short", scrubs: "navy", background: "lavender", glasses: true },
  "sara.thomas": { skin: "light", hair: "brown", hairStyle: "bob", scrubs: "violet", background: "blush" },
  "arjun.iyer": { skin: "brown", hair: "black", hairStyle: "side", scrubs: "teal", background: "aqua", beard: true },
  "neha.kapoor": { skin: "light", hair: "auburn", hairStyle: "long", scrubs: "rose", background: "sand", earrings: true },
  "rohan.desai": { skin: "tan", hair: "dark", hairStyle: "short", scrubs: "blue", background: "sky" },
  "kavya.menon": { skin: "deep", hair: "black", hairStyle: "curly", scrubs: "green", background: "mint", earrings: true },
  "imran.shaikh": { skin: "tan", hair: "black", hairStyle: "receding", scrubs: "navy", background: "lavender", beard: true, glasses: true },
  "riya.sen": { skin: "wheat", hair: "black", hairStyle: "bob", scrubs: "teal", background: "aqua", glasses: true },
  "kabir.anand": { skin: "light", hair: "brown", hairStyle: "side", scrubs: "blue", background: "blush" },
  "zoya.khan": { skin: "brown", hair: "dark", hairStyle: "long", scrubs: "violet", background: "lavender", earrings: true },
  "karan.malhotra": { skin: "wheat", hair: "grey", hairStyle: "short", scrubs: "green", background: "mint", glasses: true },
  "meera.nair": { skin: "brown", hair: "black", hairStyle: "bun", scrubs: "rose", background: "sand", earrings: true },
};

mkdirSync(OUT, { recursive: true });
for (const [name, look] of Object.entries(DOCTORS)) {
  writeFileSync(path.join(OUT, `${name.replace(".", "-")}.svg`), portrait(look));
}
console.log(`${Object.keys(DOCTORS).length} portraits written to public/doctors/`);
