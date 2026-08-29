# Feature Log

Registro operativo de funcionalidades implementadas en el proyecto.

## Regla de uso
- Cada nueva funcionalidad debe añadir una entrada al principio de este archivo, justo debajo de la cabecera Entradas.
- Formato mínimo por entrada:
  - `Fecha`
  - `Funcionalidad`
  - `Resumen`
  - `Archivos`

## Entradas

### 2026-08-29 - v3.9.2 - Hotfix: limpieza de la consulta de fondos
- Funcionalidad:
  - Se elimina el enlace de retorno a la Academia de la pantalla de información de fondos.
  - Se simplifica el encabezado retirando el icono decorativo y la etiqueta `Consulta educativa de fondos`.
  - Se eliminan las ayudas sobre pegar el ISIN con espacios y la nota técnica sobre CORS.
- Resumen:
  - La versión `v3.9.2` deja la consulta de fondos más directa y limpia en móvil, manteniendo el campo ISIN y su consulta intactos.
- Archivos:
  - `src/components/academy/calculators/FundInformationCalculator.tsx`
  - `src/components/academy/calculators/FundInformationCalculator.css`
  - `src/constants/app.ts`
  - `FEATURE_LOG.md`

### 2026-08-28 - v3.9.1 - Hotfix: ficha de fondos en producción
- Funcionalidad:
  - Se añaden rutas same-origin de Vercel para consultar la API y la ficha HTML pública de Finect sin depender de proxys CORS públicos inestables.
  - La herramienta mantiene fallback a proxys públicos cuando se ejecuta en un hosting que no soporte las rutas propias.
  - La ficha de fondos deja de aparecer en la cuadrícula de Calculadoras y pasa a estar directamente en `Academia > Herramientas`.
  - Se actualiza el enlace de retorno para que ya no apunte a Calculadoras.
- Resumen:
  - La versión `v3.9.1` corrige el bloqueo indefinido de la consulta Finect en producción y reubica su acceso en Herramientas.
- Archivos:
  - `vercel.json`
  - `src/services/finect/finectService.ts`
  - `src/app/routes/academyRoutes.tsx`
  - `src/components/academy/calculators/Calculators.tsx`
  - `src/components/academy/calculators/FundInformationCalculator.tsx`
  - `src/constants/app.ts`
  - `README.md`
  - `FEATURE_LOG.md`

### 2026-08-28 - v3.9.0 - Calculadoras: ficha de fondo por ISIN desde Finect
- Funcionalidad:
  - Nueva calculadora en `/academy/fund-information` para consultar una clase concreta pegando su ISIN.
  - Resolución exacta de la clase antes de extraer la ficha pública de Finect, evitando mezclar divisa o cobertura.
  - Muestra identidad, costes, riesgo, rentabilidades, composición, posiciones y documentación cuando están disponibles.
  - El servicio usa una capa de transporte SPA con proxy Vite en local, proxies CORS como fallback y respuesta JSON básica de Finect.
  - Corrige la extracción del estado embebido de Finect para conservar estadísticas, y muestra rentabilidad a 3 años, YTD y volatilidad a 3 años.
  - El indicador se presenta como `Riesgo 1-7` con ayuda interactiva de sus bandas de volatilidad anualizada.
- Resumen:
  - La versión `v3.9.0` incorpora una primera versión sin backend de la ficha de fondos, con un DTO estable preparado para sustituir el transporte por una API propia en el futuro.
- Archivos:
  - `src/services/finect/finectService.ts`
  - `src/components/academy/calculators/FundInformationCalculator.tsx`
  - `src/components/academy/calculators/FundInformationCalculator.css`
  - `src/components/academy/calculators/Calculators.tsx`
  - `src/app/routes/academyRoutes.tsx`
  - `vite.config.ts`
  - `scripts/generate-seo.js`
  - `scripts/prerender.js`
  - `scripts/test-finect.ts`
  - `package.json`
  - `README.md`
  - `FEATURE_LOG.md`

