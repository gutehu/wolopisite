"use client";

import { motion } from "framer-motion";
import { Gauge, Activity, Zap } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    title: "Analyse de vélocité à la barre",
    description:
      "Velocity Based Training (VBT) : mesurez la vélocité de chaque répétition en temps réel avec votre smartphone. Optimisez vos charges et suivez la fatigue.",
    icon: Gauge,
    accentColor: "primary" as const,
  },
  {
    title: "Tests de mobilité articulaire",
    description:
      "Évaluez la mobilité et les amplitudes articulaires via des protocoles standardisés. Idéal pour la prévention et le suivi réathlétisation.",
    icon: Activity,
    accentColor: "secondary" as const,
  },
  {
    title: "Analyse de sauts & profil force-vitesse",
    description:
      "Sauts verticaux et profils force-vitesse pour quantifier la puissance et la pliométrie. Données exploitables pour la programmation.",
    icon: Zap,
    accentColor: "accent" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="relative border-t border-border/50 bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trois piliers pour une analyse complète
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Vélocité, mobilité et puissance : tout ce dont vous avez besoin pour piloter la performance.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
