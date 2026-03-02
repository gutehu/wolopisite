"use client";

import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import Link from "next/link";

export function CTA() {
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
          Prêt à transformer votre entraînement ?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Téléchargez Wolopi et accédez à l&apos;analyse performance par IA.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,212,170,0.35)] transition-all hover:shadow-[0_0_32px_rgba(0,212,170,0.5)] sm:w-auto"
          >
            <Smartphone size={20} />
            Télécharger l&apos;App
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full border border-border bg-transparent px-8 py-4 font-semibold text-foreground transition-colors hover:bg-card sm:w-auto"
          >
            Espace Coach (Bientôt)
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          iOS et Android — Disponible prochainement
        </p>
      </motion.div>
    </section>
  );
}