### 2026-08-28 - Calculadora: CAGR, TIN y frecuencia de capitalización
- Funcionalidad:
  - Se distingue entre rentabilidad anual efectiva (`CAGR`) y tasa nominal anual (`TIN`).
  - El modo TIN permite elegir capitalización diaria, mensual, trimestral, semestral o anual.
  - Se muestra la rentabilidad anual efectiva equivalente y se mantiene la simulación mensual para las aportaciones.
  - Los modos de objetivos, retiradas, gráficos y detalle año a año utilizan la misma conversión de tasas.
  - La calculadora FIRE reutiliza la conversión CAGR mensual para sus proyecciones y cálculos de tiempo.
  - Se centra verticalmente el control y el texto de las opciones de retiradas anuales.
- Resumen:
  - La versión `v3.8.3` interpreta por defecto la rentabilidad como CAGR y evita que la frecuencia interna convierta una rentabilidad efectiva del 10% en un 10,47%.
- Archivos:
  - `src/components/academy/calculators/CompoundInterestCalc.tsx`
  - `src/components/academy/calculators/CompoundInterestCalc.css`
  - `src/components/academy/calculators/compoundInterestUtils.ts`
  - `src/components/academy/calculators/FIRECalculator.tsx`
  - `src/constants/app.ts`
  - `scripts/test-compound-interest.ts`
  - `package.json`
  - `FEATURE_LOG.md`

### 2026-08-22 - Academy: aviso de progreso en Radar de fondos
- Funcionalidad:
  - Se incorpora un aviso modal al entrar en el Radar de fondos para comunicar que la sección está en desarrollo.
  - El aviso permite cerrar la ventana o navegar a Academia, Configuración y Portfolio.
  - El ranking y las fichas de fondos siguen disponibles al cerrar el aviso.
- Resumen:
  - La versión `v3.8.2` comunica el estado de desarrollo del Radar de fondos mientras se prepara su próxima revisión.
- Archivos:
  - `src/components/academy/simulators/FundRadar.tsx`
  - `src/components/academy/simulators/FundRadar.css`
  - `src/constants/app.ts`
  - `FEATURE_LOG.md`

### 2026-08-14 - Hotfix: edición de asignación objetivo en Portfolio
- Funcionalidad:
  - Los inputs de `Asignación objetivo` permiten borrar el valor inicial y escribir uno nuevo sin que el `0` reaparezca durante la edición.
  - Se mantiene el cálculo numérico de la suma objetivo y de las desviaciones mientras el campo conserva temporalmente una cadena vacía.
  - Se elimina el bucket redundante `Objetivo` para mostrar únicamente largo plazo, medio plazo y liquidez.
- Resumen:
  - La versión `v3.8.1` corrige la edición de pesos objetivo y simplifica la lectura de los buckets del Portfolio.
- Archivos:
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/pages/PortfolioCsv/portfolioCsvConstants.ts`
  - `src/pages/PortfolioCsv/portfolioCsvTypes.ts`
  - `src/constants/app.ts`
  - `FEATURE_LOG.md`

### 2026-08-14 - Portfolio + Academy: Excel ampliado y espaciado responsive
- Funcionalidad:
  - Se homogeneiza el espaciado horizontal de las páginas de Academy tomando como referencia la calculadora de interés compuesto, con especial mejora en `Fundamentos` y en móvil.
  - Portfolio interpreta las hojas opcionales `Estadísticas avanzadas` y `Datos diarios` del Excel y recalcula ratios de riesgo, benchmark y volatilidad sin depender de fórmulas dinámicas incompatibles.
  - Se filtran filas incompletas del benchmark y se completa la evolución acumulada cuando el Excel deja celdas calculadas vacías.
  - `Descargar plantilla` entrega el Excel de referencia completo, conservando formatos, fórmulas y gráficos, pero con datos de prueba anonimizados.
  - Se normaliza el padding vertical de las leyendas de los gráficos del portfolio para alinearlo con los controles desplegables entre tarjetas.
  - La pantalla de novedades elimina el botón de volver y la versión visible de la aplicación pasa a `v3.8.0`.
- Resumen:
  - La versión `v3.8.0` mejora la consistencia visual en móvil y aprovecha mejor la información avanzada disponible en las nuevas plantillas de Portfolio.
- Archivos:
  - `src/components/academy/layout/AcademyLayout.css`
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/pages/PortfolioCsv/PortfolioCsv.css`
  - `src/pages/PortfolioCsv/portfolioCsvConstants.ts`
  - `src/pages/PortfolioCsv/portfolioCsvTypes.ts`
  - `src/pages/PortfolioCsv/portfolioCsvUtils.ts`
  - `src/pages/FeatureLog/FeatureLog.tsx`
  - `src/pages/FeatureLog/FeatureLog.css`
  - `src/constants/app.ts`
  - `README.md`
  - `public/plantilla-portfolio.xlsx`


