"use client";

import { useRef, useEffect } from "react";

// ——— Constantes ———
const PARTICLE_RADIUS = 3;
const LINE_WIDTH = 0.5;
const CONNECTION_DISTANCE = 120;
const LERP_SPEED = 0.03;
const FLOAT_STRENGTH = 0.4;
const COLOR = "rgba(0, 255, 200, ";
const GRAPHIC_COLOR = "rgba(100, 220, 255, "; // style graphique : bleu plus clair
const SQUAT_REFERENCE_SRC = "/assets/squat-reference.png";
const POSE_CYCLE_LENGTH = 12; // humain (femme/homme) et graphique une fois sur deux

type AnimationState = "freeFloat" | "orbit" | "toPose" | "pose" | "orbit2" | "toPose2" | "pose2" | "toFloat";

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function easeInOutCubic(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Ease-in exponentiel : progression lente au début, puis accélération (transition constellation → reste) */
function easeInExpo(t: number) {
  const x = clamp01(t);
  return x <= 0 ? 0 : Math.pow(2, 10 * (x - 1));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function jitterPoints(
  pts: Array<{ x: number; y: number }>,
  rng: () => number,
  amount: number
) {
  return pts.map((p) => ({
    x: clamp01(p.x + (rng() - 0.5) * amount),
    y: clamp01(p.y + (rng() - 0.5) * amount),
  }));
}

function transformPoints(
  pts: Array<{ x: number; y: number }>,
  opts: { cx: number; cy: number; scale: number; rot: number }
) {
  const { cx, cy, scale, rot } = opts;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return pts.map((p) => {
    const x = (p.x - 0.5) * scale;
    const y = (p.y - 0.5) * scale;
    const xr = x * c - y * s;
    const yr = x * s + y * c;
    return { x: clamp01(cx + xr), y: clamp01(cy + yr) };
  });
}

async function samplePointsFromImage(
  src: string,
  count: number
): Promise<Array<{ x: number; y: number }>> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Impossible de charger l'image: ${src}`));
  });

  const targetW = 240;
  const targetH = 240;
  const off = document.createElement("canvas");
  off.width = targetW;
  off.height = targetH;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.clearRect(0, 0, targetW, targetH);
  // Fit-center
  const scale = Math.min(targetW / img.width, targetH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (targetW - drawW) / 2;
  const dy = (targetH - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);

  const { data } = ctx.getImageData(0, 0, targetW, targetH);

  // Détecter pixels du sujet (plutôt sombres) et extraire une bounding box
  const candidates: Array<{ x: number; y: number }> = [];
  let minX = targetW, minY = targetH, maxX = 0, maxY = 0;
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const i = (y * targetW + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 16) continue;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // Le fond est très clair; le sujet (corps/short) est plutôt sombre
      if (luma < 155) {
        candidates.push({ x, y });
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fallback si seuil trop strict
  if (candidates.length < 400) {
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const i = (y * targetW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 16) continue;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luma < 175) {
          candidates.push({ x, y });
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (candidates.length === 0 || maxX <= minX || maxY <= minY) return [];

  // Échantillonnage aléatoire (avec léger biais vers les contours via une grille grossière)
  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;
  const desired = Math.max(50, Math.min(140, count));
  const out: Array<{ x: number; y: number }> = [];
  const tries = desired * 40;

  for (let t = 0; t < tries && out.length < desired; t++) {
    const p = candidates[(Math.random() * candidates.length) | 0];
    // Normalisé dans la bbox
    const nx = (p.x - minX) / bboxW;
    const ny = (p.y - minY) / bboxH;

    // Garder surtout la zone centrale où est l’athlète (élimine un peu les meubles)
    if (nx < 0.08 || nx > 0.92 || ny < 0.03 || ny > 0.98) continue;

    out.push({ x: nx, y: ny });
  }

  // Assurer la taille demandée
  while (out.length < desired) {
    const p = candidates[(Math.random() * candidates.length) | 0];
    const nx = (p.x - minX) / bboxW;
    const ny = (p.y - minY) / bboxH;
    out.push({ x: nx, y: ny });
  }

  return out;
}

// ——— Formes en coordonnées relatives (0–1) ———
// Homme en squat (plus réaliste, proportions humaines) à DROITE de l'écran (centre ~0.72)
function generateSquatShape(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  // Tête (rond, proportion humaine ~1/7)
  for (let i = 0; i < 12; i++)
    push(0.018 * Math.cos((i / 12) * Math.PI * 2), -0.14 + 0.018 * Math.sin((i / 12) * Math.PI * 2));
  push(0, -0.11); push(-0.01, -0.09);
  // Épaules (larges, naturelles)
  push(-0.12, -0.06); push(-0.08, -0.07); push(-0.02, -0.08); push(0.02, -0.08); push(0.08, -0.07); push(0.12, -0.06);
  for (let t = 0; t <= 1; t += 0.05) push(0.015 * (t - 0.5), -0.05 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.10, 0.14); push(-0.05, 0.17); push(0, 0.18); push(0.05, 0.17); push(0.10, 0.14);
  push(-0.18, -0.02); push(-0.20, 0.02); push(-0.18, 0.08); push(-0.14, 0.12); push(-0.10, 0.14);
  push(0.18, -0.01); push(0.20, 0.03); push(0.18, 0.09); push(0.14, 0.12); push(0.10, 0.14);
  push(-0.09, 0.18); push(-0.11, 0.26); push(-0.12, 0.32); push(-0.11, 0.38);
  push(-0.12, 0.34); push(-0.10, 0.40); push(-0.08, 0.44); push(-0.06, 0.46);
  push(0.09, 0.18); push(0.11, 0.26); push(0.12, 0.32); push(0.11, 0.38);
  push(0.12, 0.34); push(0.10, 0.40); push(0.08, 0.44); push(0.06, 0.46);
  push(-0.06, 0.48); push(0.06, 0.48);
  for (let i = 0; i < 28; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({
      x: p.x + (Math.random() - 0.5) * 0.025,
      y: p.y + (Math.random() - 0.5) * 0.025,
    });
  }
  return points;
}

// Femme qui court (sprint réaliste, proportions humaines) à GAUCHE de l'écran (centre ~0.28)
function generateSprintShape(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.34 + y * 0.52 });
  // Tête (penchée, proportion humaine)
  for (let i = 0; i < 12; i++)
    push(0.04 + 0.017 * Math.cos((i / 12) * Math.PI * 2), -0.16 + 0.017 * Math.sin((i / 12) * Math.PI * 2));
  push(0.03, -0.12); push(-0.07, -0.09); push(0.08, -0.10);
  for (let t = 0; t <= 1; t += 0.06) push(0.04 + t * 0.028, -0.08 + t * 0.24);
  push(-0.02, 0.14); push(0.05, 0.14); push(0.04, 0.16); push(-0.04, 0.18); push(0.06, 0.16);
  push(-0.22, 0.02); push(-0.26, 0.08); push(-0.24, 0.14); push(-0.18, 0.18);
  push(0.18, -0.08); push(0.20, -0.04); push(0.18, 0.02); push(0.16, 0.06);
  push(-0.06, 0.20); push(-0.08, 0.28); push(-0.10, 0.38); push(-0.09, 0.46); push(-0.07, 0.52); push(-0.05, 0.56);
  push(-0.10, 0.40); push(-0.08, 0.48);
  push(0.06, 0.18); push(0.12, 0.10); push(0.18, 0.02); push(0.20, -0.04); push(0.18, -0.08);
  push(0.14, 0.00); push(0.12, 0.08);
  push(0.18, -0.06);
  // Remplissage silhouette
  for (let i = 0; i < 30; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({
      x: p.x + (Math.random() - 0.5) * 0.03,
      y: p.y + (Math.random() - 0.5) * 0.03,
    });
  }
  return points;
}

