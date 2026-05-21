// Mapeo explícito de slug de marca → ruta del logo en /public.
// Añadir aquí nuevas marcas cuando se incorporen.
//
// El slug se calcula con brandSlug() en el componente (minúsculas, separado por '-').
// Ejemplos: "MEGA" → "mega", "KLEEN ENERGY" → "kleen-energy", "NET" → "net".

export const BRAND_LOGOS: Record<string, string> = {
  'mega': '/logos/marcas/logo_megaenergia.png',
  'kleen-energy': '/logos/marcas/Kleen Energy.png',
  'kleen': '/logos/marcas/Kleen Energy.png',
  'net': '/logos/marcas/logo Net.png',
}

export function getBrandLogo(slug: string): string | null {
  return BRAND_LOGOS[slug] ?? null
}