### 2026-05-05 - Portfolio: comparativa contra benchmark
- Funcionalidad:
  - Se anade soporte para una hoja opcional `Comparativa` en el Excel de Portfolio.
  - La plantilla descargable incluye datos de comparativa frente a MSCI World.
  - Se incorporan metricas de lectura del benchmark: rentabilidad acumulada de cartera, acumulado MSCI World, diferencia acumulada, meses batiendo al benchmark y mejores/peores meses relativos.
  - Se anade un grafico combinado con evolucion acumulada de cartera, evolucion acumulada del benchmark y alpha mensual.
  - Se endurece el parseo de periodos y porcentajes para soportar formatos con ano delante y decimales partidos por separador.
  - Se actualiza la version visible de la aplicacion a `v3.7.0`.
- Resumen:
  - La version `v3.7.0` amplia Portfolio con una lectura comparativa frente a benchmark para evaluar si la cartera compensa su riesgo relativo.
- Archivos:
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/pages/PortfolioCsv/PortfolioCsv.css`
  - `src/pages/PortfolioCsv/portfolioCsvConstants.ts`
  - `src/pages/PortfolioCsv/portfolioCsvTypes.ts`
  - `src/pages/PortfolioCsv/portfolioCsvUtils.ts`
  - `src/constants/app.ts`

### 2026-04-22 - App: Feature Log visible desde la version
- Funcionalidad:
  - Se invierte el orden de `FEATURE_LOG.md` para dejar las updates recientes al principio.
  - La version visible de la app enlaza a una nueva pantalla de novedades basada en el feature log.
  - Se actualiza la version visible de la aplicacion a `v3.6.13`.
- Resumen:
  - La version `v3.6.13` facilita revisar las mejoras publicadas desde la propia app.
- Archivos:
  - `FEATURE_LOG.md`
  - `src/pages/FeatureLog/FeatureLog.tsx`
  - `src/pages/FeatureLog/FeatureLog.css`
  - `src/pages/FeatureLog/index.ts`
  - `src/pages/index.ts`
  - `src/App.tsx`
  - `src/components/layout/Sidebar/Sidebar.tsx`
  - `src/components/layout/Sidebar/Sidebar.css`
  - `src/pages/Settings/Settings.tsx`
  - `src/pages/Settings/Settings.css`
  - `src/constants/app.ts`
  - `src/constants/routes.ts`
  - `scripts/generate-seo.js`
  - `scripts/prerender.js`

### 2026-04-22 - Academy: limpieza de copy en Fundamentos y Glosario
- Funcionalidad:
  - Se elimina la etiqueta obsoleta `Academia + CSV` del bloque de lectura de cartera real en `Fundamentos`.
  - Se simplifica el subtitulo del `Diccionario Financiero` retirando la referencia redundante a busqueda y filtros.
  - Se actualiza la version visible de la aplicacion a `v3.6.12`.
- Resumen:
  - La version `v3.6.12` limpia textos de apoyo en Academy para mantener una presentacion mas directa y coherente.
- Archivos:
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/guides/Glossary.tsx`
  - `src/constants/app.ts`