// Squat 3/4 face — FEMME (gauche), bien accroupie, vue légèrement de biais
function generateSquat34Woman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.40 + y * 0.46 });
  // Tête compacte, 3/4 (accroupi)
  for (let i = 0; i < 12; i++)
    push(0.012 * Math.cos((i / 12) * Math.PI * 2), -0.10 + 0.016 * Math.sin((i / 12) * Math.PI * 2));
  push(0, -0.08); push(-0.02, -0.06); push(0.02, -0.06);
  // Épaules 3/4 : une plus en avant (droite), une en arrière
  push(-0.08, -0.04); push(-0.04, -0.045); push(0.02, -0.05); push(0.08, -0.04); push(0.10, -0.03);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.3), -0.03 + t * 0.12);
  push(-0.05, 0.09); push(0.02, 0.10); push(0.06, 0.09);
  push(-0.06, 0.11); push(-0.02, 0.13); push(0.03, 0.135); push(0.07, 0.11);
  push(-0.12, 0.00); push(-0.14, 0.03); push(-0.12, 0.06); push(-0.08, 0.07);
  push(0.10, 0.00); push(0.12, 0.03); push(0.12, 0.06); push(0.10, 0.08);
  // Cuisse gauche (côté visible, genou vers l’extérieur)
  push(-0.07, 0.15); push(-0.09, 0.20); push(-0.10, 0.24); push(-0.09, 0.28);
  push(-0.10, 0.26); push(-0.08, 0.30); push(-0.06, 0.34); push(-0.05, 0.36);
  push(0.06, 0.15); push(0.08, 0.20); push(0.09, 0.24); push(0.09, 0.28);
  push(0.08, 0.26); push(0.07, 0.30); push(0.05, 0.34); push(0.04, 0.36);
  push(-0.05, 0.38); push(0.05, 0.38);
  for (let i = 0; i < 26; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

// Footballeur qui tape de profil — HOMME (droite), vue de profil
function generateFootballKickProfileMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.36 + y * 0.52 });
  // Tête de profil
  for (let i = 0; i < 12; i++)
    push(0.016 * Math.cos((i / 12) * Math.PI * 2), -0.14 + 0.016 * Math.sin((i / 12) * Math.PI * 2));
  push(0, -0.11); push(-0.02, -0.09); push(0.02, -0.09);
  // Torso de profil (étroit en largeur)
  for (let t = 0; t <= 1; t += 0.07) push(0.01 * (t - 0.5), -0.06 + t * 0.18);
  push(-0.03, 0.12); push(0.03, 0.12);
  // Bras équilibre : un en avant, un en arrière (profil)
  push(-0.14, 0.00); push(-0.16, 0.04); push(-0.14, 0.08);
  push(0.12, -0.02); push(0.14, 0.02); push(0.14, 0.06);
  // Jambe d’appui (verticale ou légèrement fléchie)
  push(-0.04, 0.18); push(-0.05, 0.26); push(-0.04, 0.34); push(-0.03, 0.42); push(-0.02, 0.46);
  push(-0.05, 0.30); push(-0.04, 0.38);
  // Jambe qui frappe : tendue vers l’arrière / côté (geste de frappe)
  push(0.05, 0.18); push(0.08, 0.12); push(0.14, 0.04); push(0.22, -0.04); push(0.32, -0.10); push(0.40, -0.14);
  push(0.18, 0.00); push(0.26, -0.08); push(0.34, -0.12);
  push(0.24, -0.06); push(0.30, -0.12);
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

// ——— Geometry : forme géométrique (modifiable par la suite), même style points + segments ———
function generateGeometry(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const cx = 0.5;
  const cy = 0.45;
  const r = 0.22;
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.01, y: p.y + (Math.random() - 0.5) * 0.01 });
  }
  return points;
}

// ——— Graphiques Wolopi (même style points + segments) ———
// Jauge circulaire type VBT / Posture (centre écran)
function generateGaugeCircle(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const cx = 0.5;
  const cy = 0.45;
  const r = 0.20;
  const n = 32;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 * 0.75;
    points.push({ x: cx + (r * 0.6) * Math.cos(a), y: cy + (r * 0.6) * Math.sin(a) });
  }
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.012, y: p.y + (Math.random() - 0.5) * 0.012 });
  }
  return points;
}

// Courbe type vélocité (gauche à droite, pics haut/bas plus marqués)
function generateVelocityCurve(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = 0.15 + t * 0.7;
    const y = 0.54 - 0.24 * Math.sin(t * Math.PI) - 0.08 * Math.sin(t * Math.PI * 3);
    points.push({ x, y: clamp01(y) });
  }
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = 0.18 + t * 0.64;
    const y = 0.52 - 0.20 * Math.sin(t * Math.PI);
    points.push({ x, y: clamp01(y) });
  }
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.015, y: p.y + (Math.random() - 0.5) * 0.015 });
  }
  return points;
}

// Deuxième courbe vélocité (pic au milieu plus marqué, creux plus profonds)
function generateVelocityCurve2(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const x = 0.12 + t * 0.76;
    const y = 0.60 - 0.38 * Math.exp(-Math.pow((t - 0.5) * 4, 2)) - 0.12 * Math.sin(t * Math.PI * 2);
    points.push({ x: x, y: clamp01(y) });
  }
  for (let i = 0; i < 18; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.012, y: p.y + (Math.random() - 0.5) * 0.012 });
  }
  return points;
}

// Courbe de performance (progression montante, pics et creux plus marqués)
function generatePerformanceCurve(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const x = 0.14 + t * 0.72;
    const y = 0.74 - 0.38 * t - 0.18 * Math.sin(t * Math.PI * 4) + 0.05 * (1 - t);
    points.push({ x, y: clamp01(y) });
  }
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.012, y: p.y + (Math.random() - 0.5) * 0.012 });
  }
  return points;
}

