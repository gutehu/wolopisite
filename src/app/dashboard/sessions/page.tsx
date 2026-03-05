"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, BarChart3, Loader2 } from "lucide-react";
import { parseSvfToViewState, loadSvfFromStorage } from "@/lib/svf-dashboard";
import type { ViewState } from "@/lib/svf-dashboard";
import { SvfDashboardView } from "@/components/SvfDashboardView";

export default function DashboardSessionsPage() {
  const [view, setView] = useState<ViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVelocityIndex, setSelectedVelocityIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = loadSvfFromStorage();
    if (stored) {
      const state = parseSvfToViewState(stored.content, stored.fileName);
      setView(state ?? null);
    } else {
      setView(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Retour au dashboard
        </Link>

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Affichage dashboard</h1>
        <p className="mb-8 text-muted-foreground">
          Sessions enregistrées après import — même affichage que sur l&apos;app mobile.
        </p>

        {!view ? (
          <div className="rounded-2xl border border-border bg-card/80 p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/40 bg-secondary/10">
              <BarChart3 className="text-secondary" size={32} />
            </div>
            <p className="text-muted-foreground">
              Aucune session enregistrée.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Importez un fichier .svf ou .json depuis la page Import pour le visualiser ici.
            </p>
            <Link
              href="/dashboard/import"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Upload size={20} />
              Importer des données
            </Link>
          </div>
        ) : (
          <SvfDashboardView
            view={view}
            selectedVelocityIndex={selectedVelocityIndex}
            setSelectedVelocityIndex={setSelectedVelocityIndex}
            showHeader={true}
            onReset={undefined}
          />
        )}
      </div>
    </div>
  );
}
