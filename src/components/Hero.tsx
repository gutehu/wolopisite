"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Smartphone, ChevronDown, Trophy, Activity } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { DynamicConstellationBackground } from "./DynamicConstellationBackground";

const PHONE_WIDTH = 200;

export function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.5]);
  const phonesOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);
  const cardsOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.4]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-hidden px-4 pt-28 pb-12 sm:px-6 sm:pt-36 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-10 xl:gap-10 xl:px-14"
      style={{ background: "#0c0c0d" }}
    >
      {/* Fond Biomécanique Tech : constellation en arrière-plan (femme gauche, homme droite) */}
      <div
        className="hero-fond-style-effect pointer-events-none absolute inset-y-0 left-1/2 z-0 w-screen -translate-x-1/2 overflow-hidden opacity-60"
        data-hero-fond-effect
        aria-hidden
      >
        <DynamicConstellationBackground />
      </div>

      {/* Colonne gauche : titre, sous-titre, CTA principal, labels flottants */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex flex-1 flex-col items-center text-center lg:max-w-md lg:items-start lg:text-left xl:max-w-lg"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
        >
          <span className="block text-[#00d4aa]">WOLOPI</span>
          <span className="block text-white">{t("hero_title_line1")}</span>
          <span className="block text-white">{t("hero_title_line2")}</span>
          <span className="block text-white">{t("hero_title_line3")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 max-w-md text-base text-zinc-400 sm:text-lg lg:max-w-sm"
        >
          {t("hero_subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start"
        >
          <Link
            href="/telecharger"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00d4aa] px-8 py-3.5 text-base font-semibold text-zinc-900 shadow-[0_0_28px_rgba(0,212,170,0.4)] transition-all hover:shadow-[0_0_36px_rgba(0,212,170,0.55)]"
          >
            <Smartphone size={20} />
            {t("hero_start_analysis")}
          </Link>
        </motion.div>

        {/* Labels flottants type SEQOIA / JUMP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative mt-8 flex flex-wrap items-center gap-4 lg:gap-6"
        >
          {["ARENA", "VBT"].map((label, i) => (
            <motion.span
              key={label}
              className="text-sm font-semibold tracking-wider text-[#00d4aa]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              style={{ textShadow: "0 0 20px rgba(0,212,170,0.5)" }}
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Colonne centrale : smartphone fictif vide */}
      <motion.div
        style={{ opacity: phonesOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 flex shrink-0 items-center justify-center py-8 lg:py-0"
      >
        <div
          className="overflow-hidden rounded-2xl border border-zinc-600/80 bg-zinc-800/90 p-2 shadow-2xl"
          style={{ width: PHONE_WIDTH }}
        >
          <div
            className="relative aspect-[9/19] w-full overflow-hidden rounded-xl bg-zinc-900"
            aria-hidden
          />
        </div>
      </motion.div>

      {/* Colonne droite : deux cartes feature */}
      <motion.div
        style={{ opacity: cardsOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 flex flex-1 flex-col gap-4 lg:max-w-xs xl:max-w-sm"
      >
        <Link
          href="/#features"
          className="group rounded-2xl border border-[#00d4aa]/30 bg-zinc-900/80 p-5 backdrop-blur transition-all hover:border-[#00d4aa]/50 hover:shadow-[0_0_24px_rgba(0,212,170,0.15)]"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#00d4aa]/10">
            <Trophy className="h-5 w-5 text-[#00d4aa]" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t("hero_card_arena_title")}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">{t("hero_card_arena_desc")}</p>
          <span className="mt-4 inline-block rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-zinc-900 transition-opacity group-hover:opacity-90">
            {t("hero_card_arena_cta")}
          </span>
        </Link>

        <Link
          href="/#features"
          className="group rounded-2xl border border-[#00d4aa]/30 bg-zinc-900/80 p-5 backdrop-blur transition-all hover:border-[#00d4aa]/50 hover:shadow-[0_0_24px_rgba(0,212,170,0.15)]"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#00d4aa]/10">
            <Activity className="h-5 w-5 text-[#00d4aa]" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t("hero_card_scan_title")}
          </h3>
          <p className="mt-2 text-sm text-zinc-400">{t("hero_card_scan_desc")}</p>
          <span className="mt-4 inline-block rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-zinc-900 transition-opacity group-hover:opacity-90">
            {t("hero_card_scan_cta")}
          </span>
        </Link>
      </motion.div>

      <a
        href="#features"
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-zinc-500 transition-colors hover:text-[#00d4aa]"
        aria-label="Scroll to content"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={28} />
        </motion.div>
      </a>
    </section>
  );
}
