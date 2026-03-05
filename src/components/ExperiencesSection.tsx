"use client";

import { motion } from "framer-motion";
import { Trophy, Crosshair, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const experiences = [
  {
    key: "exp1",
    icon: Trophy,
    iconLabel: "Arena",
    accent: "arena" as const,
  },
  {
    key: "exp2",
    icon: Crosshair,
    iconLabel: "Performance",
    accent: "performance" as const,
  },
  {
    key: "exp3",
    icon: LayoutDashboard,
    iconLabel: "Hub Pro",
    accent: "hub" as const,
  },
];

const accentStyles = {
  arena:
    "border-accent/40 bg-gradient-to-br from-accent/15 to-transparent shadow-[0_0_30px_-8px_rgba(225,29,72,0.35)] dark:shadow-[0_0_30px_-8px_rgba(225,29,72,0.25)]",
  performance:
    "border-secondary/40 bg-gradient-to-br from-secondary/15 to-transparent shadow-[0_0_30px_-8px_rgba(6,182,212,0.3)] dark:shadow-[0_0_30px_-8px_rgba(6,182,212,0.2)]",
  hub: "border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-transparent dark:from-amber-400/10 shadow-[0_0_30px_-8px_rgba(245,158,11,0.25)] dark:shadow-[0_0_30px_-8px_rgba(245,158,11,0.2)]",
};

const iconStyles = {
  arena: "bg-accent/20 text-accent border-accent/30",
  performance: "bg-secondary/20 text-secondary border-secondary/30",
  hub: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-400/30",
};

export function ExperiencesSection() {
  const { t } = useLanguage();

  return (
    <section
      id="experiences"
      className="relative border-t border-border/50 bg-background px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("exp_heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("exp_subtitle")}
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {experiences.map(({ key, icon: Icon, accent }, index) => (
            <motion.article
              key={key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-6 transition-all hover:border-opacity-80 sm:p-8",
                accentStyles[accent]
              )}
            >
              <div
                className={cn(
                  "mb-5 inline-flex rounded-xl border p-3",
                  iconStyles[accent]
                )}
              >
                <Icon size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t(`${key}_title`)}
              </h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
                {t(`${key}_subtitle`)}
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {t(`${key}_desc`)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
