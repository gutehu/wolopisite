"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const SLIDES = [
  { src: "/app-preview/dashboard-velocity.png", alt: "Dashboard Velocity — Vitesse et puissance par répétition" },
  { src: "/app-preview/velocity-video.png", alt: "Velocity Vidéo — Analyse avec suivi du mouvement" },
  { src: "/app-preview/comparaison-velocity.png", alt: "Comparaison Velocity — Graphiques vélocité et puissance" },
] as const;

const DURATION_PER_SLIDE = 4;

export function AppPreviewCarousel() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900">
      <motion.div
        className="flex h-full w-full"
        animate={{
          x: ["0%", "-100%", "-200%", "0%"],
        }}
        transition={{
          duration: SLIDES.length * DURATION_PER_SLIDE,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.33, 0.66, 1],
        }}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.src}
            className="relative h-full min-w-full flex-shrink-0"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 320px) 260px, 280px"
              priority
            />
          </div>
        ))}
      </motion.div>
      {/* Indicateurs de slide */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-1 w-1.5 rounded-full bg-white/50"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
