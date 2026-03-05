"use client";

import { useRef, useEffect } from "react";

// ——— Constantes ———
const PARTICLE_RADIUS = 3;
const LINE_WIDTH = 0.5;
const CONNECTION_DISTANCE = 120;
const LERP_SPEED = 0.03;
const FLOAT_STRENGTH = 0.4;
const COLOR = "rgba(0, 255, 200, ";

type AnimationState = "freeFloat" | "transitionToSquat" | "squat" | "transitionToSprint" | "sprint" | "transitionToFloat";

// ——— Formes en coordonnées relatives (0–1) ———
// Homme (squat) à DROITE de l'écran (centre ~0.72)
function generateSquatShape(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.72 + x * 0.32, y: 0.35 + y * 0.5 });
  // Tête
  for (let i = 0; i < 8; i++) push(0.02 * Math.cos((i / 8) * Math.PI * 2), -0.12 + 0.02 * Math.sin((i / 8) * Math.PI * 2));
  // Nuque / épaules
  push(0, -0.08); push(-0.06, -0.06); push(0.06, -0.06);
  // Colonne
  for (let t = 0; t <= 1; t += 0.08) push(-0.02 + t * 0.04, -0.04 + t * 0.15);
  // Bassin
  push(-0.05, 0.12); push(0.05, 0.12); push(0, 0.14);
  // Bras (écartés / devant en squat)
  push(-0.14, 0); push(-0.16, 0.04); push(-0.15, 0.08);
  push(0.14, 0.02); push(0.15, 0.06); push(0.14, 0.1);
  // Jambes pliées (squat)
  push(-0.08, 0.18); push(-0.12, 0.28); push(-0.1, 0.38); push(-0.06, 0.42);
  push(0.08, 0.2); push(0.1, 0.3); push(0.12, 0.38); push(0.08, 0.44);
  // Genoux, chevilles
  push(-0.1, 0.32); push(-0.06, 0.4); push(0.1, 0.34); push(0.08, 0.42);
  // Remplissage densité
  for (let i = 0; i < 30; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({
      x: p.x + (Math.random() - 0.5) * 0.04,
      y: p.y + (Math.random() - 0.5) * 0.04,
    });
  }
  return points;
}

// Femme (sprint) à GAUCHE de l'écran (centre ~0.28)
function generateSprintShape(): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => points.push({ x: 0.28 + x * 0.32, y: 0.32 + y * 0.55 });
  // Tête (légèrement penchée avant)
  for (let i = 0; i < 8; i++) push(0.03 + 0.02 * Math.cos((i / 8) * Math.PI * 2), -0.14 + 0.02 * Math.sin((i / 8) * Math.PI * 2));
  // Épaules (inclinées)
  push(-0.04, -0.1); push(0.06, -0.08);
  // Colonne (inclinée course)
  for (let t = 0; t <= 1; t += 0.1) push(0.02 + t * 0.02, -0.06 + t * 0.2);
  // Bassin
  push(0, 0.14); push(-0.04, 0.16); push(0.04, 0.15);
  // Bras (mouvement course : un devant, un derrière)
  push(-0.12, -0.04); push(-0.16, 0.02); push(-0.14, 0.08);
  push(0.14, -0.06); push(0.18, 0); push(0.16, 0.06);
  // Jambe arrière (extension)
  push(-0.06, 0.2); push(-0.08, 0.32); push(-0.06, 0.42); push(-0.04, 0.5);
  // Jambe avant (pliée, en avant)
  push(0.06, 0.18); push(0.12, 0.22); push(0.2, 0.18); push(0.24, 0.12);
  // Pieds, genoux
  push(-0.04, 0.48); push(0.22, 0.1); push(0.1, 0.24);
  for (let i = 0; i < 35; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
    points.push({
      x: p.x + (Math.random() - 0.5) * 0.04,
      y: p.y + (Math.random() - 0.5) * 0.04,
    });
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

  constructor(x: number, y: number, normX: number, normY: number) {
    this.x = this.baseX = this.targetX = x;
    this.y = this.baseY = this.targetY = y;
    this.vx = this.vy = 0;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.floatNormX = normX;
    this.floatNormY = normY;
  }

  setTarget(tx: number, ty: number) {
    this.targetX = tx;
    this.targetY = ty;
  }

  setBase(bx: number, by: number) {
    this.baseX = bx;
    this.baseY = by;
  }

  lerpTowardTarget() {
    this.x += (this.targetX - this.x) * LERP_SPEED;
    this.y += (this.targetY - this.y) * LERP_SPEED;
  }

  updateFloat(time: number, width: number, height: number) {
    const centerX = this.floatNormX * width;
    const centerY = this.floatNormY * height;
    this.baseX = centerX + Math.sin(time * 0.0008 + this.floatPhase) * FLOAT_STRENGTH;
    this.baseY = centerY + Math.cos(time * 0.0006 + this.floatPhase * 1.1) * FLOAT_STRENGTH;
    this.x = this.baseX;
    this.y = this.baseY;
  }
}