// Barres de performance (histogramme vertical, pics et creux plus marqués)
function generatePerformanceBars(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const baseY = 0.62;
  const heights = [0.12, 0.38, 0.16, 0.42, 0.20, 0.36, 0.14];
  const nBars = heights.length;
  const left = 0.18;
  const right = 0.82;
  const w = (right - left) / (nBars + 1);
  for (let b = 0; b < nBars; b++) {
    const cx = left + (b + 1) * w;
    const h = heights[b];
    for (let i = 0; i <= 8; i++) {
      const fy = i / 8;
      points.push({ x: cx - 0.012, y: baseY - fy * h });
      points.push({ x: cx + 0.012, y: baseY - fy * h });
    }
    points.push({ x: cx, y: baseY });
    points.push({ x: cx, y: baseY - h });
  }
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.01, y: p.y + (Math.random() - 0.5) * 0.01 });
  }
  return points;
}

// Fente (lunge) : jambe avant pliée, arrière tendue, buste droit — FEMME (gauche)
function generateLungeShapeWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.36 + y * 0.52 });
  // Tête
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.04, -0.09); push(0.04, -0.09);
  // Colonne verticale (buste droit en fente)
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.2);
  push(-0.04, 0.14); push(0.04, 0.14); push(0, 0.16);
  // Bras (équilibre : un peu écartés)
  push(-0.18, -0.02); push(-0.20, 0.04); push(0.18, 0.00); push(0.20, 0.08);
  push(-0.06, 0.18); push(-0.08, 0.30); push(-0.12, 0.42); push(-0.10, 0.52); push(-0.06, 0.56);
  push(-0.10, 0.38); push(-0.08, 0.48);
  push(0.06, 0.18); push(0.12, 0.22); push(0.20, 0.18); push(0.26, 0.10); push(0.24, 0.02);
  push(0.16, 0.16); push(0.20, 0.10);
  push(0.24, 0.06); push(0.22, 0.00);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.028, y: p.y + (Math.random() - 0.5) * 0.028 });
  }
  return points;
}

// Fente — HOMME (droite)
function generateLungeShapeMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.13 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.10); push(-0.05, -0.07); push(0.05, -0.07);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.04 + t * 0.18);
  push(-0.05, 0.14); push(0.05, 0.14); push(0, 0.15);
  push(-0.18, 0.00); push(-0.20, 0.06); push(0.18, -0.02); push(0.20, 0.06);
  push(0.06, 0.18); push(0.08, 0.30); push(0.12, 0.42); push(0.10, 0.52); push(0.06, 0.56);
  push(0.10, 0.38); push(0.08, 0.48);
  push(-0.06, 0.18); push(-0.12, 0.22); push(-0.20, 0.18); push(-0.26, 0.10); push(-0.24, 0.02);
  push(-0.16, 0.16); push(-0.20, 0.10); push(-0.24, 0.06); push(-0.22, 0.00);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

// Saut (jump) : bras en haut, jambes pliées ou écartées — FEMME
function generateJumpShapeWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.32 + y * 0.56 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.18 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.14); push(-0.05, -0.12); push(0.05, -0.12);
  for (let t = 0; t <= 1; t += 0.07) push(0.01 * (t - 0.5), -0.10 + t * 0.22);
  push(-0.04, 0.12); push(0.04, 0.12);
  push(-0.14, -0.20); push(-0.16, -0.28); push(-0.14, -0.36);
  push(0.14, -0.18); push(0.16, -0.28); push(0.14, -0.36);
  push(-0.12, 0.16); push(-0.14, 0.26); push(-0.12, 0.36); push(-0.08, 0.44);
  push(0.12, 0.16); push(0.14, 0.26); push(0.12, 0.36); push(0.08, 0.44);
  push(-0.10, 0.30); push(0.10, 0.30); push(-0.06, 0.48); push(0.06, 0.48);
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

// Saut — HOMME
function generateJumpShapeMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.34 + y * 0.52 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.17 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.13); push(-0.06, -0.10); push(0.06, -0.10);
  for (let t = 0; t <= 1; t += 0.07) push(0.01 * (t - 0.5), -0.08 + t * 0.20);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.16, -0.18); push(-0.18, -0.26); push(-0.16, -0.34);
  push(0.16, -0.16); push(0.18, -0.26); push(0.16, -0.34);
  push(-0.12, 0.18); push(-0.14, 0.28); push(-0.12, 0.38); push(-0.08, 0.46);
  push(0.12, 0.18); push(0.14, 0.28); push(0.12, 0.38); push(0.08, 0.46);
  push(-0.10, 0.32); push(0.10, 0.32); push(-0.06, 0.50); push(0.06, 0.50);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

// Reach (étirement bras en l'air) — FEMME
function generateReachShapeWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.38 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.16 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.12); push(-0.04, -0.10); push(0.04, -0.10);
  for (let t = 0; t <= 1; t += 0.08) push(0, -0.08 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.10, -0.18); push(-0.10, -0.28); push(-0.08, -0.36); push(-0.06, -0.42);
  push(0.10, -0.18); push(0.10, -0.28); push(0.08, -0.36); push(0.06, -0.42);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.08, 0.26); push(0.06, 0.34); push(0.04, 0.40); push(0.03, 0.44);
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

// Reach — HOMME
function generateReachShapeMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.15 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.05, -0.09); push(0.05, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.12, -0.16); push(-0.12, -0.26); push(-0.10, -0.34); push(-0.08, -0.40);
  push(0.12, -0.16); push(0.12, -0.26); push(0.10, -0.34); push(0.08, -0.40);
  push(-0.07, 0.16); push(-0.09, 0.24); push(-0.07, 0.32); push(-0.05, 0.38); push(-0.04, 0.42);
  push(0.07, 0.16); push(0.09, 0.24); push(0.07, 0.32); push(0.05, 0.38); push(0.04, 0.42);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

// Kick (jambe tendue devant ou sur le côté) — HOMME
function generateKickShapeMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.10); push(-0.05, -0.08); push(0.05, -0.08);
  for (let t = 0; t <= 1; t += 0.07) push(0.02 * (t - 0.5), -0.05 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.14, 0); push(-0.16, 0.06); push(0.12, -0.02); push(0.14, 0.04);
  // Jambe d'appui (gauche) : légèrement pliée
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  // Jambe qui kick (droite) : tendue vers l'avant / côté
  push(0.06, 0.16); push(0.12, 0.12); push(0.20, 0.08); push(0.28, 0.06); push(0.34, 0.04);
  push(0.16, 0.10); push(0.24, 0.07); push(0.30, 0.05);
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

// ——— Poses supplémentaires (même style schématique) pour boucle 30 ———
// Étirement latéral — FEMME
function generateStretchSideWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.36 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.04, -0.09); push(0.04, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.02 * (t - 0.5), -0.06 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.14, -0.04); push(-0.18, 0.02); push(-0.16, 0.08); push(-0.12, 0.12);
  push(0.08, -0.14); push(0.10, -0.20); push(0.08, -0.26); push(0.06, -0.30);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.08, 0.26); push(0.06, 0.34); push(0.04, 0.40); push(0.03, 0.44);
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

