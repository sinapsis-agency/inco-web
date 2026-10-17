"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const VIRTUAL_SCROLL_LENGTH = 3200;
// En celular cada swipe mueve mucho menos que una rueda de mouse — con el
// mismo largo que en desktop había que deslizar 2-3 veces para cada texto.
const TOUCH_SCROLL_LENGTH = 900;

const INTRO_STOPS = [
  {
    at: 0.1,
    title: "Toda obra parte bajo tierra.",
    sub: "Fundaciones, estructura, control de plazos.",
  },
  {
    at: 0.5,
    title: "De la obra civil a la energía.",
    sub: "Hoy ejecutamos proyectos fotovoltaicos con el mismo rigor.",
  },
  {
    at: 0.88,
    title: "INCO. Ingeniería en construcción, resultados concretos.",
    sub: "Más de 8 años operando en distintas regiones de Chile.",
  },
];

// Lenis lo crea el componente del parallax (components/ui/parallax-scrolling.tsx)
// y lo deja en window.__lenis. Acá se pausa mientras dura la intro del video,
// para que no peleen por el scroll, y se reanuda al terminar.
type LenisLike = { stop: () => void; start: () => void };
const getLenis = (): LenisLike | undefined =>
  (window as unknown as { __lenis?: LenisLike }).__lenis;

export default function ScrollVideoHero({ id }: { id?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const touchStartY = useRef(0);
  const reducedMotion = useRef(false);

  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [ready, setReady] = useState(false);

  // 1. Forzar el primer frame apenas carga (si no, en varios navegadores el
  //    <video> queda en negro hasta el primer play manual)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const primeFirstFrame = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
        video.pause();
        video.currentTime = 0;
      } catch {
        // Autoplay bloqueado: el poster cubre el hueco.
      } finally {
        setReady(true);
      }
    };
    primeFirstFrame();
  }, []);

  // 2. Redibujado forzado: Chrome no siempre repinta el frame al saltar
  //    currentTime por código.
  const forceRepaint = useCallback((video: HTMLVideoElement) => {
    requestAnimationFrame(() => {
      video.style.opacity = "0.9999";
      requestAnimationFrame(() => {
        video.style.opacity = "1";
      });
    });
  }, []);

  // 3. Mover el video por código (currentTime), no por el scroll real
  const applyProgress = useCallback(
    (p: number) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;
      const clamped = Math.min(1, Math.max(0, p));
      progressRef.current = clamped;
      const targetTime = clamped * video.duration;
      if (Math.abs(video.currentTime - targetTime) > 0.01) {
        video.currentTime = targetTime;
        forceRepaint(video);
      }
      setProgress(clamped);
      setIntroDone(clamped >= 1);
    },
    [forceRepaint]
  );

  // 4. Bloquear el scroll nativo mientras dura la intro
  useEffect(() => {
    const hash = window.location.hash;
    const skippingIntro = hash && hash !== "#inicio" && hash !== "#";

    if (reducedMotion.current || skippingIntro) {
      setIntroDone(true);
      document.body.style.overflow = "";
      getLenis()?.start();
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const lock = () => {
      document.body.style.overflow = "hidden";
      getLenis()?.stop();
    };
    const unlock = () => {
      document.body.style.overflow = "";
      getLenis()?.start();
    };

    lock();

    const onWheel = (e: WheelEvent) => {
      if (progressRef.current >= 1 && e.deltaY > 0) {
        unlock();
        return;
      }
      if (progressRef.current <= 0 && e.deltaY < 0) return;
      e.preventDefault();
      applyProgress(progressRef.current + e.deltaY / VIRTUAL_SCROLL_LENGTH);
      if (progressRef.current < 1) lock();
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (progressRef.current >= 1) {
        unlock();
        return;
      }
      const currentY = e.touches[0].clientY;
      const delta = (touchStartY.current - currentY) / TOUCH_SCROLL_LENGTH;
      touchStartY.current = currentY;
      e.preventDefault();
      applyProgress(progressRef.current + delta);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      unlock();
    };
  }, [applyProgress]);

  useEffect(() => {
    if (introDone) {
      document.body.style.overflow = "";
      getLenis()?.start();
    }
  }, [introDone]);

  const activeStop = [...INTRO_STOPS].reverse().find((s) => progress >= s.at - 0.06);
  const stopVisible =
    activeStop && progress >= activeStop.at - 0.06 && progress <= activeStop.at + 0.16;
  // La frase por defecto solo se muestra ANTES de la primera pausa, así
  // aparece una sola vez y no se repite en cada hueco.
  const showDefault = !stopVisible && progress < INTRO_STOPS[0].at - 0.06;

  return (
    <section
      ref={containerRef}
      id={id}
      className="relative h-screen w-full overflow-hidden bg-ink"
      style={{ touchAction: introDone ? "auto" : "none" }}
      aria-label="Introducción INCO"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        style={{ opacity: ready ? 1 : 0 }}
        src="/videos/inco-intro-placeholder.mp4"
        preload="auto"
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

      <div
        key={activeStop?.title ?? "default"}
        className="absolute inset-x-0 bottom-24 px-[var(--gutter)] duration-500 animate-in fade-in slide-in-from-bottom-3"
      >
        {stopVisible && activeStop && (
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="eyebrow w-fit">INCO</span>
            <h1 className="text-white" style={{ fontSize: "clamp(1.9rem, 5.5vw, 3.75rem)" }}>
              {activeStop.title}
            </h1>
            <p className="max-w-lg text-white/70">{activeStop.sub}</p>
          </div>
        )}
        {showDefault && (
          <div className="flex max-w-2xl flex-col gap-4">
            <span className="eyebrow w-fit">INCO</span>
            <h1 className="text-white" style={{ fontSize: "clamp(1.9rem, 5.5vw, 3.75rem)" }}>
              Construcción que no improvisa.
            </h1>
            <p className="max-w-lg text-white/70">
              Obra civil y energía solar, ejecutadas con el mismo estándar.
            </p>
          </div>
        )}
      </div>

      {/* Puntos de progreso */}
      <div className="absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        {INTRO_STOPS.map((s) => (
          <span
            key={s.at}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              progress >= s.at ? "scale-150 bg-brand" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {!introDone && (
        <div className="absolute bottom-6 left-[var(--gutter)]">
          <span className="eyebrow">Scroll para avanzar</span>
        </div>
      )}

      {introDone && (
        <a href="#proyectos" className="btn btn--solid absolute bottom-6 left-[var(--gutter)]">
          Conoce nuestros proyectos ↓
        </a>
      )}
    </section>
  );
}
