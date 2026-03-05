"use client";

import { motion } from "framer-motion";
import { Video, BarChart3, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const stepConfig = [
  { number: "01", key: "how1", icon: Video },
  { number: "02", key: "how2", icon: BarChart3 },
  { number: "03", key: "how3", icon: TrendingUp },
];

export function HowItWorks() {
  const { t } = useLanguage();
  const steps = stepConfig.map(({ number, key, icon }) => ({
    number,
    title: t(`${key}_title`),
    description: t(`${key}_desc`),
    icon,
  }));
  return (
    <section id="how-it-works" className="relative px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("how_heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("how_subtitle")}
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              {index < steps.length - 1 && (
                <div
                  className="absolute top-12 hidden h-px bg-gradient-to-r from-border to-transparent md:block"
                  style={{ left: "calc(50% + 2rem)", width: "calc(100% - 2rem)" }}
                />
              )}
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
                <step.icon className="text-primary" size={36} strokeWidth={1.5} />
                <span className="absolute -right-2 -top-2 text-2xl font-bold text-primary/40">
                  {step.number}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
