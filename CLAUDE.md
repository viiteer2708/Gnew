# CLAUDE.md — GRUPO NEW ENERGY
**Plataforma comercial interna para la red de ventas de GRUPO NEW ENERGY. Herramientas, materiales, tutoriales y datos de suministro.**

## Reglas de Oro
| Regla | Por qué |
|-------|---------|
| Español de España en UI, comentarios y commits. Código en inglés | Consistencia para equipo hispanohablante |
| TypeScript strict, nunca `any`. Tipar con `lib/types.ts` | Seguridad de tipos en todo el dominio |
| NO modificar precios en `cups/page.tsx` ni `lib/mock-data.ts` sin confirmación | Son datos comerciales reales |
| NO exponer datos de un comercial a otro | Aislamiento jerárquico obligatorio (RLS) |
| Usar Shadcn/ui. No instalar otras librerías UI sin preguntar | Consistencia de design system |
| NO usar Pages Router de Next.js | Solo App Router |
| Revisar `components/` antes de crear componentes nuevos | Evitar duplicados |

## Stack
- **Next.js 15** (App Router + Turbopack) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS 4** + **Shadcn/ui** (Radix UI) — dark mode por defecto, paleta turquesa
- **Three.js** + React Three Fiber (logo 3D login) · **Recharts 3** (gráficos dashboard)
- **Supabase** (activo) · **Context7** (activo)

## Estructura
```
app/
  (app)/              → Rutas protegidas (dashboard, cups, comparador, crm, emails, materiales, tutoriales)
  api/cups/search/    → Proxy SIPS con desencriptación AES-256-CBC
  api/dropbox-link/   → Genera enlaces temporales Dropbox
  login/              → Auth con cookie mock
components/           → Por módulo: cups/, comparador/, crm/, dashboard/, emails/, materiales/, tutoriales/, layout/, ui/
lib/
  dropbox.ts          → Integración Dropbox (refresh token + listado carpetas)
  mock-data.ts        → Datos mock para desarrollo
  types.ts            → Tipos TypeScript del dominio completo
  supabase/           → Clientes Supabase
```

## Archivos clave
- `lib/types.ts` — Todos los tipos del dominio. Tipar siempre desde aquí
- `lib/mock-data.ts` — Datos mock (⚠️ contiene precios reales GNE)
- `lib/dropbox.ts` — OAuth2 Dropbox con refresh automático cada 4h
- `app/api/cups/search/route.ts` — Proxy SIPS, desencripta AES-256-CBC con PBKDF2
- `app/api/dropbox-link/route.ts` — Enlaces temporales Dropbox por file-id

## APIs externas

### GreeningEnergy — SIPS (consulta CUPS)
- Base: `https://api.greeningenergy.com` · Auth: header `x-api-key`
- Endpoints: `/api/public/sips/info?cups=` (general) · `/info/raw?cups=` (crudo) · `/info/consumo?cups=` (histórico 12m)
- Respuestas encriptadas AES-256-CBC cuando header `x-iv` presente. Desencriptar con PBKDF2 (salt + api key → derived key)
- Doc OpenAPI: `C:\Users\viite\Downloads\openapi (1).json`

### Materiales comerciales — fuente híbrida
Dos fuentes posibles, seleccionadas en runtime por `lib/materiales-source.ts`:

1. **Local (preferida en dev):** carpeta `C:\DROPBOX\Dropbox\CRM GNEW` sincronizada por Dropbox desktop.
   - Activar definiendo `MATERIALES_LOCAL_PATH` en `.env.local`
   - `lib/materiales-local.ts` lee con `fs/promises`; traduce ruta Windows → WSL automáticamente
   - Endpoint `/api/materiales/file?id=<path>` sirve archivos por stream con validación anti path-traversal
2. **Dropbox API (fallback en Vercel):** OAuth2 con refresh token permanente
   - Carpeta raíz: `MATERIAL ENERGIA` (`id:Q-MSjjekoQYAAAAAAAAivA`); subcarpetas descubiertas dinámicamente
   - Renovar refresh token: autorizar en `https://www.dropbox.com/oauth2/authorize?client_id=m1weiqcjhu9vj7n&response_type=code&token_access_type=offline` → intercambiar código con `curl -X POST https://api.dropbox.com/oauth2/token -d "code=CODIGO&grant_type=authorization_code&client_id=m1weiqcjhu9vj7n&client_secret=le1iy7roccqj75l"`

