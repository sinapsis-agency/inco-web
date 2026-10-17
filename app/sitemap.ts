import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://inco.cl/", priority: 1 },
    { url: "https://inco.cl/contacto", priority: 0.6 },
  ];
}
