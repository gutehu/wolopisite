"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Brain } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FeatureCard } from "./FeatureCard";

const featureKeys = [
  { key: "feature1", icon: Zap, accentColor: "primary" as const },
  { key: "feature2", icon: Shield, accentColor: "secondary" as const },
  { key: "feature3", icon: Brain, accentColor: "accent" as const },
];

export function Features() {
  const { t } = useLanguage();
  const features = featureKeys.map(({ key, icon, accentColor }) => ({
    title: t(`${key}_title`),
    description: t(`${key}_desc`),
    icon,
    accentColor,
  }));
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
            {t("features_heading")}
          </h2>
          {t("features_subtitle") && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t("features_subtitle")}
            </p>
          )}
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
