import { HardHat, Sun, ClipboardCheck } from "lucide-react";
import type { CardItem } from "@/components/ui/expanding-cards";

export const SERVICIOS: CardItem[] = [
  {
    id: "obra-civil",
    title: "Obra civil",
    description:
      "Fundaciones, estructuras y movimiento de tierra. Ejecución directa, sin intermediarios.",
    imgSrc: "/images/proyectos/inco-proyecto-obra-inmobiliaria.png",
    icon: <HardHat size={24} />,
    linkHref: "#contacto",
  },
  {
    id: "energia-solar",
    title: "Energía solar (PMGD)",
    description:
      "Constructibilidad, supervisión de obra y ejecución de plantas fotovoltaicas, de la tierra al panel.",
    imgSrc: "/images/proyectos/inco-proyecto-panel-solar-hogar.png",
    icon: <Sun size={24} />,
    linkHref: "#contacto",
  },
  {
    id: "administracion",
    title: "Administración de obra",
    description:
      "Control de costos, cronogramas y gestión HSE. Reportes reales, no promesas.",
    imgSrc: "/images/proyectos/inco-proyecto-servicentro-shell.png",
    icon: <ClipboardCheck size={24} />,
    linkHref: "#contacto",
  },
];
