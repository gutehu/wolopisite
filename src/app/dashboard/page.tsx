import Link from "next/link";
import { BarChart3, ArrowLeft, Upload, BarChart2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 text-center backdrop-blur">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/40 bg-secondary/10">
          <BarChart3 className="text-secondary" size={32} />
        </div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Analysez vos données, courbes et historiques. Réservé aux utilisateurs connectés.
        </p>
        <Link
          href="/dashboard/import"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Upload size={20} />
          Importer des données (.svf / .json)
        </Link>
        <Link
          href="/dashboard/sessions"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 font-medium text-secondary transition-colors hover:bg-secondary/20"
        >
          <BarChart2 size={20} />
          Affichage dashboard (sessions enregistrées)
        </Link>
        <div className="mt-6 rounded-lg border border-secondary/30 bg-secondary/5 p-4 text-sm text-secondary">
          <strong>Phase 2</strong> — Ce portail sera alimenté par les données enregistrées dans l&apos;application mobile (Recharts, graphiques, export).
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