### 2026-04-20 - Academy: mejora visual de tarjetas de Fundamentos
- Funcionalidad:
  - Se ajusta el fondo y borde de las mini tarjetas de `Fundamentos` para mejorar contraste y visibilidad.
  - Se actualiza la version visible de la aplicacion a `v3.6.11`.
- Resumen:
  - La version `v3.6.11` refina la lectura visual de la ruta guiada de Fundamentos.
- Archivos:
  - `src/components/academy/guides/Fundamentos.css`
  - `src/constants/app.ts`

### 2026-04-20 - Portfolio: ajuste de reset anual y eje TWR
- Funcionalidad:
  - Se corrige la condicion de corte para evitar resetear el primer punto de la serie anual en `PortfolioCsv`.
  - La linea `TWR YTD %` pasa al eje izquierdo para alinear su lectura con las barras de retorno mensual.
  - Se actualiza la version visible de la aplicacion a `v3.6.10`.
- Resumen:
  - La version `v3.6.10` ajusta la continuidad visual del grafico de evolucion y corrige la representacion de la serie TWR anual.
- Archivos:
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/constants/app.ts`

### 2026-04-13 - Add Investment + Academy: avisos guiados y copy refinado
- Funcionalidad:
  - `AddInvestment` incorpora un modal de seccion en progreso con accesos rapidos a `Academia`, `Configuracion` y `Portfolio`.
  - Se anade el estilo visual del nuevo aviso en `AddInvestment.css`, alineado con el patron usado en dashboard.
  - Se reducen a 2 los modulos visibles por nivel en el resumen inicial de `Fundamentos`.
  - Se corrigen textos y acentos visibles en rutas y CTAs de Academy y dashboard (`Gestión del riesgo`, `Configuración`).
  - Se actualiza la version visible de la aplicacion a `v3.6.9`.
- Resumen:
  - La version `v3.6.9` extiende el patron de avisos guiados a alta de inversiones y pule el copy visible en secciones clave de la app.
- Archivos:
  - `src/pages/AddInvestment/AddInvestment.tsx`
  - `src/pages/AddInvestment/AddInvestment.css`
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/simulators/FundRadar.tsx`
  - `src/app/routes/academyRoutes.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/constants/app.ts`

### 2026-04-13 - Dashboard: aviso central con accesos rapidos
- Funcionalidad:
  - El aviso del dashboard pasa de un modal tecnico ligado al estado de APIs a un bloque central mas visual y persistente al entrar en la vista.
  - Se anaden accesos rapidos desde el propio aviso hacia `Academia`, `Configuracion` y `Portfolio CSV`.
  - Se refuerza el estilo del modal con iconografia ampliada, CTA principal y ajustes responsive.
  - Se actualiza la version visible de la aplicacion a `v3.6.8`.
- Resumen:
  - La version `v3.6.8` mejora la comunicacion de que el dashboard sigue en progreso y da una salida mas clara a las secciones estables de la app.
