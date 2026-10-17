"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type {
  Topology,
  GeometryCollection,
  GeometryObject,
} from "topojson-specification";
import type { GeoPermissibleObjects } from "d3";
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY, CONTACT_EMAIL } from "@/data/site";

// Componente copiado del código que pegaste. Cambios respecto al original:
//  - Colores rose-500 -> los de marca de INCO (brand/ink/ash).
//  - Se quitaron las variantes "dark:" (el sitio no tiene modo oscuro).
//  - CONTACT_LINKS con los datos reales de INCO (email y WhatsApp).
//  - El formulario, que en el original no hacía nada al enviar, ahora abre
//    WhatsApp con el mensaje armado (mismo patrón del resto del sitio), con
//    un link para enviarlo por email.
//  - El globo (GlobeWireframe) queda igual: trae su mapa del mundo desde una
//    CDN pública en el navegador del visitante.

const smoothEase = [0.25, 0.1, 0.25, 1] as const;

const CONTACT_LINKS = [
  { icon: Mail, label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: MessageCircle, label: WHATSAPP_DISPLAY, href: `https://wa.me/${WHATSAPP_NUMBER}` },
];

interface GlobeWireframeProps {
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  graticuleColor?: string;
  graticuleOpacity?: number;
  sphereOutlineColor?: string;
  sphereOutlineWidth?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  rotateToLocation?: string | [number, number];
  rotateCities?: string[];
  rotationSpeed?: number;
  initialRotation?: [number, number];
  enableInteraction?: boolean;
  showGraticule?: boolean;
  startAsGlobe?: boolean;
  countryFillColor?: string;
  countryHoverColor?: string;
  variant?: "wireframe" | "wireframesolid" | "solid";
  scale?: number;
  backgroundColor?: string;
}

interface GeoFeature {
  type: string;
  geometry: GeometryObject;
  properties: Record<string, unknown>;
}

interface WorldAtlasTopology extends Topology {
  objects: { countries: GeometryCollection };
}

interface CustomProjection extends d3.GeoProjection {
  alpha(value: number): CustomProjection;
  alpha(): number;
}

const cityCoordinates: Record<string, [number, number]> = {
  "san francisco": [37.7749, -122.4194],
  "new york": [40.7128, -74.006],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503],
  paris: [48.8566, 2.3522],
  moscow: [55.7558, 37.6176],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  sydney: [-33.8688, 151.2093],
  mumbai: [19.076, 72.8777],
  "los angeles": [34.0522, -118.2437],
  chicago: [41.8781, -87.6298],
  santiago: [-33.4489, -70.6693],
};

function orthographicRaw(x: number, y: number): [number, number] {
  const cosy = Math.cos(y);
  return [cosy * Math.sin(x), Math.sin(y)];
}

function equirectangularRaw(lambda: number, phi: number): [number, number] {
  return [lambda, phi];
}

function interpolateProjection(
  raw0: (lambda: number, phi: number) => [number, number],
  raw1: (lambda: number, phi: number) => [number, number],
): CustomProjection {
  let t = 0;

  const createRawProjection = (alpha: number) => {
    return (lambda: number, phi: number): [number, number] => {
      const [x0, y0] = raw0(lambda, phi);
      const [x1, y1] = raw1(lambda, phi);
      return [x0 + alpha * (x1 - x0), y0 + alpha * (y1 - y0)];
    };
  };

  const projection = d3.geoProjection(createRawProjection(t)) as unknown as CustomProjection;

  const alphaMethod = ((value?: number): CustomProjection | number => {
    if (value !== undefined) {
      t = +value;
      const newProjection = d3.geoProjection(createRawProjection(t)) as unknown as CustomProjection;

      if (projection.scale()) newProjection.scale(projection.scale());
      if (projection.translate()) newProjection.translate(projection.translate());
      if (projection.rotate()) newProjection.rotate(projection.rotate());
      if (projection.precision()) newProjection.precision(projection.precision());

      newProjection.alpha = alphaMethod as CustomProjection["alpha"];
      return newProjection;
    }
    return t;
  }) as CustomProjection["alpha"];

  projection.alpha = alphaMethod;
  return projection;
}

