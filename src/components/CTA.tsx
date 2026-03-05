"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Upload } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export function CTA() {
  const { t } = useLanguage();
  return (
    <section id="download" className="relative overflow-hidden border-t border-border/50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-card/80 p-8 text-center backdrop-blur sm:p-12"
      >
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t("cta_heading")}
        </h2>
        <p className="mt-4 text-muted-foreground">
          {t("cta_subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/telecharger"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,212,170,0.35)] transition-all hover:shadow-[0_0_32px_rgba(0,212,170,0.5)] sm:w-auto"
            prefetch={true}
          >
            <Upload size={20} />
            {t("cta_analyze")}
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-transparent px-8 py-4 font-semibold text-foreground transition-colors hover:bg-card sm:w-auto"
          >
            <LayoutDashboard size={20} />
            {t("cta_access")}
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          {t("cta_platforms")}
        </p>
      </motion.div>
    </section>
  );
}
