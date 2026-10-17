"use client";

import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Componente copiado tal cual del código que pegaste, con un agregado:
// el efecto 3D original (rotateY + translateZ) se ve bien en pantallas
// anchas, pero en celular el radio hace que las tarjetas de al lado queden
// literalmente fuera de la pantalla — por eso "no dejaba ir para el lado".
// En celular (<768px) se usa un carrusel plano tipo "coverflow": una
// tarjeta grande al centro y las de al lado más chicas y semi-transparentes,
// con flechas para navegar. En desktop el efecto 3D queda intacto.

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

export interface GalleryItem {
  id: string;
  nombre: string;
  tipo: string;
  region: string;
  imagen: string;
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  radius?: number;
  autoRotateSpeed?: number;
}

function ProjectCard({ item }: { item: GalleryItem }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm shadow-2xl">
      <img src={item.imagen} alt={item.nombre} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/85 to-transparent p-5">
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-brand">{item.tipo}</span>
        <h3 className="mt-1.5 text-sm font-bold uppercase leading-snug text-white">{item.nombre}</h3>
        <p className="mt-1 text-xs text-white/70">{item.region}</p>
      </div>
    </div>
  );
}

// --- Versión móvil: coverflow plano con flechas ---
function MobileCoverflow({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState(0);
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + items.length) % items.length);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {items.map((item, i) => {
        const offset = i - index;
        // Normaliza para que el "más corto camino" se use (carrusel circular)
        const n = items.length;
        const normOffset = offset > n / 2 ? offset - n : offset < -n / 2 ? offset + n : offset;
        if (Math.abs(normOffset) > 1) return null; // solo centro + 1 a cada lado

        const isCenter = normOffset === 0;
        return (
          <div
            key={item.id}
            className="absolute h-[70%] w-[68%] transition-all duration-400 ease-out"
            style={{
              transform: `translateX(${normOffset * 78}%) scale(${isCenter ? 1 : 0.8})`,
              opacity: isCenter ? 1 : 0.4,
              zIndex: isCenter ? 10 : 5,
            }}
            onClick={() => !isCenter && setIndex(i)}
          >
            <ProjectCard item={item} />
          </div>
        );
      })}

      <button
        aria-label="Proyecto anterior"
        onClick={() => go(-1)}
        className="absolute left-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        aria-label="Proyecto siguiente"
        onClick={() => go(1)}
        className="absolute right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.02, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [manualOffset, setManualOffset] = useState(0);

    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 768);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
      if (isMobile) return; // el auto-scroll 3D solo aplica en desktop
      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        // Negativo: antes las tarjetas avanzaban hacia la izquierda y se
        // sentía "al revés" — con el signo invertido avanzan a la derecha.
        setRotation(-scrollProgress * 360);

        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }, [isMobile]);

    useEffect(() => {
      if (isMobile) return;
      const autoRotate = () => {
        if (!isScrolling) setRotation((prev) => prev - autoRotateSpeed);
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };
      animationFrameRef.current = requestAnimationFrame(autoRotate);
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, [isScrolling, autoRotateSpeed, isMobile]);

    if (isMobile) {
      return (
        <div ref={ref} role="region" aria-label="Galería de proyectos" className={cn('h-full w-full', className)} {...props}>
          <MobileCoverflow items={items} />
        </div>
      );
    }

    const anglePerItem = 360 / items.length;
    const totalRotation = rotation + manualOffset;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Galería circular de proyectos"
        className={cn('relative flex h-full w-full items-center justify-center', className)}
        style={{ perspective: '2000px' }}
        {...props}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `rotateY(${totalRotation}deg)`,
            transformStyle: 'preserve-3d',
            // Suaviza el salto al usar las flechas (el scroll igual se ve fluido).
            transition: 'transform 0.4s ease',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const relTotal = totalRotation % 360;
            const relativeAngle = (itemAngle + relTotal + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - normalizedAngle / 180);

            return (
              <div
                key={item.id}
                role="group"
                aria-label={item.nombre}
                className="absolute h-[400px] w-[300px]"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-150px',
                  marginTop: '-200px',
                  opacity,
                  transition: 'opacity 0.3s linear',
                  backfaceVisibility: 'hidden',
                  cursor: normalizedAngle < 1 ? 'default' : 'pointer',
                  pointerEvents: 'auto',
                }}
                onClick={() => {
                  if (normalizedAngle < 1) return; // ya está al frente
                  // Gira exactamente lo necesario para traer ESTA tarjeta
                  // al frente, por el camino más corto.
                  setManualOffset((o) => {
                    const current = rotation + o;
                    const target = -itemAngle + 360 * Math.round((current + itemAngle) / 360);
                    return target - rotation;
                  });
                }}
              >
                <ProjectCard item={item} />
              </div>
            );
          })}
        </div>

        {/* Flechas: avanzan un proyecto a la vez, independiente del scroll —
            más amigable que depender solo de scrollear para rotar. */}
        <button
          aria-label="Proyecto anterior"
          onClick={() => setManualOffset((o) => o + anglePerItem)}
          className="absolute left-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition hover:bg-white"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          aria-label="Proyecto siguiente"
          onClick={() => setManualOffset((o) => o - anglePerItem)}
          className="absolute right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition hover:bg-white"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
