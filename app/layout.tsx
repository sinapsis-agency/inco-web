import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/site/navbar";
import Footer from "@/components/site/footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://inco.cl"),
  title: {
    default: "INCO | Ingeniería en Construcción Civil y Energía Solar en Chile",
    template: "%s | INCO",
  },
  description:
    "INCO ejecuta obra civil y proyectos de energía solar a nivel nacional en Chile. Más de 8 años de trayectoria.",
  openGraph: {
    type: "website",
    siteName: "INCO",
    locale: "es_CL",
    title: "INCO | Ingeniería en Construcción Civil y Energía Solar",
    description:
      "Obra civil y energía solar a nivel nacional en Chile. Más de 8 años de trayectoria.",
    images: ["/images/brand/inco-logotipo.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/images/brand/inco-logotipo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Syncopate:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GeneralContractor",
              name: "INCO",
              description:
                "Empresa de ingeniería en construcción civil y proyectos de energía solar (PMGD) a nivel nacional en Chile.",
              areaServed: "Chile",
              url: "https://inco.cl",
            }),
          }}
        />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
