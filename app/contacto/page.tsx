import type { Metadata } from "next";
import Link from "next/link";
import ContactWithGlobe from "@/components/ui/contact-with-globe";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contáctate con INCO para tu próximo proyecto de obra civil o energía solar en Chile.",
};

export default function ContactoPage() {
  return (
    <>
      <div style={{ marginTop: "4.5rem" }}>
        <ContactWithGlobe />
      </div>

      <p className="container-inco pb-12 text-center">
        <Link href="/" className="text-sm text-ash hover:text-brand">
          ← Volver al inicio
        </Link>
      </p>
    </>
  );
}
