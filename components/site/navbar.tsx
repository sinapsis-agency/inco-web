"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LOGO } from "@/data/site";

const LINKS = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#proyectos", label: "Proyectos" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.82);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-black/10 bg-white/92 backdrop-blur-md"
          : "border-transparent bg-gradient-to-b from-black/55 to-transparent"
      }`}
    >
      <div className="container-inco flex items-center justify-between py-3">
        <Link href="/#inicio" onClick={() => setOpen(false)} className="relative block h-10 w-24">
          <Image
            src={LOGO}
            alt="INCO — Ingeniería y Construcción"
            fill
            priority
            className={`object-contain object-left transition-[filter] duration-300 ${
              scrolled ? "" : "brightness-0 invert"
            }`}
          />
        </Link>

        <button
          className="flex flex-col gap-1.5 p-2 md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-0.5 w-6 ${scrolled ? "bg-ink" : "bg-white"}`} />
          <span className={`h-0.5 w-6 ${scrolled ? "bg-ink" : "bg-white"}`} />
        </button>

        <nav className="hidden gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`border-b border-transparent pb-1 font-mono text-xs uppercase tracking-wider transition-colors hover:border-brand hover:text-brand ${
                scrolled ? "text-ash" : "text-white/85"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {open && (
          <nav className="fixed inset-x-0 top-16 bottom-0 flex flex-col bg-white px-[var(--gutter)] py-4 md:hidden">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-black/10 py-4 font-mono text-xs uppercase tracking-wider text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
