"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Link2, LogOut, ArrowLeft, Loader2, Upload } from "lucide-react";

type UserSession = { id: string; email: string; name: string | null } | null;

export default function ComptePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession>(null);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else router.push("/login");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function generateCode() {
    setCodeLoading(true);
    setLinkCode(null);
    try {
      const res = await fetch("/api/sync/link/code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setLinkCode({ code: data.code, expiresAt: data.expiresAt });
    } catch (e) {
      setLinkCode({ code: "Erreur: " + (e as Error).message, expiresAt: "" });
    } finally {
      setCodeLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={16} />
            Accueil
          </Link>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Upload size={16} />
            Importer des données
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{user.name || "Mon compte"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Link2 size={18} />
              Lier Wolopi Mobile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Générez un code et saisissez-le dans l’app mobile pour synchroniser vos données.
            </p>
            <button
              type="button"
              onClick={generateCode}
              disabled={codeLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 font-medium text-primary hover:bg-primary/20 disabled:opacity-70"
            >
              {codeLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Link2 size={20} />}
              Générer un code
            </button>
            {linkCode && (
              <div className="mt-4 rounded-lg border border-border bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Code à saisir dans l’app (valide 10 min)</p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-foreground">
                  {linkCode.code}
                </p>
                {linkCode.expiresAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expire à {new Date(linkCode.expiresAt).toLocaleTimeString("fr-FR")}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
