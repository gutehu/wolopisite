"use client";

import Link from "next/link";
import { Mail, MessageCircle, Twitter, Instagram, Linkedin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const legalLinkKeys = [
  { href: "/mentions-legales", key: "footer_legal_mentions" },
  { href: "/politique-confidentialite", key: "footer_privacy" },
  { href: "/cgu", key: "footer_terms" },
];

const socialLinks = [
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Linkedin, label: "LinkedIn" },
];

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border bg-card/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xl font-bold text-primary">
              Wolopi
            </Link>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t("footer_tagline")}
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("footer_legal")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-4">
                {legalLinkKeys.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("footer_contact")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-4">
                <li>
                  <a
                    href="mailto:contact@wolopi.com"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Mail size={14} />
                    contact@wolopi.com
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <MessageCircle size={14} />
                    {t("footer_support")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("footer_networks")}
              </p>
              <ul className="mt-2 flex gap-4">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon size={20} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Wolopi. {t("footer_copyright")}
        </div>
      </div>
    </footer>
  );
}
