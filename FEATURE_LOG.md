# Feature Log

Registro operativo de funcionalidades implementadas en el proyecto.

## Regla de uso
- Cada nueva funcionalidad debe añadir una entrada al final de este archivo.
- Formato mínimo por entrada:
  - `Fecha`
  - `Funcionalidad`
  - `Resumen`
  - `Archivos`

## Entradas

### 2026-03-05 - Academy: Asset Bonds ampliado
- Funcionalidad:
  - Nueva sección de `Spread de Crédito` con lectura por regímenes.
  - `Checklist` previo a compra de bonos/ETFs.
  - `Mini simulador` de impacto por spread con modo normal y modo estrés.
  - `Ladder`, calculadora de duración total y bloque de errores comunes de renta fija.
- Resumen:
  - Se amplió el contenido educativo de renta fija con bloques prácticos y componentes interactivos.
- Archivos:
  - `src/components/academy/assets/AssetBonds.tsx`
  - `src/components/academy/assets/AssetPage.css`

### 2026-03-05 - Academy: riesgo de divisa transversal
- Funcionalidad:
  - Módulo central en Gestión del Riesgo sobre cobertura de divisa (`hedged`/`unhedged`).
  - Callouts con enlace en páginas de Acciones, Bonos y REITs.
  - Nuevos términos en glosario relacionados con divisa/cobertura.
- Resumen:
  - Se centralizó el tema en `/academy/risk` y se añadió navegación contextual desde activos.
- Archivos:
  - `src/components/academy/guides/RiskManagement.tsx`
  - `src/components/academy/guides/RiskManagement.css`
  - `src/components/academy/assets/AssetEquities.tsx`
  - `src/components/academy/assets/AssetBonds.tsx`
  - `src/components/academy/assets/AssetREITs.tsx`
  - `src/components/academy/assets/AssetPage.css`
  - `src/data/academy/knowledge.ts`

### 2026-03-05 - Academy: navegación y estructura
- Funcionalidad:
  - Reorganización del sidebar de Academy por bloques (`Aprender`, `Construir`, `Analizar`).
  - Inclusión de rutas clave en prerender.
  - Nueva tarjeta en Fundamentos hacia `/academy/valuation`.
  - Sustitución del bloque de errores en `Tu Journey` por CTA a sección específica.
- Resumen:
  - Se mejoró la arquitectura de navegación y la coherencia de rutas visibles/prerenderizadas.
- Archivos:
  - `src/components/layout/Sidebar/Sidebar.tsx`
  - `src/components/layout/Sidebar/Sidebar.css`
  - `scripts/prerender.js`
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/guides/InvestorTimeline.tsx`
  - `src/components/academy/guides/InvestorTimeline.css`

### 2026-03-05 - Academy: homogeneización visual de cabeceras
- Funcionalidad:
  - Aplicación de patrón de cabecera tipo tarjeta (referencia Portfolio CSV) a vistas de Academy.
  - Ajuste de alineación en hero de páginas de activos.
- Resumen:
  - Se unificó la presentación de título/subtítulo a un patrón de diseño consistente.
- Archivos:
  - `src/components/academy/layout/AcademyLayout.css`
  - `src/components/academy/assets/AssetPage.css`

### 2026-03-05 - Academy: sección educativa en Fund Radar
- Funcionalidad:
  - Nueva sección `Cómo interpretar una ficha Morningstar (ejemplo real)`.
  - Posicionada antes de filtros y buscador.
  - Corrección visual de icono/alineación del bloque de filtros.
- Resumen:
  - Se añadió onboarding práctico para lectura de fichas de fondos dentro del propio radar.
- Archivos:
  - `src/components/academy/simulators/FundRadar.tsx`
  - `src/components/academy/simulators/FundRadar.css`

### 2026-03-05 - Academy: Common Errors responsive
- Funcionalidad:
  - Ajustes responsive para evitar cortes en móvil.
- Resumen:
  - Se adaptó la rejilla y elementos internos para pantallas pequeñas.
- Archivos:
  - `src/components/academy/guides/CommonErrors.tsx`
  - `src/components/academy/guides/CommonErrors.css`

### 2026-03-05 - Branding: favicon
- Funcionalidad:
  - Rediseño del favicon SVG (`wallet-icon.svg`), versión final minimal basada en pluma.
- Resumen:
  - Mejora de legibilidad del icono en pestaña/navegador.
- Archivos:
  - `public/wallet-icon.svg`