### Logos de marca (UI de materiales)
- Carpeta: `public/logos/marcas/`
- Mapping explícito en `lib/brand-logos.ts` (slug → ruta)
- Slug se calcula del nombre de carpeta: `MEGA` → `mega`, `KLEEN ENERGY` → `kleen-energy`, `NET` → `net`
- Fallback si no se encuentra el logo: iniciales de la marca sobre fondo turquesa

## Variables de entorno (.env.local)
No se sube al repo (`.gitignore`). Se configura en **Vercel** y localmente.
```
GREENINGENERGY_API_KEY, GREENINGENERGY_SALT_B64
DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET   # fallback materiales en Vercel
MATERIALES_LOCAL_PATH                                         # opcional — fuerza fuente local (dev)
```
Credenciales completas: ver `.env.local` o Vercel dashboard.

## Roles y usuarios mock

| Rol | Acceso |
|-----|--------|
| ADMIN | Acceso total: usuarios, contratos, clientes, facturación, márgenes, comisiones reales, configuración |
| BACKOFFICE | Gestión operativa completa. Sin márgenes ni comisiones reales |
| DIRECTOR | Ve contratos/producción/facturación de su rama jerárquica. Sin márgenes internos |
| KAM | Ve su estructura directa (canales + comerciales). Sin márgenes internos |
| CANAL | Su producción + comerciales asignados |
| COMERCIAL | Solo su producción propia |

**Usuarios mock** (todos password `gne2026`):
`admin@` Víctor Marrón · `director@` Alejandro Sacristán · `kam@` Miguel Ángel Rubio · `canal@` Roberto Bilbao · `comercial@` Aitor Carracedo (`@gruponewenergy.es`)

## Flujo de trabajo
1. Imports absolutos desde `@/`. Nombrado: `PascalCase` componentes, `camelCase` funciones, `kebab-case` carpetas
2. Commits: `tipo: descripción en español` (feat, fix, refactor, docs, style)
3. Git push desde WSL siempre. Credential helper: Windows Git Credential Manager
4. Deploy: Vercel (env vars configuradas allí)

## Design system
- Dark mode por defecto, paleta turquesa
- Shadcn/ui (Radix UI) + Tailwind CSS 4
- Logo 3D animado en login (Three.js + R3F)

## Reglas de Ejecución
**PROHIBIDO sin pedir permiso:**
- git push (Victor hace push manualmente)
- Borrar archivos o ramas
- Cambios en datos comerciales/precios (`mock-data.ts`, `cups/page.tsx`)

**PERMITIDO sin preguntar:**
- Leer/escribir cualquier archivo de código
- Ejecutar builds, linters, type checks
- git add, git commit
- npm install · npm run dev

---

## Vault de Obsidian (contexto transversal)
Este proyecto está conectado con mi vault de Obsidian en `/mnt/c/Users/viite/Documents/OBSIDIAN/VIITEER`.

Si el vault no está cargado como directorio adicional, cárgalo:
`/add-dir /mnt/c/Users/viite/Documents/OBSIDIAN/VIITEER`

### Contexto de negocio
Este es el CRM/plataforma interna de **GNEW / Mega Energía** (brokerage energético). En el vault buscar:
- Arquitectura GNEW: jerarquía recursiva de roles, RLS, `commission_gnew`, `formula_configs`
- Mega Energía: equipo comercial, ATR 2026, regularización, tarifas y comisiones
- Motor de comisiones: decisiones sobre cálculo dual fórmula/tabla, tiers por comercializadora

### Regla
Antes de tomar decisiones de arquitectura o negocio, consulta el vault para verificar decisiones previas o contexto relevante.

---

## Wiki / Segundo Cerebro

Victor mantiene un wiki persistente (patrón LLM Wiki de Karpathy) en su vault de Obsidian.

- **Ruta:** C:\Users\viite\Documents\OBSIDIAN\VIITEER\_Wiki\
- **Schema:** _Wiki/CLAUDE.md (leer SIEMPRE antes de escribir en el wiki)
- **Páginas:** _Wiki/wiki/{entities,concepts,projects,sources,syntheses,queries,reports}/
- **Index:** _Wiki/index.md (actualizar en cada ingest)
- **Log:** _Wiki/log.md (append-only, entrada en cada operación)
- **Raw (inmutable):** _Wiki/raw/ — NO modificar

Cuando Victor diga "actualiza el wiki", "ingesta al wiki", o "qué sabemos sobre X":
1. Leer C:\Users\viite\Documents\OBSIDIAN\VIITEER\_Wiki\CLAUDE.md
2. Ejecutar la operación (ingest, query, o lint) siguiendo las convenciones
3. Actualizar index.md y log.md

Todo en español. Frontmatter YAML obligatorio en cada página.
