"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Smartphone, Apple, Smartphone as AndroidIcon, Upload, ArrowLeft } from "lucide-react";

export default function TelechargerPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
            <Smartphone className="text-primary" size={40} />
          </div>
          <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("download_title")}
          </h1>
          <p className="mt-4 text-center text-muted-foreground">
            {t("download_subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <a
              href="#"
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-4 font-semibold text-foreground opacity-75 transition hover:border-primary/40 hover:opacity-100"
              aria-disabled
            >
              <Apple size={28} />
              <span>{t("download_ios")}</span>
              <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t("download_coming_soon")}
              </span>
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-4 font-semibold text-foreground opacity-75 transition hover:border-primary/40 hover:opacity-100"
              aria-disabled
            >
              <AndroidIcon size={28} />
              <span>{t("download_android")}</span>
              <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t("download_coming_soon")}
              </span>
            </a>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("cta_platforms")}
          </p>

          <Link
            href="/dashboard/import"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-secondary/5 py-3 text-sm font-medium text-secondary transition-colors hover:bg-secondary/10"
          >
            <Upload size={18} />
            {t("download_import_instead")}
          </Link>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          {t("download_back")}
        </Link>
      </main>
    </div>
  );
}