- Archivos:
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/pages/Dashboard/Dashboard.css`
  - `src/constants/app.ts`

### 2026-04-13 - Academy: Fundamentos por niveles y etiqueta Portfolio
- Funcionalidad:
  - La ruta guiada por nivel en `Fundamentos` pasa a mostrar un resumen inicial de 3 modulos por nivel con opcion de expandir o contraer el listado completo.
  - Se reorganiza la maquetacion de tarjetas por nivel para mejorar lectura y jerarquia visual en desktop y responsive.
  - Se ajusta el copy de `Portfolio CSV` a `Portfolio` en bloques de Fundamentos y en la cabecera de `PortfolioCsv`.
  - Se actualiza la version visible de la aplicacion a `v3.6.7`.
- Resumen:
  - La version `v3.6.7` mejora la navegacion progresiva dentro de Fundamentos y termina de unificar el naming de Portfolio en la experiencia educativa.
- Archivos:
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/guides/Fundamentos.css`
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/constants/app.ts`

### 2026-04-10 - Academy + App: ajustes de copy, glosario y versionado centralizado
- Funcionalidad:
  - Se renombra la entrada principal de `Portfolio CSV` a `Portfolio` en sidebar y CTAs relacionadas para unificar la navegacion.
  - Se centraliza el nombre y la version de la app en `src/constants/app.ts`, reutilizandolos en sidebar y ajustes.
  - Se amplian los conocimientos base de Academy con nuevos terminos de derivados y estrategia (`Derivado`, `Opciones`, `Theta`, `Contango`, `Backwardation`, `Long`, `Short`).
  - Se afinan copies y detalles visuales en contenidos de acciones, gestion del riesgo, valoracion, radar de fondos y constructor de cartera.
- Resumen:
  - La version `v3.6.6` consolida textos mas coherentes en la app, reduce duplicidad en el versionado visible y amplia el glosario educativo con conceptos de derivados.
- Archivos:
  - `src/components/layout/Sidebar/Sidebar.tsx`
  - `src/pages/Settings/Settings.tsx`
  - `src/constants/app.ts`
  - `src/data/academy/knowledge.ts`
  - `src/components/academy/assets/AssetEquities.tsx`
  - `src/components/academy/assets/AssetPage.css`
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/guides/RiskManagement.tsx`
  - `src/components/academy/guides/RiskManagement.css`
  - `src/components/academy/guides/ValuationGuide.tsx`
  - `src/components/academy/simulators/FundRadar.tsx`
  - `src/components/academy/simulators/PortfolioBuilder.tsx`

### 2026-03-11 - Portfolio CSV: anos implicitos en Excel de evolucion
- Funcionalidad:
  - El parser de evolucion detecta filas de ano (`2026`) y resumentes `YTD 2025` para asignar el ano correcto a meses sin sufijo explicito.
- Resumen:
  - Se elimina la colision entre meses repetidos de distintos bloques anuales al cargar ciertos Excel, especialmente en el grafico "Drivers del mes".
