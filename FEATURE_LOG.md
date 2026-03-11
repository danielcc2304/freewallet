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

### 2026-03-05 - Academy + Build: deduplicacion de contenido y optimizacion de carga
- Funcionalidad:
  - Fundamentos:
    - La tarjeta de activos ahora enlaza a `/academy/portfolio` y se reformulo como introduccion (`Tipos de Activos y Cartera`).
    - Ajustes responsive para evitar recortes de texto en movil.
  - Portfolio/Scenarios:
    - Mejora de wrapping en tarjetas/filtros de Portfolio Builder para pantallas pequenas.
    - Sustitucion visual de etiquetas `DO/DON'T` por badges con `tick/cruz` en Scenarios.
  - Rutas y consistencia:
    - Eliminacion de `/academy/asset-types` del listado central de rutas.
    - Redireccion de compatibilidad `/academy/asset-types` -> `/academy/portfolio`.
    - Eliminacion de `/academy/asset-types` del prerender.
  - Build/performance:
    - Endurecimiento del prerender para evitar fallos intermitentes de Puppeteer (timeout + reintento).
    - Split de chunks de Vite con `manualChunks` para separar dependencias pesadas.
    - Lazy-loading de rutas con `React.lazy` + `Suspense` en `App.tsx`.
- Resumen:
  - Se elimino solape entre secciones de Academy, se corrigio UX movil y se redujo el peso del bundle inicial mediante code splitting y carga diferida de rutas.
