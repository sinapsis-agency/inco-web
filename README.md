# INCO — Sitio web (Next.js)

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + estructura shadcn/ui.

## Correrlo

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Stack confirmado

| Requisito | Estado |
|---|---|
| Next.js App Router | ✅ `app/` con `layout.tsx` + `page.tsx` |
| TypeScript | ✅ `tsconfig.json`, todo en `.ts`/`.tsx`, `strict: true` |
| Tailwind CSS v4 | ✅ `@import "tailwindcss"` en `app/globals.css`, **sin** `tailwind.config.js` (el tema va en `@theme`) |
| Estructura shadcn/ui | ✅ `components/ui/` + `lib/utils.ts` (`cn`) + `components.json` |

**Importante sobre Tailwind v4:** no busques `tailwind.config.js`, no existe en v4.
Los colores de marca se declaran en el bloque `@theme` de `app/globals.css`
y generan utilidades solas: `bg-brand`, `text-brand`, `text-ink`, `text-ash`, etc.

## Dependencias que pidió cada componente

```
gsap                 → parallax-scrolling
lenis                → parallax-scrolling  (¡ojo! el paquete se renombró:
                        antes @studio-freight/lenis, hoy es solo "lenis")
lucide-react         → expanding-cards (íconos)
clsx, tailwind-merge → lib/utils.ts (cn) — base de shadcn
```

Ya están todas en `package.json`, solo hace falta `npm install`.

## Dónde quedó cada componente

`components/ui/` (copiados tal cual, solo se cambió contenido):

| Archivo | Sección | Se cambió |
|---|---|---|
| `parallax-scrolling.tsx` | **Nosotros** | Las 3 URLs del demo → tus 3 fotos. El `<h2>Parallax</h2>` → el título de la sección. El import de Lenis al nombre nuevo del paquete. |
| `expanding-cards.tsx` | **Servicios** (fondo negro) | Tokens `bg-card`/`border-border` de shadcn (que este proyecto no declara) → colores de marca. Los datos viven en `data/servicios.tsx`. |
| `circular-gallery.tsx` | **Proyectos** | La interfaz `GalleryItem` de animales → campos de proyecto. Datos en `data/proyectos.ts`. |
| `halide-topo-hero.tsx` | **Contacto** | Las 3 capas de fotos → tu panel solar. Título → "HABLEMOS DE TU PROYECTO". Botón → "WHATSAPP". Texto inferior izq. → link a `/contacto`. Accent `#ff3c00` → `#ea750a`. **Las líneas circulares (`.halide-contours`) se mantuvieron.** |

`components/site/` son los componentes propios (navbar, footer, hero del video, formulario).

## ⚠️ El CSS que faltaba (la causa del parallax roto)

Esto explica por qué el parallax nunca se veía como el original:

El componente de Osmo que me pasaste trae el JSX y la lógica de GSAP, **pero
sus clases CSS (`.parallax__layers`, `.parallax__layer-img`, `.parallax__fade`…)
viven en la hoja de estilos propia de Osmo, que no venía incluida en el código
pegado.** Sin ese CSS las capas no tienen alto, ni apilado, ni `position: sticky`
— por eso el efecto salía plano o "al revés".

Ese CSS está ahora escrito en `app/globals.css`, en el bloque marcado
`PARALLAX (componente de Osmo)`. Cómo funciona:

- `.parallax__layers` es el elemento que GSAP usa como trigger, así que
  necesita ser **alto** (`height: 260vh`) para dar recorrido de scroll.
- Cada capa lleva `position: sticky; top: 0` y las siguientes
  `margin-top: -100vh`, de modo que quedan **apiladas** una sobre otra.
- Así las 4 capas quedan fijas en pantalla mientras GSAP las separa → parallax.

**Dos perillas para ajustar a gusto:**
1. `height: 260vh` en `.parallax__layers` → más alto = el efecto dura más scroll.
2. Los `yPercent` en `parallax-scrolling.tsx` (70 / 55 / 40 / 10) → cuánto se
   mueve cada capa. Capa 1 = primer plano (se mueve más), capa 4 = fondo.

Los otros tres componentes sí eran autosuficientes (usan Tailwind, y el de
Halide trae su propio `<style>`), por eso esos no tuvieron este problema.

## Hidratación (lo que pediste que revisara)

Revisé los 4 componentes buscando `Math.random()`, `Date.now()` y similares:

- **Ninguno de los 4 usa `Math.random()` ni `Date.now()`.** No hay riesgo por ahí.
- Los 4 leen `window` (scroll, mousemove, innerWidth), pero **siempre dentro de
  `useEffect`**, que corre solo en el navegador. Eso es seguro. Los marqué con
  `"use client"` porque en App Router los componentes son de servidor por defecto
  y `useState`/`useEffect` no existen ahí.
- **El único valor dependiente del tiempo es `new Date().getFullYear()` en el
  footer.** Lo dejé como **Server Component** (sin `"use client"`), así la fecha
  se calcula una sola vez en el servidor y nunca hay desajuste servidor/cliente.
  Si alguna vez le agregan interactividad al footer y tienen que ponerle
  `"use client"`, hay que mover ese año a un `useEffect` o pasarlo como prop.

## Lenis y el video de la intro

Lenis (scroll suave) lo crea el componente del parallax, tal como venía en el
original. El hero del video necesita control total del scroll durante su intro,
así que **pausa Lenis mientras dura la intro y lo reanuda al terminar**
(`window.__lenis`, ver `components/site/scroll-video-hero.tsx`). Sin eso, los
dos pelean por el scroll.

## Qué falta reemplazar

- `public/videos/inco-intro-placeholder.mp4` → el video real de la intro.
  Los tiempos de las pausas están en `INTRO_STOPS` dentro de
  `components/site/scroll-video-hero.tsx`.
- `CONTACT_EMAIL` en `data/site.ts` → el email real de INCO (hoy dice
  `contacto@inco.cl` como placeholder).
- Un par de proyectos de la galería reutilizan fotos existentes; cuando tengan
  más fotos reales, se agregan en `data/proyectos.ts`.

## Publicación

Vercel detecta Next.js solo. Build: `npm run build`. Sin variables de entorno.

## Nota honesta

No pude correr `npm install` ni `npm run build` acá (este entorno no tiene
acceso a red), así que **no vi el sitio renderizado**. Validé la sintaxis de los
16 archivos TS/TSX y crucé todas las rutas de imágenes contra los archivos
reales. Lo que sí hay que ajustar mirándolo en el navegador son los números de
las animaciones (las "perillas" del parallax de arriba, el `radius` de la
galería circular, el tamaño del panel en Halide).
