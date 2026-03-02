"use client";

import { motion } from "framer-motion";
import { Smartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppPreviewCarousel } from "./AppPreviewCarousel";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden px-4 pt-28 pb-20 sm:px-6 sm:pt-36 lg:px-8">
      {/* Fond gradient / grille */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,212,170,0.12),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary"
        >
          <Sparkles size={16} />
          <span>Performance par IA</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Votre smartphone est votre{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            laboratoire de performance
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          Analyse de vélocité, tests de mobilité et profils force-vitesse.
          <br className="hidden sm:block" />
          Mesurez, analysez et progressez avec l&apos;IA.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="#download"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,212,170,0.35)] transition-all hover:shadow-[0_0_32px_rgba(0,212,170,0.5)] sm:w-auto"
          >
            <Smartphone size={20} />
            Télécharger l&apos;App
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/50 px-8 py-4 text-base font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 sm:w-auto"
          >
            Espace Coach <span className="text-muted-foreground">(Bientôt)</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="rounded-2xl border border-border/80 bg-card/50 p-2 shadow-2xl backdrop-blur">
            <div className="aspect-[9/19] w-[260px] overflow-hidden rounded-xl bg-zinc-900 sm:w-[280px]">
              <AppPreviewCarousel />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
