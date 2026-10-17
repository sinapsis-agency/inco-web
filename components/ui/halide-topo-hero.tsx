'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { WHATSAPP_NUMBER, PANEL_SOLAR } from '@/data/site';

// Componente copiado tal cual del código que pegaste (incluido su bloque
// <style> completo y las "líneas circulares" del fondo, que son .contours).
//
// v2 — reestructurado para que funcione en celular:
// El original está pensado como una sola composición de escritorio: título,
// esquinas de texto y el panel 3D todos superpuestos con position:absolute
// llenando la pantalla. En una pantalla angosta eso se encima todo — el
// título quedaba detrás/cortado por el panel.
//
// La solución: en celular, el título/textos y el panel se apilan en flujo
// normal (título arriba, panel al medio, botones abajo) — nada superpuesto.
// A partir de 721px de ancho se restaura la composición original superpuesta
// vía media query (ver el bloque `@media (min-width: 721px)` más abajo).
// El efecto 3D del mouse y las curvas de nivel (.halide-contours) funcionan
// igual en ambos casos.

const HalideContactHero: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 25;
      const y = (window.innerHeight / 2 - e.pageY) / 25;

      canvas.style.transform = `rotateX(${55 + y / 2}deg) rotateZ(${-25 + x / 2}deg)`;

      layersRef.current.forEach((layer, index) => {
        if (!layer) return;
        const depth = (index + 1) * 15;
        const moveX = x * (index + 1) * 0.2;
        const moveY = y * (index + 1) * 0.2;
        layer.style.transform = `translateZ(${depth}px) translate(${moveX}px, ${moveY}px)`;
      });
    };

    canvas.style.opacity = '0';
    canvas.style.transform = 'rotateX(90deg) rotateZ(0deg) scale(0.8)';

    const timeout = setTimeout(() => {
      canvas.style.transition = 'all 2.5s cubic-bezier(0.16, 1, 0.3, 1)';
      canvas.style.opacity = '1';
      canvas.style.transform = 'rotateX(55deg) rotateZ(-25deg) scale(1)';
    }, 300);

    // En desktop el mouse mueve todo el bloque; en celular no hay "mouse"
    // real (es táctil), así que el listener no molesta pero tampoco hace
    // nada — el panel se ve estático y fijo, que es lo esperado ahí.
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <style>{`
        .halide-scope {
          --bg: #14130f;
          --silver: #e8e6e1;
          --accent: #ea750a;
          --grain-opacity: 0.15;
        }

        .halide-body {
          position: relative;
          background-color: var(--bg);
          color: var(--silver);
          font-family: 'Syncopate', sans-serif;
          overflow: hidden;
          width: 100%;
          margin: 0;
          /* Celular: flujo normal apilado, alto libre */
          display: flex;
          flex-direction: column;
          padding: 2.5rem 1.5rem 2rem;
          gap: 1.5rem;
        }

        .halide-grain {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          z-index: 100;
          opacity: var(--grain-opacity);
        }

        .halide-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-weight: 700;
          letter-spacing: 0.08em;
          position: relative;
          z-index: 10;
        }

        .halide-meta {
          text-align: right;
          font-family: ui-monospace, monospace;
          color: var(--accent);
          font-size: 0.65rem;
          line-height: 1.7;
        }

        .halide-title-block { position: relative; z-index: 10; }

        .halide-hero-title {
          font-size: clamp(2rem, 9vw, 5.25rem);
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #fff;
          margin: 0;
        }

        .halide-viewport {
          position: relative;
          width: 100%;
          height: 45vh;
          min-height: 260px;
          perspective: 1400px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .halide-canvas-3d {
          position: relative;
          width: 100%;
          max-width: 480px;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .halide-layer {
          position: absolute;
          inset: 0;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          transition: transform 0.5s ease;
        }

        /* Una sola capa con el panel. El demo original superponía TRES FOTOS
           DISTINTAS con mix-blend-mode para lograr su efecto topográfico;
           al repetir la misma imagen 3 veces el panel se veía triplicado. */
        .halide-layer-1 {
          filter: contrast(1.1) brightness(1);
          /* La foto tiene fondo blanco — sin esto se veía como un borde/
             recuadro oscuro alrededor del panel sobre el fondo oscuro de
             la sección. Con multiply el blanco se funde con el fondo. */
          mix-blend-mode: multiply;
        }

        .halide-contours {
          position: absolute;
          width: 200%; height: 200%;
          top: -50%; left: -50%;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 40px, rgba(255,255,255,0.05) 41px, transparent 42px);
          transform: translateZ(120px);
          pointer-events: none;
        }

        .halide-bottom {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .halide-cta-button {
          background: var(--accent);
          color: #fff;
          padding: 1rem 2rem;
          text-decoration: none;
          font-weight: 700;
          letter-spacing: 0.05em;
          clip-path: polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%);
          transition: 0.3s;
          display: inline-block;
          text-align: center;
        }

        .halide-cta-button:hover { background: var(--silver); color: var(--bg); transform: translateY(-5px); }

        .halide-bottom-text {
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          color: rgba(232, 230, 225, 0.6);
        }

        .halide-bottom-text a { color: var(--accent); text-decoration: underline; }

        /* A partir de acá se restaura la composición original: todo
           superpuesto a pantalla completa, título con mix-blend-mode. */
        @media (min-width: 721px) {
          .halide-body {
            height: 100vh;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0;
            gap: 0;
          }

          .halide-topbar, .halide-title-block, .halide-bottom {
            position: absolute;
            pointer-events: none;
          }
          .halide-topbar { top: 0; left: 0; right: 0; padding: clamp(1.5rem, 4vw, 4rem); }
          .halide-title-block {
            left: 0; right: 0; top: 30%; transform: translateY(-30%);
            padding-inline: clamp(1.5rem, 4vw, 4rem);
            mix-blend-mode: difference;
          }
          .halide-bottom {
            left: 0; right: 0; bottom: 0; padding: clamp(1.5rem, 4vw, 4rem);
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
            flex-wrap: wrap;
            gap: 1.5rem;
          }
          .halide-bottom-text, .halide-cta-button { pointer-events: auto; }

          .halide-viewport {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            perspective: 2000px;
          }
          .halide-canvas-3d { max-width: 92vw; width: 1100px; height: 660px; }
        }
      `}</style>

      <div className="halide-scope">
        <div className="halide-body">
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="halide-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </svg>

          <div className="halide-grain" style={{ filter: 'url(#halide-grain)' }}></div>

          <div className="halide-topbar">
            <div>INCO</div>
            <div className="halide-meta">
              <div>CHILE — OBRA CIVIL</div>
              <div>ENERGÍA SOLAR PMGD</div>
            </div>
          </div>

          <div className="halide-title-block">
            <h2 className="halide-hero-title">HABLEMOS DE<br />TU PROYECTO</h2>
          </div>

          <div className="halide-viewport">
            <div className="halide-canvas-3d" ref={canvasRef}>
              <div
                className="halide-layer halide-layer-1"
                style={{ backgroundImage: `url('${PANEL_SOLAR}')` }}
                ref={(el) => { if (el) layersRef.current[0] = el; }}
              ></div>
              <div className="halide-contours"></div>
            </div>
          </div>

          <div className="halide-bottom">
            <p className="halide-bottom-text">
              ¿Prefieres un formulario?{' '}
              <Link href="/contacto">Ir a la página de contacto →</Link>
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="halide-cta-button"
            >
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default HalideContactHero;
