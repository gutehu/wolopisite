"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { Upload, FileJson, ArrowLeft, History } from "lucide-react";
import {
  parseSvfToViewState,
  saveSvfToStorage,
  loadSvfFromStorage,
  hasStoredSvf,
  type ViewState,
} from "@/lib/svf-dashboard";
import { SvfDashboardView } from "@/components/SvfDashboardView";

export default function DashboardImportPage() {
  const [view, setView] = useState<ViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasStoredSession, setHasStoredSession] = useState(false);
  const [selectedVelocityIndex, setSelectedVelocityIndex] = useState<Record<string, number>>({});

  const applyParsedView = useCallback((content: string, fileName: string) => {
    const state = parseSvfToViewState(content, fileName);
    if (state) {
      setView(state);
      setError(null);
      saveSvfToStorage(content, fileName);
      setSelectedVelocityIndex({});
    } else {
      setError("Fichier JSON invalide ou format SVF non reconnu. Utilisez un export avec dashboards_by_athlete ou sessions.");
      setView(null);
    }
  }, []);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "svf" && ext !== "json") {
        setError("Accepté : .svf ou .json");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => applyParsedView(reader.result as string, file.name);
      reader.onerror = () => setError("Impossible de lire le fichier.");
      reader.readAsText(file, "utf-8");
    },
    [applyParsedView]
  );

  const loadStoredSession = useCallback(() => {
    const stored = loadSvfFromStorage();
    if (stored) {
      applyParsedView(stored.content, stored.fileName);
    } else {
      setError("Aucune session enregistrée. Importez d'abord un fichier .svf.");
    }
  }, [applyParsedView]);

  useEffect(() => {
    setHasStoredSession(hasStoredSvf());
  }, [view]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const reset = useCallback(() => {
    setView(null);
    setError(null);
    setSelectedVelocityIndex({});
  }, []);

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

        <h1 className="mb-2 text-2xl font-bold tracking-tight">Import des données</h1>
        <p className="mb-8 text-muted-foreground">
          Déposez un fichier .svf ou .json exporté depuis l&apos;app mobile. Les données sont enregistrées localement et affichées comme sur l&apos;app.
        </p>

        {!view ? (
          <>
            {hasStoredSession && (
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={loadStoredSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-secondary/50 bg-secondary/10 px-6 py-3 font-semibold text-secondary transition-colors hover:bg-secondary/20"
                >
                  <History size={20} />
                  Afficher les sessions enregistrées
                </button>
                <Link
                  href="/dashboard/sessions"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Voir le dashboard des sessions
                </Link>
              </div>
            )}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border bg-card/50 hover:border-muted-foreground/50"
              }`}
            >
              <input
                type="file"
                accept=".svf,.json"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
                  <Upload className="text-primary" size={32} />
                </div>
                <p className="font-medium">Glissez-déposez votre fichier ici</p>
                <p className="text-sm text-muted-foreground">ou cliquez pour parcourir — .svf ou .json</p>
                <span className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                  <FileJson size={14} /> Wolopi Session File
                </span>
              </div>
            </div>
            {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/80 px-4 py-3">
              <span className="text-sm text-muted-foreground">{view.fileName}</span>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard/sessions"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voir le dashboard des sessions
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Nouveau fichier
                </button>
              </div>
            </div>
            <SvfDashboardView
              view={view}
              selectedVelocityIndex={selectedVelocityIndex}
              setSelectedVelocityIndex={setSelectedVelocityIndex}
              showHeader={false}
              onReset={reset}
            />
          </>
        )}
      </div>
    </div>
  );
}