function GlobeWireframe({
  width,
  height,
  className = "aspect-square w-full max-w-150",
  strokeColor = "currentColor",
  strokeWidth = 1.0,
  graticuleColor = "currentColor",
  graticuleOpacity = 0.2,
  sphereOutlineColor = "currentColor",
  sphereOutlineWidth = 1,
  autoRotate = true,
  autoRotateSpeed = 0.5,
  rotateToLocation,
  rotateCities = [],
  rotationSpeed = 3000,
  initialRotation = [0, 0],
  enableInteraction = true,
  showGraticule = true,
  startAsGlobe = true,
  countryFillColor,
  countryHoverColor,
  variant = "wireframe",
  scale = 1,
  backgroundColor,
}: GlobeWireframeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress] = useState(startAsGlobe ? 0 : 100);
  const [worldData, setWorldData] = useState<GeoFeature[]>([]);
  const [rotation, setRotation] = useState<[number, number]>(initialRotation);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState([0, 0]);
  const [isVisible, setIsVisible] = useState(false);
  const rotationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotationAnimFrame = useRef<number | null>(null);
  const rotationStartTime = useRef<number | null>(null);
  const rotationFrom = useRef<[number, number]>([0, 0]);
  const rotationTo = useRef<[number, number]>([0, 0]);
  const animationFrame = useRef<number | null>(null);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const rotationRef = useRef(rotation);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const useResponsive = !width && !height;
  const finalWidth = useResponsive ? dimensions.width : width || 800;
  const finalHeight = useResponsive ? dimensions.height : height || 500;

  const defaultStrokeColor = strokeColor || "currentColor";
  const defaultGraticuleColor = graticuleColor || "currentColor";
  const defaultSphereOutlineColor = sphereOutlineColor || "currentColor";
  const defaultCountryFillColor =
    countryFillColor || (variant === "solid" ? "currentColor" : "none");
  const defaultBackgroundColor = backgroundColor || "transparent";

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const updateDimensions = () => {
      if (container && useResponsive) {
        const w = container.offsetWidth || 300;
        setDimensions({ width: w, height: w });
      }
    };

    updateDimensions();

    if (useResponsive) {
      resizeObserver.current = new ResizeObserver(updateDimensions);
      resizeObserver.current.observe(container);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    return () => {
      if (resizeObserver.current) resizeObserver.current.disconnect();
      observer.unobserve(container);
    };
  }, [useResponsive]);

  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
        );
        const world = (await response.json()) as WorldAtlasTopology;
        const countries = feature(world, world.objects.countries).features as GeoFeature[];
        setWorldData(countries);
      } catch {
        const fallbackData: GeoFeature[] = [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-180, -90],
                  [180, -90],
                  [180, 90],
                  [-180, 90],
                  [-180, -90],
                ],
              ],
            } as unknown as GeometryObject,
            properties: {},
          },
        ];
        setWorldData(fallbackData);
      }
    };
    loadWorldData();
  }, []);

  useEffect(() => {
    if (!autoRotate || !isVisible || isDragging || rotateCities.length > 0) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      return;
    }

    const rotate = () => {
      setRotation((prev) => [(prev[0] + autoRotateSpeed) % 360, prev[1]]);
      animationFrame.current = requestAnimationFrame(rotate);
    };

    animationFrame.current = requestAnimationFrame(rotate);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [autoRotate, autoRotateSpeed, isVisible, isDragging, rotateCities.length]);

  const animateRotationTo = useCallback((target: [number, number], duration = 1200) => {
    if (rotationAnimFrame.current) cancelAnimationFrame(rotationAnimFrame.current);

    rotationFrom.current = rotationRef.current;
    rotationTo.current = target;
    rotationStartTime.current = performance.now();

    const animate = (time: number) => {
      const elapsed = time - (rotationStartTime.current || 0);
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const lon = rotationFrom.current[0] + (rotationTo.current[0] - rotationFrom.current[0]) * eased;
      const lat = rotationFrom.current[1] + (rotationTo.current[1] - rotationFrom.current[1]) * eased;

      setRotation([lon, lat]);

      if (t < 1) rotationAnimFrame.current = requestAnimationFrame(animate);
    };

    rotationAnimFrame.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (rotateCities.length === 0 || !isVisible) return;

    const rotateToNextCity = () => {
      const nextIndex = (currentCityIndex + 1) % rotateCities.length;
      const coordinates = cityCoordinates[rotateCities[nextIndex].toLowerCase()];
      if (coordinates) {
        animateRotationTo([-coordinates[1], -coordinates[0]], rotationSpeed * 0.6);
        setCurrentCityIndex(nextIndex);
      }
    };

    const coordinates = cityCoordinates[rotateCities[currentCityIndex].toLowerCase()];
    if (coordinates) {
      animateRotationTo([-coordinates[1], -coordinates[0]], rotationSpeed * 0.6);
    }

    rotationInterval.current = setInterval(rotateToNextCity, rotationSpeed);

    return () => {
      if (rotationInterval.current) clearInterval(rotationInterval.current);
    };
  }, [rotateCities, currentCityIndex, rotationSpeed, isVisible, animateRotationTo]);

  useEffect(() => {
    if (!rotateToLocation) return;

    let coordinates: [number, number];
    if (typeof rotateToLocation === "string") {
      coordinates = cityCoordinates[rotateToLocation.toLowerCase()] || [0, 0];
    } else {
      coordinates = rotateToLocation;
    }

    setRotation([-coordinates[1], -coordinates[0]]);
  }, [rotateToLocation]);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!enableInteraction) return;
    setIsDragging(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) setLastMouse([event.clientX - rect.left, event.clientY - rect.top]);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !enableInteraction) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentMouse = [event.clientX - rect.left, event.clientY - rect.top];
    const dx = currentMouse[0] - lastMouse[0];
    const dy = currentMouse[1] - lastMouse[1];

    const t = progress / 100;
    const sensitivity = variant === "wireframe" ? (t < 0.5 ? 0.5 : 0.25) : 0.5;

    setRotation((prev) => [
      prev[0] + dx * sensitivity,
      Math.max(-90, Math.min(90, prev[1] - dy * sensitivity)),
    ]);

    setLastMouse(currentMouse);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  useEffect(() => {
    if (!svgRef.current || worldData.length === 0 || !isVisible) return;
    if (useResponsive && dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    let finalCountryFill = "none";
    let finalStrokeWidth = strokeWidth;
    let finalOpacity = 1.0;
    let renderGraticule = showGraticule;
    let finalGraticuleOpacity = graticuleOpacity;
    let finalSphereOutlineWidth = sphereOutlineWidth;

    if (variant === "wireframesolid") {
      renderGraticule = false;
      finalGraticuleOpacity = 0;
      finalSphereOutlineWidth = 1.5;
    } else if (variant === "solid") {
      finalCountryFill = defaultCountryFillColor;
      finalStrokeWidth = strokeWidth * 0.5;
      finalOpacity = 0.3;
      renderGraticule = false;
      finalGraticuleOpacity = 0;
      finalSphereOutlineWidth = 1.5;
    }

    if (defaultBackgroundColor !== "transparent") {
      const radius = (Math.min(finalWidth, finalHeight) / 2) * scale * 0.9;
      svg
        .append("circle")
        .attr("cx", finalWidth / 2)
        .attr("cy", finalHeight / 2)
        .attr("r", radius)
        .attr("fill", defaultBackgroundColor);
    }

    let projection: d3.GeoProjection | CustomProjection;
    const path = d3.geoPath();

    if (variant === "wireframe") {
      const t = progress / 100;
      const alpha = Math.pow(t, 0.5);

      const baseScale = Math.min(finalWidth, finalHeight) / 2;
      const scaleRange = d3
        .scaleLinear()
        .domain([0, 1])
        .range([baseScale * 0.9 * scale, baseScale * 0.54 * scale]);
      const baseRotate = d3.scaleLinear().domain([0, 1]).range([0, 0]);

      projection = interpolateProjection(orthographicRaw, equirectangularRaw)
        .scale(scaleRange(alpha))
        .translate([finalWidth / 2, finalHeight / 2])
        .rotate([baseRotate(alpha) + rotation[0], rotation[1]])
        .precision(0.1);

      (projection as CustomProjection).alpha(alpha);
      path.projection(projection);
    } else {
      projection = d3
        .geoOrthographic()
        .scale((Math.min(finalWidth, finalHeight) / 2) * scale * 0.9)
        .translate([finalWidth / 2, finalHeight / 2])
        .rotate([rotation[0], rotation[1]])
        .precision(0.1);

      path.projection(projection);
    }

    if (renderGraticule && finalGraticuleOpacity > 0) {
      try {
        const graticule = d3.geoGraticule();
        const graticulePath = path(graticule());
        if (graticulePath) {
          svg
            .append("path")
            .datum(graticule())
            .attr("d", graticulePath)
            .attr("fill", "none")
            .attr("stroke", defaultGraticuleColor)
            .attr("stroke-width", 1)
            .attr("opacity", finalGraticuleOpacity);
        }
      } catch {
        // sin graticule si algo falla — no es crítico
      }
    }

    svg
      .selectAll(".country")
      .data(worldData)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", (d: GeoFeature) => {
        try {
          const pathString = path(d as unknown as GeoPermissibleObjects);
          if (!pathString) return "";
          if (pathString.includes("NaN") || pathString.includes("Infinity")) return "";
          return pathString;
        } catch {
          return "";
        }
      })
      .attr("fill", finalCountryFill)
      .attr("stroke", defaultStrokeColor)
      .attr("stroke-width", finalStrokeWidth)
      .attr("opacity", finalOpacity)
      .style("visibility", function (this: SVGPathElement) {
        const pathData = d3.select(this).attr("d");
        return pathData && pathData.length > 0 && !pathData.includes("NaN")
          ? "visible"
          : "hidden";
      })
      .on("mouseenter", function (this: SVGPathElement) {
        if (countryHoverColor && variant === "solid") {
          d3.select(this).attr("fill", countryHoverColor);
        }
      })
      .on("mouseleave", function (this: SVGPathElement) {
        if (variant === "solid") {
          d3.select(this).attr("fill", finalCountryFill);
        }
      });

    try {
      const sphereOutline = path({ type: "Sphere" });
      if (sphereOutline) {
        svg
          .append("path")
          .datum({ type: "Sphere" })
          .attr("d", sphereOutline)
          .attr("fill", "none")
          .attr("stroke", defaultSphereOutlineColor)
          .attr("stroke-width", finalSphereOutlineWidth)
          .attr("opacity", variant === "wireframe" ? 1.0 : 0.8);
      }
    } catch {
      // sin contorno de esfera si algo falla — no es crítico
    }
  }, [
    worldData,
    progress,
    rotation,
    isVisible,
    finalWidth,
    finalHeight,
    defaultStrokeColor,
    strokeWidth,
    defaultGraticuleColor,
    graticuleOpacity,
    defaultSphereOutlineColor,
    sphereOutlineWidth,
    showGraticule,
    defaultCountryFillColor,
    countryHoverColor,
    variant,
    scale,
    defaultBackgroundColor,
    useResponsive,
    dimensions.width,
  ]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={finalWidth}
        height={finalHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={
          useResponsive ? "w-full h-full opacity-0 transition-opacity duration-1000" : ""
        }
        style={{
          cursor: enableInteraction ? (isDragging ? "grabbing" : "grab") : "default",
          opacity: useResponsive ? (dimensions.width > 0 ? 1 : 0) : 1,
        }}
      />
    </div>
  );
}