- Archivos:
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`

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

### 2026-03-05 - Terminos y condiciones: boton volver atras
- Funcionalidad:
  - Se anade boton de retorno en la parte superior de la pagina de terminos y condiciones (`navigate(-1)`).
  - Estilos responsive para mantener usabilidad en movil.
- Resumen:
  - Mejora de navegacion para salir facilmente de `/terms` sin depender del navegador del usuario.
- Archivos:
  - `src/pages/TermsAndConditions/TermsAndConditions.tsx`
  - `src/pages/TermsAndConditions/TermsAndConditions.css`

### 2026-03-05 - Academy resources: enlaces YouTube robustos en canal
- Funcionalidad:
  - Sustitucion de URLs de videos rotas por enlaces de busqueda directa dentro del canal oficial de La Pizarra de Andres.
- Resumen:
  - Se evita el error "Este video ya no esta disponible" y cada recurso abre un resultado vigente dentro del canal.
- Archivos:
  - `src/components/academy/guides/InProcess.tsx`

### 2026-03-05 - Academy resources: urls exactas de YouTube
- Funcionalidad:
  - Cada recurso de `/academy/resources` ahora enlaza al video exacto en YouTube.
  - Se elimino el texto de placeholder "siguiente paso" del footer.
- Resumen:
  - La seccion queda cerrada y lista para uso directo sin pasos intermedios de busqueda.
- Archivos:
  - `src/components/academy/guides/InProcess.tsx`

### 2026-03-05 - Academy: recursos y guias con videos de conocimientos basicos
- Funcionalidad:
  - Se reemplazo la vista "en desarrollo" por un listado real de videos de conocimientos basicos referenciados en La Pizarra de Andres.
  - Se anadio enlace a pagina fuente y busqueda directa de cada video en YouTube.
- Resumen:
  - La seccion `/academy/resources` pasa a ser util y accionable con recursos reales listados por tema.
- Archivos:
  - `src/components/academy/guides/InProcess.tsx`
  - `src/components/academy/guides/InProcess.css`

### 2026-03-05 - Rollback: manualChunks desactivado por incidencia en produccion
- Funcionalidad:
  - Reversion de configuracion `manualChunks` en Vite.
- Resumen:
  - Se deshace el split manual de bundles al confirmar regresion de visualizacion en home en entorno productivo.
- Archivos:
  - `vite.config.ts`

### 2026-03-05 - Academy assets: alineacion de hero y metricas
- Funcionalidad:
  - Correccion de alineacion en cabeceras de `/academy/assets/*` (icono y bloque de stats centrados en desktop).
  - Homogeneizacion visual de tarjetas de metricas para evitar desajustes verticales.
- Resumen:
  - Se corrigio el descuadre de bloques como retorno historico/volatilidad y se mejoro consistencia de presentacion entre subsecciones de activos.
- Archivos:
  - `src/components/academy/assets/AssetPage.css`

### 2026-03-05 - Optimizacion segura fase 1: chunks + recuperacion automatica
- Funcionalidad:
  - Reintroduccion de `manualChunks` en Vite para separar vendors pesados sin lazy-routing.
  - Handler global de errores de carga de chunks en runtime (`error` + `unhandledrejection`) con recarga unica controlada.
- Resumen:
  - Se mantiene mejora de bundle inicial reduciendo riesgo de pantalla en blanco por desfase de cache entre `index.html` y assets versionados.
- Archivos:
  - `vite.config.ts`
  - `src/main.tsx`

### 2026-03-05 - Mitigacion produccion: rollback de optimizaciones de bundle
- Funcionalidad:
  - Se retiraron temporalmente `React.lazy`/`Suspense` a nivel de rutas en `App.tsx`.
  - Se retiro `manualChunks` custom de `vite.config.ts`.
- Resumen:
  - Cambio orientado a aislar y evitar regresion visual en home de produccion asociada a optimizaciones recientes.
- Archivos:
  - `src/App.tsx`
  - `vite.config.ts`

### 2026-03-05 - Hotfix produccion: pantalla negra en inicio
- Funcionalidad:
  - Hardening de `ThemeProvider` ante errores de acceso a `localStorage`.
  - Fallback compatible con Safari para listeners de `matchMedia` (`addEventListener`/`addListener`).
- Resumen:
  - Se evita que errores de storage o compatibilidad de listeners rompan el render inicial en produccion.
- Archivos:
  - `src/context/ThemeContext.tsx`

### 2026-03-05 - Hotfix: estabilidad de arranque tras lazy-load
- Funcionalidad:
  - Se dejo `MainLayout` y paginas base en carga normal para evitar bloqueo visual en el primer render.
  - Se mantuvo lazy-loading en secciones pesadas de Academy.
  - Fallback de `Suspense` visible sobre tema (`bg/text`) para no mostrar pantalla negra durante carga.
- Resumen:
  - Se corrigio incidencia de pantalla negra al iniciar y se preservo la optimizacion de carga diferida en rutas secundarias.
- Archivos:
  - `src/App.tsx`

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

### 2026-03-05 - Branding: favicon
- Funcionalidad:
  - Rediseño del favicon SVG (`wallet-icon.svg`), versión final minimal basada en pluma.
- Resumen:
  - Mejora de legibilidad del icono en pestaña/navegador.
- Archivos:
  - `public/wallet-icon.svg`

### 2026-03-05 - Academy: Common Errors responsive
- Funcionalidad:
  - Ajustes responsive para evitar cortes en móvil.
- Resumen:
  - Se adaptó la rejilla y elementos internos para pantallas pequeñas.
- Archivos:
  - `src/components/academy/guides/CommonErrors.tsx`
  - `src/components/academy/guides/CommonErrors.css`

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

### 2026-03-05 - Academy: homogeneización visual de cabeceras
- Funcionalidad:
  - Aplicación de patrón de cabecera tipo tarjeta (referencia Portfolio CSV) a vistas de Academy.
  - Ajuste de alineación en hero de páginas de activos.
- Resumen:
  - Se unificó la presentación de título/subtítulo a un patrón de diseño consistente.
- Archivos:
  - `src/components/academy/layout/AcademyLayout.css`
  - `src/components/academy/assets/AssetPage.css`

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