// Équilibre sur une jambe — FEMME
function generateBalanceWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.15 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.12); push(-0.04, -0.10); push(0.04, -0.10);
  for (let t = 0; t <= 1; t += 0.07) push(0, -0.08 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.10, -0.08); push(-0.12, -0.02); push(0.10, -0.10); push(0.12, -0.04);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.10, 0.14); push(0.14, 0.08); push(0.16, 0.02); push(0.14, -0.04);
  push(0.08, 0.10); push(0.12, 0.04);
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

// Accroupie (crouch) — FEMME
function generateCrouchWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.40 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.10 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.08); push(-0.04, -0.06); push(0.04, -0.06);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.04 + t * 0.14);
  push(-0.04, 0.10); push(0.04, 0.10);
  push(-0.12, 0.02); push(-0.14, 0.06); push(0.12, 0.00); push(0.14, 0.04);
  push(-0.06, 0.14); push(-0.08, 0.20); push(-0.06, 0.26); push(-0.04, 0.30);
  push(0.06, 0.14); push(0.08, 0.20); push(0.06, 0.26); push(0.04, 0.30);
  push(-0.04, 0.32); push(0.04, 0.32);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

// Course variante 2 — FEMME
function generateRun2Woman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.34 + y * 0.52 });
  for (let i = 0; i < 10; i++)
    push(0.018 + 0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0.02, -0.10); push(-0.04, -0.07); push(0.06, -0.08);
  for (let t = 0; t <= 1; t += 0.08) push(0.02 + t * 0.02, -0.06 + t * 0.20);
  push(0.02, 0.14); push(-0.02, 0.16); push(0.04, 0.15);
  push(-0.12, 0.04); push(-0.14, 0.10); push(0.14, -0.04); push(0.16, 0.02); push(0.14, 0.06);
  push(-0.04, 0.18); push(-0.06, 0.26); push(-0.08, 0.34); push(-0.06, 0.42); push(-0.04, 0.48);
  push(0.04, 0.16); push(0.08, 0.10); push(0.12, 0.04); push(0.14, -0.02); push(0.12, 0.02);
  push(0.10, 0.06); push(0.08, 0.12);
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.028, y: p.y + (Math.random() - 0.5) * 0.028 });
  }
  return points;
}

// Warrior (yoga) — FEMME
function generateWarriorWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.34 + y * 0.52 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.16 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.12); push(-0.05, -0.10); push(0.05, -0.10);
  for (let t = 0; t <= 1; t += 0.08) push(0.02 * (t - 0.5), -0.08 + t * 0.22);
  push(-0.04, 0.14); push(0.04, 0.14);
  push(-0.16, -0.08); push(-0.18, -0.16); push(0.14, 0.00); push(0.18, 0.10);
  push(-0.06, 0.18); push(-0.10, 0.26); push(-0.14, 0.36); push(-0.12, 0.46); push(-0.08, 0.52);
  push(0.06, 0.18); push(0.14, 0.20); push(0.24, 0.14); push(0.30, 0.06); push(0.28, -0.02);
  push(0.18, 0.12); push(0.22, 0.06);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

// Récupération (marche douce) — FEMME
function generateCooldownWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.04, -0.09); push(0.04, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.10, -0.02); push(-0.12, 0.04); push(0.10, -0.04); push(0.12, 0.02);
  push(-0.05, 0.18); push(-0.06, 0.26); push(-0.05, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.05, 0.18); push(0.08, 0.22); push(0.10, 0.28); push(0.08, 0.34); push(0.06, 0.38);
  push(-0.04, 0.46); push(0.06, 0.40);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

// Fente latérale — FEMME
function generateSideLungeWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.36 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.04, -0.09); push(0.04, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.20);
  push(-0.04, 0.14); push(0.04, 0.14);
  push(-0.14, 0.00); push(-0.16, 0.06); push(0.14, 0.02); push(0.16, 0.08);
  push(-0.06, 0.18); push(-0.10, 0.26); push(-0.14, 0.30); push(-0.16, 0.26); push(-0.14, 0.22);
  push(0.04, 0.18); push(0.08, 0.26); push(0.08, 0.34); push(0.06, 0.40); push(0.04, 0.44);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

// Genou haut (high knee) — FEMME
function generateHighKneeWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.36 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.04, -0.09); push(0.04, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.02 * (t - 0.5), -0.06 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.12, 0.00); push(-0.14, 0.06); push(0.12, -0.06); push(0.14, 0.00); push(0.16, 0.08); push(0.14, 0.14);
  push(-0.05, 0.18); push(-0.06, 0.26); push(-0.05, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.05, 0.18); push(0.10, 0.14); push(0.14, 0.08);
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

// Balance bras — FEMME
function generateArmSwingWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.36 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.04, -0.09); push(0.04, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.16, 0.04); push(-0.18, 0.10); push(-0.16, 0.16);
  push(0.10, -0.08); push(0.12, -0.14); push(0.10, -0.20);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.08, 0.26); push(0.06, 0.34); push(0.04, 0.40); push(0.03, 0.44);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

// Équilibre type cigogne — FEMME
function generateStorkWoman(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.012 * Math.cos((i / 10) * Math.PI * 2), -0.15 + 0.012 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.12); push(-0.04, -0.10); push(0.04, -0.10);
  for (let t = 0; t <= 1; t += 0.08) push(0, -0.08 + t * 0.20);
  push(-0.03, 0.12); push(0.03, 0.12);
  push(-0.10, -0.06); push(-0.12, -0.02); push(0.10, -0.08); push(0.12, -0.02);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.08, 0.22); push(0.12, 0.24); push(0.16, 0.22); push(0.18, 0.18);
  push(0.10, 0.20); push(0.14, 0.20);
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

// ——— Homme (droite, centre ~0.72) ———
function generateStretchSideMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.05, -0.09); push(0.05, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.12, -0.02); push(-0.14, 0.04); push(0.14, -0.04); push(0.18, 0.02); push(0.16, 0.08);
  push(-0.07, 0.16); push(-0.09, 0.24); push(-0.07, 0.32); push(-0.05, 0.38); push(-0.04, 0.42);
  push(0.07, 0.16); push(0.09, 0.24); push(0.07, 0.32); push(0.05, 0.38); push(0.04, 0.42);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

function generatePunchMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.10); push(-0.05, -0.08); push(0.05, -0.08);
  for (let t = 0; t <= 1; t += 0.07) push(0.02 * (t - 0.5), -0.05 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.14, 0.02); push(-0.16, 0.08); push(0.12, -0.04); push(0.16, -0.02); push(0.22, 0.02); push(0.26, 0.04);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.08, 0.26); push(0.06, 0.34); push(0.04, 0.40); push(0.03, 0.44);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

function generateBlockMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.05, -0.09); push(0.05, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.14, -0.04); push(-0.16, 0.02); push(-0.14, 0.08); push(-0.10, 0.12);
  push(0.10, -0.06); push(0.12, -0.02); push(0.14, 0.04);
  push(-0.07, 0.16); push(-0.09, 0.24); push(-0.07, 0.32); push(-0.05, 0.38); push(-0.04, 0.42);
  push(0.07, 0.16); push(0.09, 0.24); push(0.07, 0.32); push(0.05, 0.38); push(0.04, 0.42);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

function generateCrouchMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.40 + y * 0.46 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.10 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.08); push(-0.05, -0.06); push(0.05, -0.06);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.04 + t * 0.14);
  push(-0.05, 0.10); push(0.05, 0.10);
  push(-0.12, 0.02); push(-0.14, 0.06); push(0.12, 0.00); push(0.14, 0.04);
  push(-0.06, 0.14); push(-0.08, 0.20); push(-0.06, 0.26); push(-0.04, 0.30);
  push(0.06, 0.14); push(0.08, 0.20); push(0.06, 0.26); push(0.04, 0.30);
  push(-0.04, 0.32); push(0.04, 0.32);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

function generateRun2Man(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.34 + y * 0.52 });
  for (let i = 0; i < 10; i++)
    push(-0.02 + 0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(-0.01, -0.10); push(-0.06, -0.08); push(0.04, -0.08);
  for (let t = 0; t <= 1; t += 0.08) push(-0.02 + t * 0.02, -0.06 + t * 0.20);
  push(-0.02, 0.14); push(-0.04, 0.16); push(0.02, 0.15);
  push(-0.14, 0.04); push(-0.16, 0.10); push(0.14, -0.04); push(0.16, 0.02); push(0.14, 0.06);
  push(-0.04, 0.18); push(-0.06, 0.26); push(-0.08, 0.34); push(-0.06, 0.42); push(-0.04, 0.48);
  push(0.04, 0.16); push(0.08, 0.10); push(0.12, 0.04); push(0.14, -0.02);
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.026, y: p.y + (Math.random() - 0.5) * 0.026 });
  }
  return points;
}

function generateWarriorMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.34 + y * 0.52 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.16 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.12); push(-0.05, -0.10); push(0.05, -0.10);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.08 + t * 0.22);
  push(-0.05, 0.14); push(0.05, 0.14);
  push(-0.16, -0.08); push(-0.18, -0.16); push(0.14, 0.00); push(0.18, 0.10);
  push(-0.06, 0.18); push(-0.14, 0.20); push(-0.24, 0.14); push(-0.30, 0.06); push(-0.28, -0.02);
  push(0.06, 0.18); push(0.10, 0.26); push(0.10, 0.36); push(0.08, 0.44); push(0.06, 0.50);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

function generateCooldownMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.05, -0.09); push(0.05, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.10, -0.02); push(-0.12, 0.04); push(0.10, -0.04); push(0.12, 0.02);
  push(-0.05, 0.18); push(-0.06, 0.26); push(-0.05, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.05, 0.18); push(0.08, 0.22); push(0.10, 0.28); push(0.08, 0.34); push(0.06, 0.38);
  push(-0.04, 0.46); push(0.06, 0.40);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

function generateSideLungeMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.38 + y * 0.48 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.11); push(-0.05, -0.09); push(0.05, -0.09);
  for (let t = 0; t <= 1; t += 0.08) push(0.01 * (t - 0.5), -0.06 + t * 0.18);
  push(-0.05, 0.14); push(0.05, 0.14);
  push(-0.14, 0.00); push(-0.16, 0.06); push(0.14, 0.02); push(0.16, 0.08);
  push(-0.04, 0.18); push(-0.08, 0.26); push(-0.08, 0.34); push(-0.06, 0.40); push(-0.04, 0.44);
  push(0.06, 0.18); push(0.10, 0.26); push(0.14, 0.30); push(0.16, 0.26); push(0.14, 0.22);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

function generateHighKneeMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.36 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.10); push(-0.05, -0.08); push(0.05, -0.08);
  for (let t = 0; t <= 1; t += 0.08) push(0.02 * (t - 0.5), -0.05 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.12, 0.00); push(-0.14, 0.06); push(0.12, -0.06); push(0.14, 0.00); push(0.16, 0.08); push(0.14, 0.14);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.10, 0.14); push(0.14, 0.08);
  for (let i = 0; i < 22; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.024, y: p.y + (Math.random() - 0.5) * 0.024 });
  }
  return points;
}

function generateBoxMan(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.34, y: 0.36 + y * 0.50 });
  for (let i = 0; i < 10; i++)
    push(0.015 * Math.cos((i / 10) * Math.PI * 2), -0.14 + 0.015 * Math.sin((i / 10) * Math.PI * 2));
  push(0, -0.10); push(-0.05, -0.08); push(0.05, -0.08);
  for (let t = 0; t <= 1; t += 0.07) push(0.02 * (t - 0.5), -0.05 + t * 0.18);
  push(-0.05, 0.12); push(0.05, 0.12);
  push(-0.14, -0.02); push(-0.16, 0.04); push(-0.14, 0.10);
  push(0.14, -0.02); push(0.16, 0.04); push(0.14, 0.10);
  push(-0.06, 0.18); push(-0.08, 0.26); push(-0.06, 0.34); push(-0.04, 0.40); push(-0.03, 0.44);
  push(0.06, 0.18); push(0.08, 0.26); push(0.06, 0.34); push(0.04, 0.40); push(0.03, 0.44);
  for (let i = 0; i < 24; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({ x: p.x + (Math.random() - 0.5) * 0.025, y: p.y + (Math.random() - 0.5) * 0.025 });
  }
  return points;
}

const SQUAT_SHAPE = generateSquatShape();
const SPRINT_SHAPE = generateSprintShape();

