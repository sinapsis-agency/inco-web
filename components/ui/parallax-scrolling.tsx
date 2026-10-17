'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// v5 — la técnica correcta, ahora que confirmamos que las 3 fotos tienen
// TRANSPARENCIA REAL (canal alfa): no son 3 fotos distintas sin relación,
// son 3 CAPAS DE PROFUNDIDAD recortadas de una misma escena (como el
// componente original de Osmo) — el horizonte de fondo, la planta solar
// a media distancia, y el trabajador en primer plano. Juntas y alineadas
// forman la foto completa.
//
// El efecto: arrancas viendo solo el horizonte. Al hacer scroll, el
// trabajador (y la planta solar, a menor velocidad) SUBEN desde abajo del
// encuadre hasta quedar en su posición final — las tres capas terminan
// perfectamente alineadas, formando la escena completa.
export function ParallaxComponent() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const fondo = root.querySelector<HTMLImageElement>('[data-layer="fondo"]');
      const central = root.querySelector<HTMLImageElement>('[data-layer="central"]');
      const superior = root.querySelector<HTMLImageElement>('[data-layer="superior"]');
      if (!fondo || !central || !superior) return;

      // Estado inicial: el trabajador y la planta solar arrancan
      // desplazados hacia abajo (fuera de su posición final), pero
      // SIEMPRE 100% opacos — nunca semitransparentes. Lo único que
      // cambia es su posición vertical, no su opacidad; así se ven
      // sólidos en todo momento, incluso a medio scroll.
      gsap.set(central, { yPercent: 35 });
      gsap.set(superior, { yPercent: 60 });

      gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.4,
        },
      })
        .to(central, { yPercent: 0, ease: 'none', duration: 1 }, 0)
        .to(superior, { yPercent: 0, ease: 'none', duration: 1 }, 0);
    }, root);

    const lenis = new Lenis();
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    return () => {
      ctx.revert();
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return (
    <div className="parallax" ref={rootRef}>
      <section className="parallax__header">
        <div className="parallax__sticky">
          {/* Orden de atrás hacia adelante: horizonte (fondo, quieto),
              planta solar (media distancia), trabajador (primer plano). */}
          <img
            data-layer="fondo"
            src="/images/nosotros/somos-fondo.png"
            alt="Horizonte — cobertura nacional INCO"
            className="parallax__layer-img"
            style={{ zIndex: 1 }}
          />
          <img
            data-layer="central"
            src="/images/nosotros/somos-imagen-central.png"
            alt="Planta fotovoltaica ejecutada por INCO"
            className="parallax__layer-img"
            style={{ zIndex: 2 }}
          />
          <img
            data-layer="superior"
            src="/images/nosotros/somos-imagen-superior.png"
            alt="Supervisor de obra INCO en terreno"
            className="parallax__layer-img"
            style={{ zIndex: 3 }}
          />
        </div>
      </section>
      <section className="parallax__content">
        <div className="container-inco text-center">
          <span className="eyebrow">Quiénes somos</span>
          <h2 className="mt-4 text-white">Ingeniería con historia en terreno.</h2>

          <p className="mx-auto mt-6 max-w-2xl text-white/70">
            INCO ejecuta obra civil y proyectos de energía solar (PMGD) a nivel nacional en Chile, con
            más de 8 años de trayectoria. Detrás, más de 10 años de experiencia en terreno: supervisión
            de obra, control de costos y cumplimiento HSE, en plantas solares e infraestructura a lo
            largo del país.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-10">
            <Stat n="+8" label="Años como empresa" />
            <Stat n="+10" label="Años en terreno" />
            <Stat n="CL" label="Cobertura nacional" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-brand">{n}</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-white/50">{label}</p>
    </div>
  );
}
