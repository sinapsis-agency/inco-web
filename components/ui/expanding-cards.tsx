"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Componente copiado tal cual del código que pegaste.
// Único cambio: `bg-card text-card-foreground` y `border` usaban tokens del
// tema completo de shadcn que este proyecto no declara; se reemplazaron por
// los colores de marca de INCO (negro / blanco / naranja).
// La lógica (activeIndex, gridStyle, isDesktop, handleInteraction) está intacta.

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

export const ExpandingCards = React.forwardRef<
  HTMLUListElement,
  ExpandingCardsProps
>(({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(
    defaultActiveIndex,
  );

  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gridStyle = React.useMemo(() => {
    if (activeIndex === null) return {};

    if (isDesktop) {
      const columns = items
        .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
        .join(" ");
      return { gridTemplateColumns: columns };
    } else {
      const rows = items
        .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
        .join(" ");
      return { gridTemplateRows: rows };
    }
  }, [activeIndex, items, isDesktop]);

  const handleInteraction = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <ul
      className={cn(
        "w-full max-w-6xl gap-2",
        "grid",
        "h-[600px] md:h-[500px]",
        "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
        className,
      )}
      style={{
        ...gridStyle,
        ...(isDesktop
          ? { gridTemplateRows: '1fr' }
          : { gridTemplateColumns: '1fr' }
        )
      }}
      ref={ref}
      {...props}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-neutral-900 text-white shadow-sm",
            "md:min-w-[80px]",
            "min-h-0 min-w-0"
          )}
          onMouseEnter={() => handleInteraction(index)}
          onFocus={() => handleInteraction(index)}
          onClick={() => handleInteraction(index)}
          tabIndex={0}
          data-active={activeIndex === index}
        >
          <img
            src={item.imgSrc}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-300 ease-out group-data-[active=true]:scale-100 group-data-[active=true]:grayscale-0 scale-110 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Título de la tarjeta colapsada.
              En celular: horizontal, abajo a la izquierda, siempre visible
              (antes solo se mostraba en desktop y en celular no había
              ninguna pista de qué tarjeta era). En desktop: vertical y
              centrado, más chico que antes para que "Administración de
              obra" quepa completo sin cortarse. */}
          <h3 className="pointer-events-none absolute bottom-3 left-3 text-sm font-normal uppercase tracking-wider text-white opacity-100 transition-all duration-300 ease-out group-data-[active=true]:opacity-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rotate-90 md:whitespace-nowrap md:text-lg md:tracking-wide">
            {item.title}
          </h3>

          {/* Ícono siempre visible a color (antes solo aparecía con la
              tarjeta activa) — invita al clic incluso en blanco y negro. */}
          <div className="absolute left-5 top-5 text-brand [&>svg]:size-9">{item.icon}</div>

          <article
            className="absolute inset-0 flex flex-col justify-end gap-2.5 p-5"
          >
            <h3 className="text-2xl font-bold uppercase text-white opacity-0 transition-all duration-300 delay-150 ease-out group-data-[active=true]:opacity-100">
              {item.title}
            </h3>

            <p className="w-full max-w-xs text-sm leading-snug text-white/80 opacity-0 transition-all duration-300 delay-225 ease-out group-data-[active=true]:opacity-100">
              {item.description}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
});
ExpandingCards.displayName = "ExpandingCards";
