import Image from "next/image";
import { LOGO } from "@/data/site";

// Server Component a propósito: `new Date()` se evalúa solo en el servidor,
// así que no hay riesgo de desajuste de hidratación por la fecha.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-[var(--surface)] pb-12 pt-16">
      <div className="container-inco flex flex-col items-center gap-3 text-center">
        <Image
          src={LOGO}
          alt="INCO — Ingeniería y Construcción"
          width={120}
          height={44}
          className="h-11 w-auto object-contain"
        />
        <p className="text-sm text-ash">
          Ingeniería en construcción civil y energía solar. Chile.
        </p>

        <p className="mt-6 w-full border-t border-black/10 pt-5 text-sm text-ash">
          © {year} INCO. Todos los derechos reservados. Sitio desarrollado por{" "}
          <a
            href="https://www.ideasinapsis.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand hover:underline"
          >
            Idea Sinapsis
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