// ——— Particule ———
class Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  floatPhase: number;
  /** Position de flottement en normalisé 0–1 : répartie sur toute la largeur/hauteur écran */
  floatNormX: number;
  floatNormY: number;
  seedA: number;
  seedB: number;
  seedC: number;
  seedD: number;

  constructor(x: number, y: number, normX: number, normY: number) {
    this.x = this.baseX = this.targetX = x;
    this.y = this.baseY = this.targetY = y;
    this.vx = this.vy = 0;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.floatNormX = normX;
    this.floatNormY = normY;
    this.seedA = Math.random() * Math.PI * 2;
    this.seedB = Math.random() * Math.PI * 2;
    this.seedC = Math.random() * Math.PI * 2;
    this.seedD = Math.random() * Math.PI * 2;
  }

  setTarget(tx: number, ty: number) {
    this.targetX = tx;
    this.targetY = ty;
  }

  setBase(bx: number, by: number) {
    this.baseX = bx;
    this.baseY = by;
  }

  lerpTowardTarget(speed = LERP_SPEED) {
    this.x += (this.targetX - this.x) * speed;
    this.y += (this.targetY - this.y) * speed;
  }

  updateFloat(time: number, width: number, height: number, energy: number) {
    const centerX = this.floatNormX * width;
    const centerY = this.floatNormY * height;

    // Mouvement très doux au début → plus marqué progressivement (énergie 0..1)
    const e = clamp01(energy);
    const amp = lerp(0.8, 18, e);  // amplitude faible au début
    const freq1 = lerp(0.00003, 0.00028, e);
    const freq2 = lerp(0.00005, 0.00045, e);
    const freq3 = lerp(0.00008, 0.00065, e);

    const ox =
      Math.sin(time * freq1 + this.seedA) * amp +
      Math.sin(time * freq2 + this.seedB) * amp * 0.5 +
      Math.sin(time * freq3 + this.seedC) * amp * 0.2;
    const oy =
      Math.cos(time * freq1 + this.seedB) * amp +
      Math.cos(time * freq2 + this.seedC) * amp * 0.5 +
      Math.cos(time * freq3 + this.seedD) * amp * 0.2;

    // Micro-jitter discret au début
    const jitterAmp = lerp(0.03, 0.7, e);
    const jx = Math.sin(time * (freq3 * 2.2) + this.floatPhase) * jitterAmp;
    const jy = Math.cos(time * (freq2 * 1.9) + this.floatPhase * 1.1) * jitterAmp;

    this.baseX = centerX + ox + jx;
    this.baseY = centerY + oy + jy;
    this.x = this.baseX;
    this.y = this.baseY;
  }
}

// ——— Machine à états (timing en ms) ———
const FREE_FLOAT_DURATION = 12000;  // constellation 12 s
const POE_ORBIT_DURATION = 12000;  // orbite 3D vers humain 12 s
const TRANSITION_TO_POSE_DURATION = 5000;
const POSE_HUMAN_DURATION = 3000;  // humain 3 s
const POE_ORBIT2_DURATION = 12000; // orbite 3D vers graphique 12 s
const TRANSITION_TO_POSE2_DURATION = 5000;
const POSE_GRAPHIC_DURATION = 10000; // graphique 10 s
const TRANSITION_TO_FLOAT_DURATION = 5000; // retour 5 s
const CYCLE =
  FREE_FLOAT_DURATION +
  POE_ORBIT_DURATION +
  TRANSITION_TO_POSE_DURATION +
  POSE_HUMAN_DURATION +
  POE_ORBIT2_DURATION +
  TRANSITION_TO_POSE2_DURATION +
  POSE_GRAPHIC_DURATION +
  TRANSITION_TO_FLOAT_DURATION;

function getStateAt(time: number): { state: AnimationState; phase: number } {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;

  const t1 = FREE_FLOAT_DURATION;
  const t2 = t1 + POE_ORBIT_DURATION;
  const t3 = t2 + TRANSITION_TO_POSE_DURATION;
  const t4 = t3 + POSE_HUMAN_DURATION;
  const t5 = t4 + POE_ORBIT2_DURATION;
  const t6 = t5 + TRANSITION_TO_POSE2_DURATION;
  const t7 = t6 + POSE_GRAPHIC_DURATION;

  if (t < t1) return { state: "freeFloat", phase: t / FREE_FLOAT_DURATION };
  if (t < t2) return { state: "orbit", phase: (t - t1) / POE_ORBIT_DURATION };
  if (t < t3) return { state: "toPose", phase: (t - t2) / TRANSITION_TO_POSE_DURATION };
  if (t < t4) return { state: "pose", phase: (t - t3) / POSE_HUMAN_DURATION };
  if (t < t5) return { state: "orbit2", phase: (t - t4) / POE_ORBIT2_DURATION };
  if (t < t6) return { state: "toPose2", phase: (t - t5) / TRANSITION_TO_POSE2_DURATION };
  if (t < t7) return { state: "pose2", phase: (t - t6) / POSE_GRAPHIC_DURATION };
  return { state: "toFloat", phase: (t - t7) / TRANSITION_TO_FLOAT_DURATION };
}

