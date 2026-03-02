"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accentColor?: "primary" | "secondary" | "accent";
  index?: number;
}

const accentStyles = {
  primary: "from-primary/20 to-primary/5 border-primary/30 text-primary",
  secondary: "from-secondary/20 to-secondary/5 border-secondary/30 text-secondary",
  accent: "from-accent/20 to-accent/5 border-accent/30 text-accent",
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  accentColor = "primary",
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/80 p-6 backdrop-blur transition-all hover:border-opacity-80 sm:p-8",
        accentColor === "primary" && "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent",
        accentColor === "secondary" && "border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent",
        accentColor === "accent" && "border-accent/30 bg-gradient-to-br from-accent/10 to-transparent"
      )}
    >
      <div
        className={cn(
          "mb-4 inline-flex rounded-xl border bg-card/80 p-3 backdrop-blur",
          accentStyles[accentColor]
        )}
      >
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </motion.article>
  );
}
