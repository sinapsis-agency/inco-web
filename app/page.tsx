import ScrollVideoHero from "@/components/site/scroll-video-hero";
import { ParallaxComponent } from "@/components/ui/parallax-scrolling";
import { ExpandingCards } from "@/components/ui/expanding-cards";
import { CircularGallery } from "@/components/ui/circular-gallery";
import HalideContactHero from "@/components/ui/halide-topo-hero";
import { SERVICIOS } from "@/data/servicios";
import { PROYECTOS } from "@/data/proyectos";

export default function HomePage() {
  return (
    <>
      {/* 1. INICIO — video con scrolltelling */}
      <ScrollVideoHero id="inicio" />

      {/* 2. NOSOTROS — parallax de Osmo con las 3 fotos de INCO */}
      <section id="nosotros">
        <ParallaxComponent />
      </section>

      {/* 3. SERVICIOS — tarjetas expandibles, sobre fondo negro */}
      <section id="servicios" className="section bg-ink pt-20 sm:pt-24">
        <div className="container-inco flex flex-col items-center">
          <span className="eyebrow">Lo que ejecutamos</span>
          <h2
            className="mt-12 text-center text-white md:whitespace-nowrap"
            style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.75rem)" }}
          >
            Obra civil y energía solar. Un solo equipo.
          </h2>
          <div className="mt-10 flex w-full justify-center">
            <ExpandingCards items={SERVICIOS} defaultActiveIndex={0} />
          </div>
        </div>
      </section>

      {/* 4. PROYECTOS — galería circular 3D que rota con el scroll */}
      <section id="proyectos" className="bg-white">
        <div className="container-inco pt-24 text-center">
          <span className="eyebrow">Proyectos</span>
          <h2 className="mt-3">Ejecutados en terreno.</h2>
        </div>
        {/* El alto de 300vh le da recorrido de scroll a la rotación 3D,
            pero solo tiene sentido en desktop — en celular el carrusel se
            navega tocando las flechas, no scrolleando. */}
        <div className="relative md:h-[300vh]">
          <div className="sticky top-0 h-[65vh] w-full overflow-hidden md:h-screen">
            <CircularGallery items={PROYECTOS} radius={520} />
          </div>
        </div>
      </section>

      {/* 5. CONTACTO — escena 3D con el panel solar */}
      <section id="contacto">
        <HalideContactHero />
      </section>
    </>
  );
}
