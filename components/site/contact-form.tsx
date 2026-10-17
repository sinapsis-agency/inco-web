"use client";

import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY, CONTACT_EMAIL } from "@/data/site";

function buildMessage(form: HTMLFormElement) {
  const get = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
      ?.value.trim() ?? "";

  const nombre = get("nombre");
  const lines = [
    `Hola INCO, soy ${nombre || "(sin nombre)"}.`,
    get("empresa") && `Empresa/Mandante: ${get("empresa")}`,
    get("tipo") && `Tipo de proyecto: ${get("tipo")}`,
    get("region") && `Región: ${get("region")}`,
    get("mensaje") && `Mensaje: ${get("mensaje")}`,
  ].filter(Boolean);

  return { nombre, lines: lines as string[] };
}

export default function ContactForm() {
  const sendWhatsapp = (form: HTMLFormElement) => {
    const { lines } = buildMessage(form);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank"
    );
  };

  const sendEmail = (form: HTMLFormElement) => {
    const { nombre, lines } = buildMessage(form);
    const subject = encodeURIComponent(`Contacto desde el sitio — ${nombre || "nueva consulta"}`);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendWhatsapp(e.currentTarget);
        }}
        className="grid max-w-lg gap-5"
      >
        <Field label="Nombre" name="nombre" required />
        <Field label="Empresa / Mandante" name="empresa" />
        <div>
          <label className="field__label" htmlFor="tipo">
            Tipo de proyecto
          </label>
          <select id="tipo" name="tipo" className="field__input" required defaultValue="">
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="Obra civil">Obra civil</option>
            <option value="Energía solar">Energía solar</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <Field label="Región" name="region" />
        <div>
          <label className="field__label" htmlFor="mensaje">
            Mensaje
          </label>
          <textarea id="mensaje" name="mensaje" rows={4} className="field__input" required />
        </div>

        <div className="mt-2 flex flex-wrap gap-4">
          <button type="submit" className="btn btn--solid">
            Enviar por WhatsApp
          </button>
          <button
            type="button"
            className="btn"
            onClick={(e) => {
              const form = e.currentTarget.closest("form");
              if (form) sendEmail(form);
            }}
          >
            Enviar por Email
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-ash">
        O escríbenos directo:{" "}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="text-brand"
        >
          {WHATSAPP_DISPLAY}
        </a>{" "}
        ·{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand">
          {CONTACT_EMAIL}
        </a>
      </p>
    </>
  );
}

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div>
      <label className="field__label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} required={required} className="field__input" />
    </div>
  );
}