export function DynamicConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shapesRef = useRef<{ man: Array<{ x: number; y: number }>; woman: Array<{ x: number; y: number }> }>({
    man: SQUAT_SHAPE,
    woman: SPRINT_SHAPE,
  });
  const sampledSquatRef = useRef<Array<{ x: number; y: number }> | null>(null);
  const lastStateRef = useRef<AnimationState | null>(null);
  const poseSeedRef = useRef(1);
  const cycleIndexRef = useRef(Math.floor(Math.random() * 6)); // Démarrage au milieu : première femme/homme à 14/15, on affiche d’abord 16
  const currentTargetKeyRef = useRef<"man" | "woman" | "graphic">("woman");
  const currentTargetRef = useRef<Array<{ x: number; y: number }>>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let oldWidth = width;
    let oldHeight = height;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    function setSize() {
      if (!container || !canvas) return;
      oldWidth = width;
      oldHeight = height;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Mise à l'échelle des positions pour éviter un saut au resize
      if (oldWidth > 0 && oldHeight > 0 && (oldWidth !== width || oldHeight !== height)) {
        const particles = particlesRef.current;
        particles.forEach((p) => {
          p.x *= width / oldWidth;
          p.y *= height / oldHeight;
          p.baseX *= width / oldWidth;
          p.baseY *= height / oldHeight;
          p.targetX *= width / oldWidth;
          p.targetY *= height / oldHeight;
        });
      }
    }

    function px(p: { x: number; y: number }) {
      return { x: p.x * width, y: p.y * height };
    }

    function initParticles() {
      const count = Math.max(SQUAT_SHAPE.length, SPRINT_SHAPE.length);
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const sx = SQUAT_SHAPE[i % SQUAT_SHAPE.length];
        const sy = SPRINT_SHAPE[i % SPRINT_SHAPE.length];
        const x = ((sx.x + sy.x) / 2) * width;
        const y = ((sx.y + sy.y) / 2) * height;
        // Répartition sur toute la largeur (0.02–0.98) et bande verticale (0.1–0.9)
        const normX = 0.02 + (i / Math.max(1, count - 1)) * 0.96;
        const normY = 0.1 + (Math.random() * 0.8);
        particles.push(new Particle(x, y, normX, normY));
      }
      particlesRef.current = particles;
    }

    setSize();
    initParticles();

    // Charger la silhouette squat depuis l'image de référence (optionnel, peut servir dans les poses)
    (async () => {
      try {
        const particles = particlesRef.current;
        const sampled = await samplePointsFromImage(SQUAT_REFERENCE_SRC, particles.length);
        if (!sampled || sampled.length === 0) return;
        sampledSquatRef.current = sampled;
      } catch {
        // si l'image ne charge pas, on garde la forme procédurale
      }
    })();

    const resizeObserver = new ResizeObserver(() => {
      setSize();
    });
    resizeObserver.observe(container);

    startTimeRef.current = performance.now();

    function tick() {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const time = performance.now() - startTimeRef.current;
      const { state, phase } = getStateAt(time);
      const particles = particlesRef.current;
      const shapes = shapesRef.current;

      // Discret au départ, nuage vivant, puis regroupement vers une pose sportive.
      const initialFade = easeInOutCubic(clamp01(time / 2400));
      const energy =
        state === "freeFloat"
          ? lerp(0.04, 0.92, easeInOutCubic(phase))
          : state === "orbit" || state === "orbit2"
            ? 1
            : state === "toFloat"
              ? lerp(0.92, 0.18, easeInOutCubic(phase))
              : 1;
      const nodeAlphaScale = Math.max(0.22, initialFade * lerp(0.28, 1, energy));
      const lineAlphaScale = Math.max(0.22, initialFade * lerp(0.82, 1, energy)); // toujours visible quel que soit le mode

      // Générer une nouvelle pose aléatoire à chaque entrée en transition vers la silhouette
      if (lastStateRef.current !== state) {
        const prevState = lastStateRef.current;
        lastStateRef.current = state;

        if (state === "toFloat") {
          // Fin de boucle : les points rejoignent aléatoirement le début de la création suivante (centre orbite)
          const spreadX = 0.35 + Math.random() * 0.25; // 0.35 à 0.6, aléatoire à chaque boucle
          const spreadY = 0.28 + Math.random() * 0.2;
          const cx = 0.5;
          const cy = 0.45;
          particles.forEach((p) => {
            p.floatNormX = clamp01(cx + (Math.random() - 0.5) * spreadX * 2);
            p.floatNormY = clamp01(cy + (Math.random() - 0.5) * spreadY * 2);
          });
          cycleIndexRef.current = (cycleIndexRef.current + 1) % 6;
        }
        if (state === "orbit" && prevState === "freeFloat") {
          // Prédiction : pré-charger la silhouette humaine dès l'entrée en orbite (ordre déterministe)
          const count = particles.length;
          const humanSlots = [0, 2, 4, 6, 8, 10];
          const idx = humanSlots[cycleIndexRef.current % 6];

          type PoseSlot = { key: "man" | "woman" | "graphic"; points: Array<{ x: number; y: number }> };
          const slots: PoseSlot[] = [
            { key: "woman", points: generateSquat34Woman() },
            { key: "graphic", points: generateVelocityCurve() },
            { key: "man", points: generateFootballKickProfileMan() },
            { key: "graphic", points: generateVelocityCurve2() },
            { key: "woman", points: generateSprintShape() },
            { key: "graphic", points: generatePerformanceCurve() },
            { key: "man", points: generateSquatShape() },
            { key: "graphic", points: generatePerformanceBars() },
            { key: "woman", points: generateLungeShapeWoman() },
            { key: "graphic", points: generateVelocityCurve() },
            { key: "man", points: generateLungeShapeMan() },
            { key: "graphic", points: generatePerformanceCurve() },
          ];

          const chosen = slots[idx];
          currentTargetKeyRef.current = chosen.key;
          currentTargetRef.current = chosen.points.slice(0, count);

          if (chosen.key === "man") shapesRef.current.man = chosen.points.slice(0, count);
          else if (chosen.key === "woman") shapesRef.current.woman = chosen.points.slice(0, count);
        }
        if (state === "toPose2") {
          const count = particles.length;
          const graphicSlots = [1, 3, 5, 7, 9, 11];
          const idx = graphicSlots[cycleIndexRef.current % 6];

          type PoseSlot = { key: "man" | "woman" | "graphic"; points: Array<{ x: number; y: number }> };
          const slots: PoseSlot[] = [
            { key: "woman", points: generateSquat34Woman() },
            { key: "graphic", points: generateVelocityCurve() },
            { key: "man", points: generateFootballKickProfileMan() },
            { key: "graphic", points: generateVelocityCurve2() },
            { key: "woman", points: generateSprintShape() },
            { key: "graphic", points: generatePerformanceCurve() },
            { key: "man", points: generateSquatShape() },
            { key: "graphic", points: generatePerformanceBars() },
            { key: "woman", points: generateLungeShapeWoman() },
            { key: "graphic", points: generateVelocityCurve() },
            { key: "man", points: generateLungeShapeMan() },
            { key: "graphic", points: generatePerformanceCurve() },
          ];

          const chosen = slots[idx];
          currentTargetKeyRef.current = chosen.key;
          currentTargetRef.current = chosen.points.slice(0, count);
        }
      }

      // Mise à jour des particules selon l'état
      if (state === "freeFloat") {
        particles.forEach((p) => {
          p.updateFloat(time, width, height, energy);
        });
      } else if (state === "orbit") {
        // Orbite 3D + prédiction : les points convergent progressivement vers la silhouette humaine
        const cx = 0.5 * width;
        const cy = 0.45 * height;
        const r = 0.22 * Math.min(width, height);
        const tiltAngle = 0.3 + 0.5 * Math.sin(phase * Math.PI * 2);
        const rotationAngle = phase * Math.PI * 2;
        const baseSpeed = 0.018; // ralenti orbite constellation → humain
        const speed = baseSpeed * (0.12 + 0.88 * easeInExpo(phase));
        const depthScale = 0.15;
        const targetShape = currentTargetRef.current;
        const hasTarget = targetShape.length > 0;
        // Blend : 0 → 0.55 sur la phase (prédiction progressive, regroupement avant humain)
        const blend = hasTarget ? easeInOutCubic(phase) * 0.55 : 0;
        particles.forEach((p, i) => {
          const theta = (i / particles.length) * Math.PI * 2;
          const x3d = r * Math.cos(theta);
          const y3d = r * Math.cos(tiltAngle) * Math.sin(theta);
          const z3d = r * Math.sin(tiltAngle) * Math.sin(theta);
          const xr = x3d * Math.cos(rotationAngle) - y3d * Math.sin(rotationAngle);
          const yr = x3d * Math.sin(rotationAngle) + y3d * Math.cos(rotationAngle);
          const zr = z3d;
          const depthFactor = 1 - zr * depthScale / r;
          const orbitX = cx + xr * depthFactor;
          const orbitY = cy + yr * depthFactor;
          const humanPt = hasTarget ? targetShape[i % targetShape.length] : null;
          const humanX = humanPt ? humanPt.x * width : orbitX;
          const humanY = humanPt ? humanPt.y * height : orbitY;
          const tx = lerp(orbitX, humanX, blend);
          const ty = lerp(orbitY, humanY, blend);
          p.setTarget(tx, ty);
          p.lerpTowardTarget(speed);
        });
      } else if (state === "toPose") {
        const targetShape = currentTargetRef.current;
        const baseSpeed = 0.022; // transition plus lente constellation → silhouette
        const speed = baseSpeed * (0.12 + 0.88 * easeInExpo(phase));
        particles.forEach((p, i) => {
          const target = px(targetShape[i % targetShape.length]);
          p.setTarget(target.x, target.y);
          p.lerpTowardTarget(speed);
        });
      } else if (state === "pose") {
        const targetShape = currentTargetRef.current;
        const speed = 0.065; // poursuite continue de la cible + wobble
        particles.forEach((p, i) => {
          const target = px(targetShape[i % targetShape.length]);
          p.setTarget(target.x, target.y);
          p.lerpTowardTarget(speed);
        });

        // Mouvement continu en pose (respiration + micro-dérive, pas d'arrêt)
        const wobble = 0.42;
        const wobbleFreq = 0.0014;
        particles.forEach((p, idx) => {
          const a = (idx % 7) * 0.8 + p.floatPhase;
          p.x += Math.sin(time * wobbleFreq + a) * wobble;
          p.y += Math.cos(time * (wobbleFreq * 0.85) + a * 1.1) * wobble;
        });
      } else if (state === "orbit2") {
        const cx = 0.5 * width;
        const cy = 0.45 * height;
        const r = 0.22 * Math.min(width, height);
        const tiltAngle = 0.3 + 0.5 * Math.sin(phase * Math.PI * 2);
        const rotationAngle = phase * Math.PI * 2;
        const baseSpeed = 0.018;
        const speed = baseSpeed * (0.12 + 0.88 * easeInExpo(phase));
        const depthScale = 0.15;
        particles.forEach((p, i) => {
          const theta = (i / particles.length) * Math.PI * 2;
          const x3d = r * Math.cos(theta);
          const y3d = r * Math.cos(tiltAngle) * Math.sin(theta);
          const z3d = r * Math.sin(tiltAngle) * Math.sin(theta);
          const xr = x3d * Math.cos(rotationAngle) - y3d * Math.sin(rotationAngle);
          const yr = x3d * Math.sin(rotationAngle) + y3d * Math.cos(rotationAngle);
          const zr = z3d;
          const depthFactor = 1 - zr * depthScale / r;
          const tx = cx + xr * depthFactor;
          const ty = cy + yr * depthFactor;
          p.setTarget(tx, ty);
          p.lerpTowardTarget(speed);
        });
      } else if (state === "toPose2") {
        const targetShape = currentTargetRef.current;
        const baseSpeed = 0.022;
        const speed = baseSpeed * (0.12 + 0.88 * easeInExpo(phase));
        particles.forEach((p, i) => {
          const target = px(targetShape[i % targetShape.length]);
          p.setTarget(target.x, target.y);
          p.lerpTowardTarget(speed);
        });
      } else if (state === "pose2") {
        const targetShape = currentTargetRef.current;
        const speed = 0.065;
        particles.forEach((p, i) => {
          const target = px(targetShape[i % targetShape.length]);
          p.setTarget(target.x, target.y);
          p.lerpTowardTarget(speed);
        });
        const wobble = 0.42;
        const wobbleFreq = 0.0014;
        particles.forEach((p, idx) => {
          const a = (idx % 7) * 0.8 + p.floatPhase;
          p.x += Math.sin(time * wobbleFreq + a) * wobble;
          p.y += Math.cos(time * (wobbleFreq * 0.85) + a * 1.1) * wobble;
        });
      } else if (state === "toFloat") {
        const baseSpeed = 0.022; // transition plus lente silhouette → constellation
        const speed = baseSpeed * (0.12 + 0.88 * easeInExpo(phase));
        particles.forEach((p) => {
          const tx = p.floatNormX * width;
          const ty = p.floatNormY * height;
          p.setTarget(tx, ty);
          p.lerpTowardTarget(speed);
        });
      }

      // Clear
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const isSilhouette = state === "pose" || state === "toPose" || state === "orbit" || state === "orbit2" || state === "toPose2" || state === "pose2";
      const isGraphic = isSilhouette && currentTargetKeyRef.current === "graphic";
      const strokeColor = isGraphic ? GRAPHIC_COLOR : COLOR;
      const connectionDist = isSilhouette ? (isGraphic ? 130 : 145) : CONNECTION_DISTANCE;
      const lineW = isSilhouette ? (isGraphic ? 0.55 : 0.7) : LINE_WIDTH;
      const lineBoost = isSilhouette ? (isGraphic ? 1.2 : 1.35) : 1;

      // Connexions (segments entre points proches uniquement)
      ctx.lineWidth = lineW;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist > connectionDist) continue;
          const baseOpacity = isSilhouette ? (isGraphic ? 0.42 : 0.48) : 0.52;
          const opacity = Math.max(0.02, baseOpacity * (1 - dist / connectionDist)) * lineAlphaScale * lineBoost;
          ctx.strokeStyle = `${strokeColor}${Math.min(1, opacity).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nœuds : allure schématique et positive en silhouette (plus visibles, halo renforcé)
      const nodeRadius = isSilhouette ? (isGraphic ? PARTICLE_RADIUS * 1.15 : PARTICLE_RADIUS * 1.35) : PARTICLE_RADIUS;
      const haloRadius = isSilhouette ? (isGraphic ? PARTICLE_RADIUS * 2 : PARTICLE_RADIUS * 2.4) : PARTICLE_RADIUS * 1.8;
      const haloAlpha = isSilhouette ? (isGraphic ? 0.32 : 0.38) : 0.22;
      const coreAlpha = isSilhouette ? (isGraphic ? 0.92 : 1) : 0.85;
      particles.forEach((p) => {
        if (isSilhouette && !isGraphic) {
          // Léger glow externe pour silhouettes humaines
          const glowR = haloRadius * 1.5;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          g.addColorStop(0, `rgba(0, 255, 220, ${(0.12 * nodeAlphaScale).toFixed(3)})`);
          g.addColorStop(0.6, `rgba(0, 255, 200, ${(0.04 * nodeAlphaScale).toFixed(3)})`);
          g.addColorStop(1, "rgba(0, 255, 200, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        } else if (isGraphic) {
          // Style graphique : glow discret bleu clair
          const glowR = haloRadius * 1.2;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          g.addColorStop(0, `rgba(100, 220, 255, ${(0.08 * nodeAlphaScale).toFixed(3)})`);
          g.addColorStop(0.7, `rgba(100, 220, 255, ${(0.02 * nodeAlphaScale).toFixed(3)})`);
          g.addColorStop(1, "rgba(100, 220, 255, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `${strokeColor}${(haloAlpha * nodeAlphaScale).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `${strokeColor}${(coreAlpha * nodeAlphaScale).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(tick);
    }

    tick();
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ width: "100%", height: "100%" }}
        aria-hidden
      />
    </div>
  );
}
