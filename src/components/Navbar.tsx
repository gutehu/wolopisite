"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Sun, Moon, Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { localeLabels } from "@/lib/i18n";

const navLinkKeys = [
  { href: "#features", key: "nav_features" },
  { href: "#how-it-works", key: "nav_how" },
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/login", key: "nav_login" },
  { href: "/compte", key: "nav_account" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = navLinkKeys.map(({ href, key }) => ({ href, label: t(key) }));

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <span className="text-primary">Wolopi</span>
        </Link>

        {/* Desktop: liens + menu Thème / Langue */}
        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                    (link.label === t("nav_login") || link.label === t("nav_account")) && "text-primary"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-lg border border-border bg-card/50 p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              aria-label={theme === "light" ? t("theme_dark") : t("theme_light")}
              title={theme === "light" ? t("theme_dark") : t("theme_light")}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-card"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <Languages className="h-4 w-4" />
              <ChevronDown className={cn("h-4 w-4 transition-transform", menuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-2 shadow-lg"
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">{t("theme")}</p>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setTheme("light"); setMenuOpen(false); }}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <Sun className="h-4 w-4" />
                        {t("theme_light")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTheme("dark"); setMenuOpen(false); }}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <Moon className="h-4 w-4" />
                        {t("theme_dark")}
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">{t("language")}</p>
                    <ul className="mt-1 space-y-0.5">
                      {(["fr", "es", "en", "ru"] as Locale[]).map((loc) => (
                        <li key={loc}>
                          <button
                            type="button"
                            onClick={() => { setLocale(loc); setMenuOpen(false); }}
                            className={cn(
                              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                              locale === loc ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                            )}
                          >
                            {localeLabels[loc]}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Link
              href="/telecharger"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_rgba(0,212,170,0.3)] transition-all hover:shadow-[0_0_28px_rgba(0,212,170,0.5)]"
            >
              {t("nav_download")}
            </Link>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            aria-label={theme === "light" ? t("theme_dark") : t("theme_light")}
          >
            {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground"
              aria-label="Langue"
            >
              <Languages size={22} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card py-2 shadow-lg"
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">{t("theme")}</p>
                    <div className="mt-1 flex gap-2">
                      <button type="button" onClick={() => { setTheme("light"); setMenuOpen(false); }} className={cn("flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm", theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                        <Sun className="h-4 w-4" /> {t("theme_light")}
                      </button>
                      <button type="button" onClick={() => { setTheme("dark"); setMenuOpen(false); }} className={cn("flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm", theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                        <Moon className="h-4 w-4" /> {t("theme_dark")}
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">{t("language")}</p>
                    {(["fr", "es", "en", "ru"] as Locale[]).map((loc) => (
                      <button key={loc} type="button" onClick={() => { setLocale(loc); setMenuOpen(false); }} className={cn("mt-1 w-full rounded-lg px-3 py-2 text-left text-sm", locale === loc ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                        {localeLabels[loc]}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            aria-label="Menu"
            className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block rounded-lg px-4 py-3 text-muted-foreground hover:bg-card hover:text-foreground" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/telecharger" className="block rounded-lg bg-primary px-4 py-3 text-center font-semibold text-primary-foreground" onClick={() => setOpen(false)}>
                {t("nav_download")}
              </Link>
            </li>
          </ul>
        </motion.div>
      )}
    </motion.header>
  );
}