// ——— Machine à états (timing en ms) ———
// Rythme plus lent sur femme ↔ homme. Boucle : Float → Femme (gauche) → Trans lente → Homme (droite) → Trans lente → Float…
const FREE_FLOAT_DURATION = 5000;
const TRANSITION_DURATION = 2000;        // vers/depuis float
const TRANSITION_SHAPE_DURATION = 4500;  // transition lente femme ↔ homme
const SHAPE_HOLD_DURATION = 7000;        // durée affichage femme ou homme (7s)
const CYCLE =
  FREE_FLOAT_DURATION * 2 +
  TRANSITION_DURATION * 3 +
  TRANSITION_SHAPE_DURATION +
  SHAPE_HOLD_DURATION * 2;

function getStateAt(time: number): { state: AnimationState; phase: number } {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;

  const t1 = FREE_FLOAT_DURATION;
  const t2 = t1 + TRANSITION_DURATION;
  const t3 = t2 + SHAPE_HOLD_DURATION;           // fin squat (homme droite)
  const t4 = t3 + TRANSITION_SHAPE_DURATION;     // fin trans → sprint (femme gauche)
  const t5 = t4 + SHAPE_HOLD_DURATION;            // fin sprint
  const t6 = t5 + TRANSITION_DURATION;            // fin trans → float
  const t7 = t6 + FREE_FLOAT_DURATION;            // fin 2e float

  if (t < t1) return { state: "freeFloat", phase: t / t1 };
  if (t < t2) return { state: "transitionToSquat", phase: (t - t1) / TRANSITION_DURATION };
  if (t < t3) return { state: "squat", phase: (t - t2) / SHAPE_HOLD_DURATION };
  if (t < t4) return { state: "transitionToSprint", phase: (t - t3) / TRANSITION_SHAPE_DURATION };
  if (t < t5) return { state: "sprint", phase: (t - t4) / SHAPE_HOLD_DURATION };
  if (t < t6) return { state: "transitionToFloat", phase: (t - t5) / TRANSITION_DURATION };
  if (t < t7) return { state: "freeFloat", phase: (t - t6) / FREE_FLOAT_DURATION };
  return { state: "transitionToSquat", phase: (t - t7) / TRANSITION_DURATION };
}

export function DynamicConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
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

      // Mise à jour des particules selon l'état
      if (state === "freeFloat") {
        particles.forEach((p) => {
          p.updateFloat(time, width, height);
        });
      } else if (state === "transitionToSquat") {
        particles.forEach((p, i) => {
          const target = px(SQUAT_SHAPE[i % SQUAT_SHAPE.length]);
          p.setTarget(target.x, target.y);
          p.setBase(target.x, target.y);
          p.lerpTowardTarget();
        });
      } else if (state === "squat") {
        particles.forEach((p, i) => {
          const target = px(SQUAT_SHAPE[i % SQUAT_SHAPE.length]);
          p.setTarget(target.x, target.y);
          p.lerpTowardTarget();
        });
      } else if (state === "transitionToSprint" || state === "sprint") {
        particles.forEach((p, i) => {
          const target = px(SPRINT_SHAPE[i % SPRINT_SHAPE.length]);
          p.setTarget(target.x, target.y);
          p.lerpTowardTarget();
        });
      } else if (state === "transitionToFloat") {
        particles.forEach((p) => {
          const tx = p.floatNormX * width;
          const ty = p.floatNormY * height;
          p.setBase(tx, ty);
          p.setTarget(tx, ty);
          p.lerpTowardTarget();
        });
      }

      // Clear
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Connexions (segments très fins, opacité par distance)
      ctx.lineWidth = LINE_WIDTH;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist > CONNECTION_DISTANCE) continue;
          const opacity = Math.max(0.05, 0.35 * (1 - dist / CONNECTION_DISTANCE));
          ctx.strokeStyle = `${COLOR}${opacity.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nœuds (points bien visibles : halo puis cœur)
      particles.forEach((p) => {
        ctx.fillStyle = `${COLOR}0.35)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PARTICLE_RADIUS * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `${COLOR}0.95)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
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