- Archivos:
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/guides/Fundamentos.css`
  - `src/components/academy/simulators/PortfolioBuilder.css`
  - `src/components/academy/guides/Scenarios.css`
  - `src/App.tsx`
  - `src/constants/routes.ts`
  - `scripts/prerender.js`
  - `vite.config.ts`

### 2026-03-05 - Hotfix: estabilidad de arranque tras lazy-load
- Funcionalidad:
  - Se dejo `MainLayout` y paginas base en carga normal para evitar bloqueo visual en el primer render.
  - Se mantuvo lazy-loading en secciones pesadas de Academy.
  - Fallback de `Suspense` visible sobre tema (`bg/text`) para no mostrar pantalla negra durante carga.
- Resumen:
  - Se corrigio incidencia de pantalla negra al iniciar y se preservo la optimizacion de carga diferida en rutas secundarias.
- Archivos:
  - `src/App.tsx`

### 2026-03-05 - Hotfix produccion: pantalla negra en inicio
- Funcionalidad:
  - Hardening de `ThemeProvider` ante errores de acceso a `localStorage`.
  - Fallback compatible con Safari para listeners de `matchMedia` (`addEventListener`/`addListener`).
- Resumen:
  - Se evita que errores de storage o compatibilidad de listeners rompan el render inicial en produccion.
- Archivos:
  - `src/context/ThemeContext.tsx`

### 2026-03-05 - Mitigacion produccion: rollback de optimizaciones de bundle
- Funcionalidad:
  - Se retiraron temporalmente `React.lazy`/`Suspense` a nivel de rutas en `App.tsx`.
  - Se retiro `manualChunks` custom de `vite.config.ts`.
- Resumen:
  - Cambio orientado a aislar y evitar regresion visual en home de produccion asociada a optimizaciones recientes.
- Archivos:
  - `src/App.tsx`
  - `vite.config.ts`

### 2026-03-05 - Optimizacion segura fase 1: chunks + recuperacion automatica
- Funcionalidad:
  - Reintroduccion de `manualChunks` en Vite para separar vendors pesados sin lazy-routing.
  - Handler global de errores de carga de chunks en runtime (`error` + `unhandledrejection`) con recarga unica controlada.
- Resumen:
  - Se mantiene mejora de bundle inicial reduciendo riesgo de pantalla en blanco por desfase de cache entre `index.html` y assets versionados.
- Archivos:
  - `vite.config.ts`
  - `src/main.tsx`

### 2026-03-05 - Academy assets: alineacion de hero y metricas
- Funcionalidad:
  - Correccion de alineacion en cabeceras de `/academy/assets/*` (icono y bloque de stats centrados en desktop).
  - Homogeneizacion visual de tarjetas de metricas para evitar desajustes verticales.
- Resumen:
  - Se corrigio el descuadre de bloques como retorno historico/volatilidad y se mejoro consistencia de presentacion entre subsecciones de activos.
- Archivos:
  - `src/components/academy/assets/AssetPage.css`

### 2026-03-05 - Rollback: manualChunks desactivado por incidencia en produccion
- Funcionalidad:
  - Reversion de configuracion `manualChunks` en Vite.
- Resumen:
  - Se deshace el split manual de bundles al confirmar regresion de visualizacion en home en entorno productivo.
- Archivos:
  - `vite.config.ts`

### 2026-03-05 - Academy: recursos y guias con videos de conocimientos basicos
- Funcionalidad:
  - Se reemplazo la vista "en desarrollo" por un listado real de videos de conocimientos basicos referenciados en La Pizarra de Andres.
  - Se anadio enlace a pagina fuente y busqueda directa de cada video en YouTube.
- Resumen:
  - La seccion `/academy/resources` pasa a ser util y accionable con recursos reales listados por tema.
- Archivos:
  - `src/components/academy/guides/InProcess.tsx`
  - `src/components/academy/guides/InProcess.css`

### 2026-03-05 - Academy resources: urls exactas de YouTube
- Funcionalidad:
  - Cada recurso de `/academy/resources` ahora enlaza al video exacto en YouTube.
  - Se elimino el texto de placeholder "siguiente paso" del footer.
- Resumen:
  - La seccion queda cerrada y lista para uso directo sin pasos intermedios de busqueda.
- Archivos:
  - `src/components/academy/guides/InProcess.tsx`

### 2026-03-05 - Academy resources: enlaces YouTube robustos en canal
- Funcionalidad:
  - Sustitucion de URLs de videos rotas por enlaces de busqueda directa dentro del canal oficial de La Pizarra de Andres.
- Resumen:
  - Se evita el error "Este video ya no esta disponible" y cada recurso abre un resultado vigente dentro del canal.
- Archivos:
  - `src/components/academy/guides/InProcess.tsx`

### 2026-03-05 - Terminos y condiciones: boton volver atras
- Funcionalidad:
  - Se anade boton de retorno en la parte superior de la pagina de terminos y condiciones (`navigate(-1)`).
  - Estilos responsive para mantener usabilidad en movil.
- Resumen:
  - Mejora de navegacion para salir facilmente de `/terms` sin depender del navegador del usuario.
- Archivos:
  - `src/pages/TermsAndConditions/TermsAndConditions.tsx`
  - `src/pages/TermsAndConditions/TermsAndConditions.css`

### 2026-03-11 - Portfolio CSV: soporte Excel unico y hardening de parseo
- Funcionalidad:
  - Se anadio soporte para subir un unico archivo Excel (`.xlsx/.xls`) con hojas `Cartera` y `Evolucion`.
  - Se corrigio el parseo numerico para soportar formatos ES/EN en importes y porcentajes.
  - Se resolvio un fallo de etiquetas duplicadas en movil para meses de distintos anos y se ajusto el tooltip superior para no tapar el eje inferior.
  - Se sustituyeron los datos demo iniciales por un dataset sintetico y las subidas vuelven a mostrarse tal cual, sin anonimizar automaticamente.
- Resumen:
  - `PortfolioCsv` queda listo para usar con plantillas CSV o con un unico Excel exportado, manteniendo metricas y graficos coherentes tanto en desktop como en movil.
- Archivos:
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/pages/PortfolioCsv/PortfolioCsv.css`
  - `package.json`
  - `package-lock.json`

### 2026-03-11 - Terminos y condiciones: flecha flotante persistente
- Funcionalidad:
  - Se reemplazo el boton incrustado de "volver atras" por una flecha flotante fija arriba a la izquierda.
  - La posicion se adapta para convivir con el sidebar en desktop y mantenerse accesible en movil durante el scroll.
  - Se reescribio el contenido del componente para normalizar el texto y evitar problemas de codificacion visibles.
- Resumen:
  - La pagina de terminos gana una salida mas limpia y consistente con el patron flotante de controles de navegacion de la app.
- Archivos:
  - `src/pages/TermsAndConditions/TermsAndConditions.tsx`
  - `src/pages/TermsAndConditions/TermsAndConditions.css`