const FormDots = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
  const isHorizontal = orientation === "horizontal";
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 flex items-center justify-center overflow-hidden",
        isHorizontal ? "w-full" : "h-full",
        className,
      )}
      {...props}
    >
      <div className={cn("relative", isHorizontal ? "w-full h-4" : "h-full w-4")}>
        <div
          className="absolute inset-0 bg-repeat text-ash-light"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
            backgroundSize: isHorizontal ? "6px 100%" : "100% 6px",
            maskImage: isHorizontal
              ? "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
              : "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        />
      </div>
    </SeparatorPrimitive.Root>
  );
});
FormDots.displayName = "FormDots";

interface ContactWithGlobeProps {
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

function buildMessage(form: HTMLFormElement) {
  const get = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() ?? "";

  const nombre = get("fullName");
  const lines = [
    `Hola INCO, soy ${nombre || "(sin nombre)"}.`,
    get("company") && `Empresa/Mandante: ${get("company")}`,
    get("email") && `Email: ${get("email")}`,
    get("message") && `Mensaje: ${get("message")}`,
  ].filter(Boolean) as string[];

  return { nombre, lines };
}

const inputClass =
  "w-full bg-[var(--surface)] border border-ash-light rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ash outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all duration-200";
const labelClass = "text-xs font-semibold tracking-widest uppercase text-ash";

export default function ContactWithGlobe({
  title = "Hablemos de tu proyecto.",
  subtitle = "Contacto",
  description = "Cuéntanos tu proyecto de obra civil o energía solar. Te respondemos directo por WhatsApp o email.",
  className,
}: ContactWithGlobeProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { lines } = buildMessage(e.currentTarget);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
    );
  };

  const handleEmail = (form: HTMLFormElement | null) => {
    if (!form) return;
    const { nombre, lines } = buildMessage(form);
    const subject = encodeURIComponent(`Contacto desde el sitio — ${nombre || "nueva consulta"}`);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section
      className={cn("relative w-full overflow-hidden py-20", className)}
      style={{ background: "var(--surface)" }}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
          >
            <span className="eyebrow">{subtitle}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: smoothEase }}
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3, ease: smoothEase }}
            className="text-base text-ash max-w-md"
          >
            {description}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto items-start">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.2, ease: smoothEase }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-ink">Escríbenos directo</h3>
              <p className="text-sm text-ash leading-relaxed max-w-xs">
                Por cualquiera de estos dos canales — respondemos a la brevedad.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {CONTACT_LINKS.map(({ icon: Icon, label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: smoothEase }}
                  className="group flex items-center gap-3 w-fit text-sm text-ash hover:text-ink transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-ash-light group-hover:border-brand/40 group-hover:bg-brand/10 flex items-center justify-center shrink-0 transition-all duration-200">
                    <Icon className="w-3.5 h-3.5 text-ash group-hover:text-brand transition-colors duration-200" />
                  </div>
                  {label}
                </motion.a>
              ))}
            </div>

            <div className="relative overflow-hidden h-52 text-ash">
              <GlobeWireframe
                className="w-full aspect-square max-w-full absolute top-0 left-0"
                variant="wireframesolid"
                autoRotate
                autoRotateSpeed={0.45}
                strokeWidth={0.6}
                graticuleOpacity={0.12}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                style={{ background: "linear-gradient(to top, var(--surface), transparent)" }}
              />
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.35, ease: smoothEase }}
            className="rounded-2xl border border-ash-light bg-white p-6 sm:p-8 flex flex-col gap-5"
          >
            <div>
              <h3 className="text-lg font-semibold text-ink mb-0.5">Envíanos un mensaje</h3>
              <p className="text-sm text-ash">Completa el formulario y te contactamos a la brevedad.</p>
            </div>

            <FormDots />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Nombre completo</label>
                <input type="text" name="fullName" required placeholder="Tu nombre" className={inputClass} />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Empresa / Mandante</label>
                <input type="text" name="company" placeholder="Opcional" className={inputClass} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Email</label>
              <input type="email" name="email" placeholder="tu@email.com" className={inputClass} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Mensaje</label>
              <textarea
                name="message"
                required
                placeholder="Cuéntanos tu proyecto"
                rows={4}
                className={cn(inputClass, "py-3 resize-none")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                type="submit"
                className="w-fit h-11 px-8 rounded-xl font-semibold text-sm bg-ink hover:bg-ink/90 text-white group"
              >
                Enviar por WhatsApp
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>

              <button
                type="button"
                onClick={(e) => handleEmail(e.currentTarget.closest("form"))}
                className="text-sm text-ash hover:text-brand underline-offset-4 hover:underline"
              >
                O envíalo por email
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
