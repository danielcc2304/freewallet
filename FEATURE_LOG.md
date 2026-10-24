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

### 2026-10-24 - Tailwind: simuladores y Heatmap de mercados
- Funcionalidad:
  - Comparte cabeceras de Estrategia y cartera y Simulador de cartera sobre `AcademyPageHeader`.
  - Extrae encabezados de sección, campos, grupos de filtros, tablas, leyendas, avisos, desplegables nativos y estados vacíos de ambos simuladores.
  - Compone el espacio de trabajo del Heatmap: controles, métricas, contenedor del gráfico, estados de carga/error, selección, extremos, sectores, pie y acciones flotantes; reutiliza `DataItem` y `Button`.
- Resumen:
  - Retira 341 líneas de CSS fuente y 98 declaraciones `@apply`. Las tres hojas pasan de 647 a 306 líneas; quedan 7.933 líneas en 58 hojas, una reducción acumulada del 65,13 %. No representa ahorro equivalente de descarga.
  - Conserva cálculos, fuentes, consultas, persistencia y calendario de refresco. La referencia de React permanece en el mismo contenedor del gráfico.
  - Verifica 64 estados de estilos calculados y 36 combinaciones responsive, filtros y asignación, selección, redimensionado, cambio de índice y refresco del Heatmap, TypeScript, ESLint y build.
- Archivos:
  - `src/components/academy/simulators/{PortfolioBuilder,AssetAllocationSim}.*`, `src/components/academy/tools/MarketHeatmap.*`.
  - `src/components/academy/ui/AcademySimulationPageHeader*`, `AcademySimulationWorkspace*`, `Academy{Allocation,Strategy}{Header,Workspace}.styles.ts`, `HeatmapWorkspace*`.

### 2026-10-24 - Tailwind: calculadoras y tarjetas de estrategia
- Funcionalidad:
  - Comparte rejillas de campos y resultados entre IRPF, bonos y ficha de fondos mediante `CalculatorGrid`.
  - Extrae desgloses semánticos, grupos familiares, resumen de nómina, liquidación fiscal y tarjetas de comparación de pagas y escenarios.
  - Compone la identidad del fondo, etiquetas, características, enlace a la fuente y ayuda accesible de riesgo; comparte tarjetas completas de bloques de inversión mediante `AcademyAssetGuideCard`.
- Resumen:
  - Retira 293 líneas de CSS fuente y 119 declaraciones `@apply`. Las cuatro hojas pasan de 716 a 423 líneas; quedan 8.274 líneas en 58 hojas, un 63,64 % menos respecto al inicio. Esta medida no representa ahorro de descarga.
  - Conserva calendarios, cálculos, consultas, persistencia, controles nativos, navegación y materiales de Liquid Glass.
  - Verifica cálculos de IRPF, bonos y asignación, la regresión independiente de CoreWeave, recorridos funcionales, 64 estados de estilos calculados y 48 combinaciones responsive, TypeScript, ESLint y build.
- Archivos:
  - `src/components/academy/calculators/{SalaryCalculator,BondCalculator,FundInformationCalculator}.*`, `CalculatorGrid`, `CalculatorBreakdown`, `CalculatorComparison`, `CalculatorFundIdentity` y sus recetas Tailwind.
  - `src/components/academy/simulators/PortfolioBuilder.*`, `src/components/academy/ui/AcademyAssetGuideCard*`.

### 2026-10-24 - Tailwind: gastos, importación y análisis histórico
- Funcionalidad:
  - Extrae componentes con estructura y estilos Tailwind para distribuciones, leyendas, barras mensuales, cuentas, categorías, objetivos, paginación, estado de guardado y avisos de gastos.
  - Comparte los controles de revisión de importaciones CSV/Excel y las cabeceras, leyendas, comprobaciones, filas de planificación, tooltips, gráficos y aviso de transición de Portfolio.
  - Compone los encabezados, resúmenes, controles y bloques de asignación del análisis histórico del Dashboard; el detalle de activos comparte marcos de gráficos, estados de histórico, fuentes y secciones de fondos.
- Resumen:
  - Retira 582 líneas de CSS fuente y 228 declaraciones `@apply`. Quedan 8.567 líneas en 58 hojas: reducción acumulada del 62,35 % respecto al inicio. Esta cifra no equivale a ahorro de descarga.
  - Conserva cálculos, importación, sincronización, persistencia y eventos de puntero en sus módulos originales; mantiene etiquetas nativas y clases de integración con Liquid Glass.
  - Coinciden 136 estados visuales distintos y pasan 72 combinaciones responsive, las pruebas funcionales de gastos, acciones y once fondos, TypeScript, ESLint y build.
  - Estabiliza la prueba de once fondos: distingue consultas canceladas, espera las activas y exige una nueva redirección canónica al reintentar.
- Archivos:
  - `src/components/expenses/ExpenseManager.*`, `src/components/expenses/ExpenseImportDialog.tsx`, `src/components/expenses/ui/ExpenseOverview*`, `src/components/expenses/ui/ExpenseFeedback*` y sus mapas de estilos.
  - `src/pages/PortfolioCsv/PortfolioCsv.*`, `src/pages/PortfolioCsv/ui/PortfolioAnalysis*`, `src/pages/PortfolioCsv/ui/PortfolioImportPresentation*` y sus mapas de estilos.
  - `src/components/dashboard/AssetDetail.*`, `src/components/dashboard/PortfolioExcelInsights.*`, `src/components/dashboard/ui/DashboardAssetChart*`, `src/components/dashboard/ui/HistoricalAnalysis*` y sus mapas de estilos.
  - `scripts/test-fund-chart-ui.ts`, `README.md`, `docs/tailwind-migration.md`, `docs/tailwind-module-inventory.md`.

### 2026-10-24 - Tailwind: guías de activos, objetivos y recorrido
- Funcionalidad:
  - Amplía la composición en las cinco guías de activos, Interés compuesto, Tu viaje como inversor y Novedades.
  - Comparte cabeceras, navegación interna, lectura, métricas, barras de duración/inflación, ratings, curvas, controles y experimentos de renta fija, escalones de vencimiento y accesos a otras guías.
  - Extrae opciones avanzadas, objetivos y detalle anual de Interés compuesto, los bloques de apoyo del viaje inversor y las entradas, secciones y archivos del historial de versiones.
- Resumen:
  - Retira 1.180 líneas de CSS fuente y 296 declaraciones `@apply`. Quedan 9.149 líneas en 58 hojas: reducción acumulada del 59,79 % frente al inicio; no mide el ahorro de descarga.
  - Conserva los cálculos, datos, persistencia, controles nativos, callbacks y clases de Liquid Glass. Las declaraciones ajenas a JSX de las ocho pantallas conservan su lógica.
  - Pasan TypeScript, ESLint, build sin prerender, presupuesto de carga diferida, pruebas de interés compuesto e integridad de calculadoras y el recorrido funcional de calculadoras/Dashboard. Coinciden 160 estados comparados y pasan 144 combinaciones responsive en 12 rutas.
- Archivos:
  - `src/components/academy/assets/*`, `src/components/academy/ui/AcademyAsset*`, `src/components/academy/ui/AcademyBond*`, `src/components/academy/ui/AcademyMetric.tsx`.
  - `src/components/academy/calculators/CalculatorGoal*`, `src/components/academy/calculators/CompoundInterestCalc.*`, `src/components/academy/ui/JourneySupport*`, `src/components/academy/guides/InvestorTimeline.*`.
  - `src/pages/FeatureLog/*`, `README.md`, `docs/tailwind-migration.md`, `docs/tailwind-module-inventory.md`.

### 2026-10-24 - Tailwind: guías, simuladores, sidebar y composición
- Funcionalidad:
  - Amplía la migración a 17 módulos: Fundamentos, Glosario, Errores, Escenarios, Riesgo, Estrategias, Fiscalidad, Valoración, Recursos, test de perfil, construcción de cartera, Crisis, asignación, Market Timing, sidebar, composición del Dashboard y editor de noticias.
  - Comparte encabezados, navegación interna, avisos, fichas, ejemplos, tarjetas de herramientas, preguntas/resultados, filtros, decisiones, exposición y desplegables nativos mediante componentes React con estructura y utilidades Tailwind.
  - Completa los estilos del componente de vídeo existente y separa los controles reutilizables de Tiptap de los estilos de su contenido enriquecido.
- Resumen:
  - Retira 1.285 líneas de CSS fuente y 422 declaraciones `@apply`. Quedan 10.329 líneas en 58 hojas: reducción acumulada del 54,60 % respecto al inicio; esta cifra no mide el tamaño descargado.
  - Mantiene cálculos, datos, consultas, persistencia, controles nativos y callbacks en los módulos originales; conserva las clases usadas por Liquid Glass y las pruebas.
  - Validación: TypeScript, ESLint, build sin prerender, presupuesto de carga diferida, pruebas de cálculos y recorridos de estrategia/asignación, desglose de fondos y juego. Coinciden 248 estados por propiedades calculadas; pasan 216 combinaciones responsive en 18 rutas, incluidos temas claro/oscuro, estándar/Liquid Glass.
- Archivos:
  - `src/components/academy/guides/*`, `src/components/academy/simulators/*`, `src/components/academy/ui/*`.
  - `src/components/dashboard/CompositionParts*`, `src/components/dashboard/PortfolioComposition.*`, `src/components/layout/Sidebar/*`, `src/components/news/RichTextEditor/*`.
  - `README.md`, `docs/tailwind-migration.md`, `docs/tailwind-module-inventory.md`.

### 2026-10-23 - Tailwind: posiciones, controles y estructuras compartidas
- Funcionalidad:
  - Comparte celdas de activos, variaciones, pesos, datos móviles, cabeceras y secciones del detalle en Dashboard.
  - Reutiliza controles nativos entre Ajustes y Portfolio, `FormField` en Ajustes y `ActionGroup` en Añadir activo; extrae preferencias, resultados de búsqueda, selección, cotización y avisos.
  - Comparte fichas y tarjetas de las cinco guías de activos, controles del mapa de calor, filas de posiciones y objetivos de Portfolio, y filas, calendario, buscador, selector mensual, exportación y ayuda de importación de gastos.
- Resumen:
  - Retira 938 líneas de CSS fuente y 272 declaraciones `@apply`. Quedan 11.614 líneas en 58 hojas: reducción acumulada del 48,96 % respecto al inicio.
  - Mantiene datos, cálculos, consultas, controles nativos, referencias, callbacks y almacenamiento en los módulos originales.
  - Estabiliza la prueba de regreso al Dashboard esperando que las acciones y los lotes estén visibles antes de continuar.
- Archivos:
  - src/components/dashboard/{AssetsTable,AssetDetail,ui}; src/components/ui/{PreferenceOption,InvestmentFeedback,NativeControl,ActionGroup}; src/components/academy/{assets,tools/MarketHeatmap,ui}; src/pages/{AddInvestment,Settings,PortfolioCsv}; src/components/expenses/{ExpenseManager,ExpenseImportDialog,ui}; scripts/{test-dashboard-edit-return-ui,test-dashboard-market-polish}.ts; README.md; documentación de Tailwind.

### 2026-10-23 - Tailwind: calculadoras, viaje inversor y categorías de activos
- Funcionalidad:
  - Comparte cabeceras, opciones, gráficos, leyendas, avisos y detalle anual con estructura y estilos Tailwind en interés compuesto, FIRE y jubilación.
  - Comparte búsqueda, estados de carga/error/vacío y posiciones de la ficha de fondos; compone las etapas, listas y asignaciones del viaje del inversor.
  - Reutiliza tarjetas completas de categorías en las cinco guías de activos, incluidas las variantes de riesgo y duración de bonos.
- Resumen:
  - Retira 1.069 líneas de CSS fuente y 240 declaraciones `@apply` en diez módulos. Quedan 12.552 líneas en 58 hojas: 44,83 % menos frente al inicio de la migración.
  - Conserva cálculos, consultas, controles nativos, persistencia y contenido. Mantiene CSS contextual para materiales Liquid Glass, contenedores y gráficos específicos.
- Archivos:
  - src/components/academy/calculators/{CalculatorToolHeading,CalculatorChoice,CalculatorOption,CalculatorChart,CalculatorLegend,CalculatorNotice,CalculatorYearDetail,CalculatorLookup,CalculatorEducationCard}; sus consumidores y estilos; src/components/academy/ui/{JourneyPhase,AssetCategoryCard,BondCategoryCard}; InvestorTimeline; cinco guías de activos; src/components/ui/DataItem.tsx; README.md; documentación de Tailwind.

### 2026-10-23 - Tailwind: tarjetas de Portfolio y estados de operaciones
- Funcionalidad:
  - Comparte tarjetas completas de análisis con títulos, descripciones y estados mediante `PortfolioPanel`, y sus acciones mediante `PortfolioButton`.
  - Reutiliza `StatusPill` en Portfolio y Operaciones; extiende `DataItem` para estadísticas, movimientos y datos diarios con iconos y detalles semánticos.
- Resumen:
  - Retira 141 líneas de CSS y 25 declaraciones `@apply`. Quedan 13.621 líneas de CSS fuente, un 40,14 % menos frente al inicio.
  - Mantiene los cálculos y formatos, controles nativos, filtros, estados vacíos y almacenamiento en sus módulos originales.
- Archivos:
  - src/pages/PortfolioCsv/ui; PortfolioCsv.tsx; PortfolioCsv.css; src/components/ui/{StatusPill,DataItem}.tsx; Transactions.tsx; Transactions.css; README.md; documentación de Tailwind.

### 2026-10-23 - Tailwind: tarjetas educativas y limpieza de estilos antiguos
- Funcionalidad:
  - Reutiliza tarjetas completas de progreso, enlaces de aprendizaje y accesos a módulos en Fundamentos; comparte sus indicadores con `DataItem`.
  - Comparte listas de ventajas/riesgos/comparativas y explicaciones con rangos de referencia en las cinco guías de activos.
- Resumen:
  - Retira 371 líneas de estilos migrados y 424 de la antigua interfaz de Estrategia y cartera: 795 líneas de CSS y 164 declaraciones `@apply` menos. Quedan 13.762 líneas de CSS fuente, un 39,52 % menos que al inicio.
  - Conserva progreso y persistencia, navegación nativa, modelos y cálculos. La limpieza del simulador retira 84 selectores sin referencias en los módulos actuales.
- Archivos:
  - src/components/academy/ui/{AcademyProgressCard,AcademyLearningLink,AcademyListCard,AcademyExplainerCard}.tsx; src/components/ui/DataItem.tsx; Fundamentos; guías de activos; PortfolioBuilder.css; README.md; documentación de Tailwind.

### 2026-10-22 - Tailwind: piezas compartidas entre módulos
- Funcionalidad:
  - Reutiliza `DataItem`, `DataTable`, `FormField`, `FieldHint` y `PageHeading` entre calculadoras, Planificación, Operaciones, Portfolio, Añadir activo, mapa de calor y gastos.
  - Añade `AcademyStepCard` y `AcademyCallout` con estructura completa para las cinco guías de activos; elimina sus reglas `@apply` migradas.
- Resumen:
  - Conserva los controles nativos, los formatos financieros, las etiquetas y los cálculos de cada pantalla. Los nombres anteriores de las piezas de calculadora delegan en los componentes comunes.
  - Retira 54 declaraciones `@apply` y 190 líneas de CSS fuente: quedan 14.557 frente a las 22.753 iniciales (36,02 % menos). Las reglas de materiales, gráficos y ajustes contextuales permanecen en CSS.
- Archivos:
  - src/components/ui/{DataItem,DataTable,FormField,PageHeading}.tsx; src/components/academy/ui/{AcademyStepCard,AcademyCallout}.tsx; calculadoras; guías de activos; MarketHeatmap; ExpenseManager; ExpenseImportDialog; Planning; Transactions; PortfolioCsv; AddInvestment; documentación de Tailwind.

### 2026-10-22 - Tailwind: componentes de Gestión de gastos
- Funcionalidad:
  - Comparte catorce componentes React para botones, campos, casillas, selectores, paneles, cabeceras, títulos, tarjetas, métricas, rejillas, acciones, progreso y estados vacíos.
  - Aplica la composición a las cinco pestañas, los seis editores y la importación CSV/Excel, manteniendo las etiquetas accesibles y los controles nativos.
- Resumen:
  - El CSS local pasa de 298 a 254 líneas; conserva gráficos, tablas, distribución específica y materiales Liquid Glass. La reducción acumulada de CSS fuente es del 35,19 %.
  - Mantiene el almacenamiento, cálculos en céntimos, presupuestos, recurrentes, deduplicación y categorización de BBVA.
- Archivos:
  - src/components/expenses/ui; ExpenseManager.tsx; ExpenseEditors.tsx; ExpenseImportDialog.tsx; ExpenseManager.css; scripts/test-expense-ui.ts; README.md; docs/tailwind-migration.md; docs/tailwind-module-inventory.md

### 2026-10-22 - Tailwind: Academia y simuladores
- Funcionalidad:
  - Comparte superficies, enlaces de tarjetas, rejillas, secciones, indicadores, campos y previsualizaciones de vídeos mediante siete componentes React con estructura y estilos Tailwind.
  - Aplica la composición a las cinco guías de activos, fundamentos, glosario, recorrido, errores, riesgo, fiscalidad, estrategias, valoración, escenarios, recursos y los cinco simuladores.
- Resumen:
  - Retira 183 líneas de CSS fuente; conserva los materiales Liquid Glass, las adaptaciones por contenedor, gráficos y animaciones específicos.
  - Mantiene los controles nativos, cálculos, almacenamiento, enlaces y gestión de errores de miniaturas en los módulos originales.
- Archivos:
  - src/components/academy/ui; src/components/academy/assets; src/components/academy/guides; src/components/academy/simulators; scripts/test-market-timing-ui.ts; README.md; docs/tailwind-migration.md; docs/tailwind-module-inventory.md

### 2026-10-22 - Tailwind: componentes reutilizables del Dashboard
- Funcionalidad:
  - Comparte indicadores, paneles, selectores, interruptores, filtros, campos de traspaso, métricas ampliadas, filas de corrección y acciones flotantes mediante nueve componentes React con estructura y estilos Tailwind.
  - Aplica la composición al resumen, evolución, Benchmark, asignación, riesgo, controles, tabla de activos y detalles de posiciones/subyacentes.
- Resumen:
  - Reduce el CSS del Dashboard de 1.804 a 1.457 líneas y retira las hojas del resumen y calidad de datos. Conserva los cálculos, consultas, correcciones, operaciones y materiales Liquid Glass.
  - Mantiene las pestañas con su navegación por teclado y añade comprobación de flechas, Inicio/Fin, foco y relación con el panel. Habilita las suites específicas existentes para ejecución aislada.
- Archivos:
  - src/components/dashboard/ui; src/components/dashboard/{AssetDetail,AssetsTable,FundTransferDialog,PortfolioAnalytics,PortfolioBenchmark,PortfolioComposition,PortfolioDataQuality,PortfolioExcelInsights,PortfolioHealth,UnderlyingAssetDetail}.tsx y sus CSS; PortfolioSummary/PortfolioSummary.tsx; src/pages/Dashboard; scripts/run-tests.mjs; scripts/test-dashboard-quality-ui.ts; scripts/test-stock-fundamentals-ui.ts; README.md; docs/tailwind-migration.md; docs/tailwind-module-inventory.md

### 2026-10-22 - Tailwind: bonos, IRPF y ficha de fondos
- Funcionalidad:
  - Compone campos, casillas, paneles, desplegables, resultados destacados, bloques de datos, tarjetas educativas, tablas, distribuciones y documentos mediante componentes React con estructura y estilos Tailwind.
  - Reutiliza once campos y siete bloques de datos en bonos; IRPF comparte los controles y el resultado principal; la ficha de fondos comparte sus secciones, métricas y contenido tabular.
- Resumen:
  - Retira 291 líneas de las tres hojas CSS locales. Conserva los cálculos de bonos y nóminas, las consultas y cancelación de Finect, los formatos, la privacidad y los materiales Liquid Glass. Mantiene CSS local para distribución y elementos específicos.
  - Añade una prueba de ficha de fondos con transporte Finect simulado: clase exacta, datos cero/ausentes, comisiones, histórico, composición, documentos, errores y accesibilidad.
- Archivos:
  - src/components/academy/calculators/{BondCalculator,SalaryCalculator,FundInformationCalculator}.tsx y .css; CalculatorField.tsx; CalculatorPanel.tsx; CalculatorCheckbox.tsx; CalculatorDisclosure.tsx; CalculatorSection.tsx; CalculatorDataItem.tsx; CalculatorEducationCard.tsx; CalculatorHeroMetric.tsx; CalculatorTable.tsx; CalculatorAllocationCard.tsx; CalculatorDocumentLink.tsx; scripts/test-fund-information-ui.ts; scripts/run-tests.mjs; package.json; README.md; docs/tailwind-migration.md; docs/tailwind-module-inventory.md

### 2026-10-22 - Tailwind: composición reutilizable de calculadoras
- Funcionalidad:
  - Reutiliza `CalculatorField` en 19 campos de interés compuesto, FIRE y jubilación.
  - Añade `CalculatorResultCard` con estructura y estilos Tailwind compartidos para nueve tarjetas de resultados, con variantes de inversión, centrada y con icono.
- Resumen:
  - Retira 26 reglas locales de presentación de resultados. Mantiene fórmulas, controles nativos, escenarios guardados, rutas y superficies Liquid Glass; los estilos de disposición y gráficos permanecen en cada herramienta.
- Archivos:
  - src/components/academy/calculators/CalculatorResultCard.tsx; CompoundInterestCalc.tsx y .css; FIRECalculator.tsx y .css; RetirementCalculator.tsx y .css; README.md; docs/tailwind-migration.md; docs/tailwind-module-inventory.md

### 2026-10-21 - Tailwind: catálogo y primeras calculadoras
- Funcionalidad:
  - Migra catálogo, fondo de emergencia, impacto fiscal e inflación a componentes y recetas Tailwind.
  - Reutiliza `CalculatorTile` en las ocho herramientas, `CalculatorPanel` en las superficies, `CalculatorMetric` en los resultados y `CalculatorField` en doce campos con sus controles nativos.
- Resumen:
  - Retira tres hojas CSS y reduce la de inflación a su animación. Conserva cálculos, controles, datos locales, orden y rutas. Asocia las etiquetas fiscales a los campos y nombra su deslizador. Añade verificación de métricas fiscales, navegación y persistencia a la suite existente, y permite enfocar la auditoría de producción por rutas.
- Archivos:
  - src/components/academy/calculators/Calculators.tsx, EmergencyFundCalculator.tsx, TaxSimulator.tsx, InflationPredator.tsx, InflationPredator.css, CalculatorPanel.tsx, CalculatorTile.tsx, CalculatorField.tsx, calculatorCatalogStyles.ts, emergencyStyles.ts, taxSimulatorStyles.ts, inflationStyles.ts; scripts/test-calculator-dashboard-usability.ts; scripts/test-tailwind-modules-ui.ts; docs/tailwind-migration.md; docs/tailwind-module-inventory.md; README.md

### 2026-10-21 - Tailwind: componentes de detalle y avisos compartidos
- Funcionalidad:
  - Añade `DefinitionList` para compartir las filas de datos entre escenarios de calculadoras y detalles del plan de cartera.
  - Migra a utilidades React los rankings, la ayuda del Dashboard y los avisos de conexión, cartera local, gastos pendientes y nueva versión.
- Resumen:
  - Retira siete CSS de componentes y cuatro reglas repetidas del plan. Reutiliza `ActionGroup` en el aviso de versión y conserva los selectores de comportamiento, semántica, formatos, ordenación y operaciones existentes.
- Archivos:
  - src/components/ui/DefinitionList.tsx, src/components/ui, src/components/dashboard/Performers.tsx, src/components/dashboard/performerStyles.ts, src/components/dashboard/DashboardInfo.tsx, src/components/dashboard/LivePortfolioPlan.tsx, src/components/dashboard/LivePortfolioPlan.css, src/components/academy/calculators/ScenarioComparison.tsx, scripts/run-tests.mjs, scripts/test-calculator-dashboard-usability.ts, docs/tailwind-migration.md, docs/tailwind-module-inventory.md, README.md

### 2026-10-21 - Tailwind: Academia, herramientas, Dashboard y módulos restantes
- Funcionalidad:
  - Incorpora guías, activos, calculadoras, simuladores, gastos, Dashboard, gráficos, navegación, formularios y páginas auxiliares a los tokens y patrones compartidos de Tailwind.
  - Las hojas de módulos densos usan `@apply` y `@reference`, conservando sus selectores y su cascada. Reutiliza las superficies de calculadora y migra a utilidades React los avisos, estados de ruta y pantalla 404.
- Resumen:
  - Comparte 9.964 declaraciones en 64 hojas y retira otros cuatro CSS. Mantiene unidades, temas, Liquid Glass, cálculos y datos. Añade un recorrido de 41 rutas sobre la compilación de producción y separa las comprobaciones de CI, conservando `verify` como resultado conjunto. Incluye inventario y guía de mantenimiento.
- Archivos:
  - src/styles, src/components/academy, src/components/dashboard, src/components/charts, src/components/expenses, src/components/layout, src/components/ui, src/components/news/RichTextEditor, src/pages, scripts/helpers/compileModuleStyles.ts, scripts/test-tailwind-modules-ui.ts, scripts/run-tests.mjs, scripts/test-assets-table.ts, scripts/test-fund-breakdown-layout.ts, vite.config.ts, .github/workflows/quality.yml, docs/tailwind-migration.md, docs/tailwind-module-inventory.md, README.md

### 2026-10-21 - Tailwind: Noticias y radar de fondos
- Funcionalidad:
  - Migra la portada de Noticias, los artículos, comentarios y respuestas, y el panel editorial a las utilidades de Tailwind y los componentes compartidos.
  - Migra las tarjetas, filtros y formulario de edición del radar de fondos, conservando los temas y Liquid Glass.
- Resumen:
  - Retira tres CSS sustituidos y reduce el del radar al medidor nativo. Mantiene CSS específico para el contenido enriquecido y el editor Tiptap. Comprueba también el espaciado de acceso editorial, las alturas táctiles, las portadas 16:9 y la jerarquía de las métricas. Conserva permisos, comentarios, cálculos y datos; no requiere cambios de base de datos ni de batches.
- Archivos:
  - src/pages/News/News.tsx, src/pages/NewsAdmin/NewsAdmin.tsx, src/components/news, src/components/academy/simulators/FundRadar.tsx, src/components/academy/simulators/FundRadarEditor.tsx, src/components/academy/simulators/radarStyles.ts, src/components/academy/simulators/FundRadar.css, scripts/test-news-layout-comments-ui.ts, scripts/test-fund-radar-ui.ts, scripts/run-tests.mjs, docs/tailwind-migration.md, README.md

### 2026-10-21 - Tailwind: base compartida y Mi cuenta
- Funcionalidad:
  - Integra Tailwind CSS 4 con los colores y temas actuales, incluido Liquid Glass, para migrar la interfaz por módulos.
  - Migra botones, tarjetas, campos, métricas, cabeceras y modales a una base reutilizable; añade un grupo de acciones con disposición móvil.
  - Mi cuenta reutiliza esa base en acceso, registro, recuperación, perfil, sincronización y autenticador. Mejora la asociación accesible de ayudas y errores y la visibilidad del indicador de carga.
- Resumen:
  - Primera fase de la migración: retira siete archivos CSS sustituidos y conserva los estilos de las pantallas pendientes. Incluye capturas de comparación, pruebas de teclado y comprobaciones de móvil/escritorio en las cuatro combinaciones de tema y apariencia. Actualiza Vite a 7.3.7 tras revisar la auditoría de dependencias. No requiere migraciones de Supabase ni cambios en los batches.
- Archivos:
  - docs/tailwind-migration.md, README.md, package.json, package-lock.json, vite.config.ts, src/styles/tailwind.css, src/utils/cn.ts, src/index.css, src/App.tsx, src/components/ui, src/pages/Account, src/pages/AddInvestment/AddInvestment.tsx, src/components/dashboard/AssetDetail.css, scripts/fixtures/FoundationGallery.tsx, scripts/test-tailwind-foundation-ui.ts, scripts/run-tests.mjs

### 2026-10-18 - v7.0.1 - Fondos: vuelve a mostrar históricos
- Funcionalidad:
  - Fondos: vuelve a mostrar el histórico de Robeco y otros fondos cuando Financial Times redirige la ficha para indicar la divisa de la clase.
  - Fondos: comprueba el ISIN, la clase, la serie y su moneda antes de mostrar los precios.
- Resumen:
  - Corrige la redirección de Financial Times que dejaba el gráfico sin histórico y añade pruebas para distintas clases y monedas. La configuración de Vercel se aplica al desplegar; no cambia la base de datos ni los movimientos.
- Archivos:
  - vercel.json, vite.config.ts, scripts/test-fund-history-proxy.ts, scripts/test-fund-chart-ui.ts, scripts/run-tests.mjs, docs/fund-history.md, FEATURE_LOG.md

### 2026-10-17 - v7.0.0 - Seguridad, cotizaciones y rendimiento
- Funcionalidad:
  - Noticias: protege la lectura y edición de artículos frente a HTML malicioso, incluido contenido anidado o malformado, conservando los formatos admitidos del editor.
  - Cartera: el navegador y el batch usan el mismo mercado seleccionado y verificado para cada acción; conservan el instrumento original de las operaciones y la procedencia de cada cotización.
  - Cartera: al cambiar de mercado, descarta respuestas del anterior y admite la última observación del elegido aunque tenga una hora anterior; mantiene la protección contra precios atrasados dentro de un mismo mercado.
  - Gastos: mantiene el aviso de cambios sin guardar al navegar, permite volver para reintentar o exportar y evita cerrar la sesión de cuenta o editorial mientras haya guardados pendientes.
  - Navegación: carga las pantallas cuando se necesitan, muestra un indicador de carga y permite recuperarse de errores sin perder la navegación; evita recargas automáticas si quedan cambios pendientes.
  - Calidad: incorpora controles automatizados de lógica, base de datos, navegador, compilación, dependencias e integración de hotfixes antes de promover dev o release.
  - SEO: corrige el dominio de producción, permite configurarlo por entorno y excluye de la indexación las vistas previas y preproducción.
- Resumen:
  - Incluye mejoras de seguridad en Noticias, coherencia en las cotizaciones de Cartera y navegación más ágil. El backend de cotizaciones ya está aplicado en Supabase; los históricos conservan su mercado real y no se reconstruyen ni se reetiquetan.
  - Reduce el archivo JavaScript principal de 1.807,92 a 618,32 kB (aproximadamente un 66 %). Actualiza DOMPurify y source-map-js; la auditoría completa de dependencias no detecta vulnerabilidades conocidas.
  - En GitHub Actions pasaron lint, TypeScript, compilación, 63 comprobaciones de lógica/base de datos, el control del bundle, 10 suites de navegador y auditoría de dependencias. La protección de ramas todavía no exige este workflow.
  - La protección nativa de contraseñas filtradas queda pendiente: requiere Supabase Pro y el proyecto usa Free. No se modifica el plan. Los históricos de cotizaciones anteriores conservan su mercado real y no se reconstruyen ni se reetiquetan.
- Archivos:
  - FEATURE_LOG.md, docs/application-audit-fixes.md, .github/workflows/quality.yml, package-lock.json, scripts/run-tests.mjs, scripts/test-application-audit-ui.ts, scripts/test-unified-quote-markets.ts, scripts/test-quote-market-switch.ts, scripts/test-seo.mjs
  - src/utils/newsContent.ts, src/services/pendingChanges.ts, src/services/portfolioQuoteService.ts, src/services/portfolioCloudStorage.ts, src/services/dashboardIntegrity.ts, src/components/ui/PendingChangesGuard.tsx, src/components/ui/RouteView.tsx, src/App.tsx, src/app/routes/academyRoutes.tsx
  - supabase/functions/_shared/stockListings.ts, supabase/functions/_shared/googleFinanceQuote.ts, supabase/functions/daily-market-data/providers.ts, supabase/migrations/20261017174622_unified_quote_markets.sql

### 2026-10-17 - v6.5.1 - Fondos, traspasos y gestión del riesgo
- Funcionalidad:
  - Radar de fondos: destaca la rentabilidad a tres años, reúne métricas de riesgo y asigna notas de 0 a 100 para comparar fondos de la misma categoría; indica cuándo hay pocos datos para que la comparación sea orientativa.
  - Dashboard: permite elegir un fondo existente o dar de alta uno nuevo por ISIN, buscando sus datos en Finect o introduciéndolos manualmente.
  - Dashboard: completa el alta y el traspaso en una sola operación, conserva el coste y la fecha de compra originales y evita duplicar la compra en el fondo de destino.
  - Dashboard: recupera el historial disponible de los fondos e indica si los datos proceden de Financial Times o Yahoo.
  - Cartera: incorpora un procedimiento de soporte auditable para revisar correcciones de traspasos confirmados.
  - Academia: renueva la guía Gestión del riesgo con secciones numeradas, navegación clara y pautas prácticas basadas en horizontes temporales, sin promesas de rentabilidad.
- Resumen:
  - Facilita comparar fondos, consultar sus históricos y completar traspasos sin duplicar movimientos; también ayuda a entender los principales riesgos y cómo diversificar. Incluye un procedimiento auditable para correcciones confirmadas.
- Archivos:
  - FEATURE_LOG.md, README.md, docs/fund-radar.md, package-lock.json, package.json, scripts/test-category-score.ts, scripts/test-fund-radar-ui.ts, scripts/test-fund-radar.ts, scripts/test-fund-transfer-ui.ts, scripts/test-fund-transfer.ts, src/components/academy/simulators/FundRadar.css, src/components/academy/simulators/FundRadar.tsx, src/components/dashboard/FundTransferDialog.css, src/components/dashboard/FundTransferDialog.tsx, src/constants/app.ts, src/context/PortfolioContext.tsx, src/pages/Dashboard/Dashboard.tsx, src/services/fundTransfer.ts, src/services/funds/categoryScore.ts, src/services/funds/fundScoring.ts, src/services/portfolioPerformance.ts, supabase/migrations/20261016123119_portfolio_fund_transfer_execution_prices.sql, supabase/migrations/20261016123134_portfolio_new_fund_transfer_destination.sql, docs/fund-transfer-repair.md, scripts/ops/repair-confirmed-fund-transfer.sql, scripts/test-transfer-repair.ts, supabase/migrations/20261017122443_portfolio_support_repair_audit.sql, docs/fund-history.md, scripts/fixtures/fund-history/robeco-ft.json, scripts/fixtures/fund-history/robeco-yahoo-quote-only.json, scripts/test-fund-chart-ui.ts, scripts/test-fund-history.ts, src/components/dashboard/AssetDetail.tsx, src/services/apiService.ts, src/services/funds/fundHistory.ts, src/types/api.ts, supabase/functions/_shared/financialTimesHistory.ts, supabase/functions/daily-market-data/financialTimesFund.ts, vercel.json, vite.config.ts, src/components/academy/guides/RiskManagement.tsx, src/components/academy/guides/RiskManagement.css
### 2026-10-16 - v6.5.0 - Academia y radar de fondos
- Funcionalidad:
  - Academia: las guías de inversión se recorren por secciones y sus tarjetas se distinguen mejor, también con la apariencia translúcida.
  - Academia: la guía de estrategias compara opciones y muestra visualmente cómo se rebalancea una cartera.
  - Academia: el simulador de crisis está renovado y deja de mostrar resultados de DCA que no se apoyaban en datos fiables.
  - Academia: los recursos incluyen miniaturas de vídeo y la guía fiscal enlaza con las calculadoras de sueldo e IRPF.
  - Academia: el radar de fondos reúne un catálogo revisado, consulta datos de Finect y permite que los editores mantengan la información al día.
  - Cartera: después de importar un archivo, aparece un aviso para continuar en Dashboard.
- Resumen:
  - Reúne mejoras de las guías, simuladores y recursos de Academia, además de un radar de fondos actualizado y una importación de cartera más clara.
- Archivos:
  - `FEATURE_LOG.md`, `README.md`, `docs/fund-radar.md`, `package-lock.json`, `package.json`, `scripts/test-crisis-impact.ts`, `scripts/test-fund-radar-db.ts`, `scripts/test-fund-radar-ui.ts`, `scripts/test-fund-radar.ts`, `src/components/academy/assets/AssetBonds.tsx`, `src/components/academy/assets/AssetCash.tsx`, `src/components/academy/assets/AssetCrypto.tsx`, `src/components/academy/assets/AssetEquities.tsx`, `src/components/academy/assets/AssetGuideNav.tsx`, `src/components/academy/assets/AssetPage.css`, `src/components/academy/assets/AssetREITs.tsx`, `src/components/academy/guides/InProcess.css`, `src/components/academy/guides/InProcess.tsx`, `src/components/academy/guides/Strategies.css`, `src/components/academy/guides/Strategies.tsx`, `src/components/academy/guides/Taxation.css`, `src/components/academy/guides/Taxation.tsx`, `src/components/academy/simulators/CrisisSimulator.css`, `src/components/academy/simulators/CrisisSimulator.tsx`, `src/components/academy/simulators/FundRadar.css`, `src/components/academy/simulators/FundRadar.tsx`, `src/components/academy/simulators/FundRadarEditor.tsx`, `src/components/academy/simulators/PortfolioBuilder.css`, `src/components/academy/simulators/PortfolioBuilder.tsx`, `src/components/academy/simulators/crisisImpact.ts`, `src/constants/app.ts`, `src/pages/PortfolioCsv/PortfolioCsv.css`, `src/pages/PortfolioCsv/PortfolioCsv.tsx`, `src/services/fundRadar/catalog.ts`, `src/services/fundRadar/types.ts`, `src/services/funds/fundScoring.ts`, `src/styles/liquidGlass.css`, `supabase/functions/fund-radar-refresh/finect.ts`, `supabase/functions/fund-radar-refresh/handler.ts`, `supabase/functions/fund-radar-refresh/index.ts`, `supabase/migrations/20261016102051_fund_radar_editorial_catalog.sql`, `supabase/migrations/20261016102447_fund_radar_worker_schema_access.sql`, `supabase/migrations/20261016103234_fund_radar_public_catalog_access.sql`


### 2026-10-15 - v6.4.0 - Cuenta y comentarios en Noticias
- Funcionalidad:
  - Cuenta: puedes elegir un nombre de usuario único e iniciar sesión con ese nombre o con tu correo.
  - Noticias: puedes comentar y responder con textos de hasta 10.000 caracteres, editar o borrar tus comentarios y ver las portadas completas.
  - Noticias: los editores pueden importar portadas desde enlaces compartidos de Google Fotos.
  - Academia: puedes explorar modelos de cartera, comparar hasta tres, cambiar sus pesos y simular escenarios con hipótesis editables; los cambios se guardan en tu navegador.
- Resumen:
  - Facilita gestionar tu cuenta, participar en Noticias y explorar distintas formas de organizar una cartera.
- Archivos:
  - `docs/account-usernames.md`, `docs/news-comments.md`, `FEATURE_LOG.md`, `package-lock.json`, `package.json`, `README.md`, `scripts/test-account-feedback.ts`, `scripts/test-account-usernames-ui.ts`, `scripts/test-account-usernames.ts`, `scripts/test-mfa-disable-ui.ts`, `scripts/test-news-article-editor-ui.ts`, `scripts/test-news-comments.ts`, `scripts/test-news-images.ts`, `scripts/test-news-layout-comments-ui.ts`, `src/components/news/NewsComments.css`, `src/components/news/NewsComments.tsx`, `src/components/news/NewsCoverField.tsx`, `src/components/news/RichTextEditor/RichTextEditor.css`, `src/constants/app.ts`, `src/hooks/useNewsCommentIdentity.ts`, `src/pages/Account/Account.css`, `src/pages/Account/Account.tsx`, `src/pages/Account/AccountIdentity.tsx`, `src/pages/News/News.css`, `src/pages/News/News.tsx`, `src/pages/NewsAdmin/NewsAdmin.css`, `src/pages/NewsAdmin/NewsAdmin.tsx`, `src/services/accountProfile.ts`, `src/services/newsComments.ts`, `src/services/newsImages.ts`, `src/services/newsService.ts`, `supabase/functions/import-news-image/deno.json`, `supabase/functions/import-news-image/handler.ts`, `supabase/functions/import-news-image/index.ts`, `supabase/functions/username-login/deno.json`, `supabase/functions/username-login/handler.ts`, `supabase/functions/username-login/index.ts`, `supabase/migrations/20261015115626_account_usernames.sql`, `supabase/migrations/20261015131909_news_comments.sql`, `supabase/migrations/20261015140450_news_comment_replies.sql`, `supabase/migrations/20261015145327_news_comment_length.sql`, `docs/strategy-portfolio.md`, `scripts/test-strategy-portfolio-ui.ts`, `scripts/test-strategy-portfolio.ts`, `src/components/academy/simulators/AssetAllocationSim.css`, `src/components/academy/simulators/AssetAllocationSim.tsx`, `src/components/academy/simulators/PortfolioBuilder.css`, `src/components/academy/simulators/PortfolioBuilder.tsx`, `src/data/academy/portfolioModels.ts`, `src/utils/strategyPortfolio.ts`

### 2026-10-15 - v6.3.3 - Dashboard más claro
- Funcionalidad:
  - Dashboard: resume los avisos sobre datos y cotizaciones para que ocupen menos espacio; puedes abrir la ayuda cuando necesites más detalles.
  - Dashboard: muestra el motivo de los resultados no disponibles al abrir su explicación.
  - Cuenta: permite quitar el autenticador después de confirmar la operación con su código actual.
- Resumen:
  - El Dashboard queda más despejado y conserva a mano las explicaciones sobre precios, datos y resultados.
  - También puedes quitar el autenticador de la cuenta cuando tengas acceso a su código de verificación.
- Archivos:
  - `FEATURE_LOG.md`, `package.json`, `package-lock.json`, `src/constants/app.ts`, `scripts/test-dashboard-quality-ui.ts`, `scripts/test-dashboard-results-ui.ts`, `scripts/test-portfolio-periods-ui.ts`, `scripts/test-ytd-verification-ui.ts`, `src/components/dashboard/DashboardInfo.css`, `src/components/dashboard/DashboardInfo.tsx`, `src/components/dashboard/PortfolioDataQuality.css`, `src/components/dashboard/PortfolioDataQuality.tsx`, `src/components/dashboard/PortfolioExcelInsights.css`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/pages/Dashboard/Dashboard.css`, `src/pages/Dashboard/Dashboard.tsx`, `scripts/test-mfa-disable-ui.ts`, `scripts/test-mfa-management.ts`, `src/pages/Account/AccountMfa.tsx`, `src/services/mfaManagement.ts`.

### 2026-10-14 - v6.3.2 - Gastos, análisis de cartera y calculadora de bonos
- Funcionalidad:
  - Ancla el calendario de cupones al vencimiento, conserva fin de mes y permite definir periodos iniciales y finales irregulares.
  - Distingue precios limpios y sucios, e incorpora Actual/365 fijo, Actual/360, 30E/360 y 30/360 US.
  - Calcula TIR nominal y efectiva con un solver que verifica la convergencia y el error de precio.
  - Añade ayuda contextual al importador y aclara columnas obligatorias, duplicados y vista previa.
  - Refina las sugerencias BBVA: separa Ropa de Compras, clasifica comida rápida como Ocio y añade Ropa a libros existentes.
  - Registra traspasos parciales o completos entre fondos, estima las participaciones con las últimas valoraciones y conserva tanto el coste de adquisición como el precio de ejecución del fondo de destino.
  - Conserva las valoraciones guardadas por lotes con consultas de fondos cacheadas, sin usar esas consultas para crear nuevas valoraciones en vivo.
  - Guarda la membresía exacta de movimientos en cada snapshot y en sus reparaciones para no recuperar operaciones retiradas; muestra el último NAV real del benchmark y calcula diferencias solo en fechas comunes.
- Resumen:
  - Corrige fechas de pago, descuentos entre cupones, escala por nominal y flujos de cupones irregulares. Separa el motor financiero de la interfaz y documenta el modelo y sus límites.
  - Facilita revisar importaciones, mejora la categorización sin reemplazar las categorías personalizadas, mantiene snapshots fieles al ledger vigente, extiende el benchmark a su último NAV real y respeta las fechas comparables y la fecha original de las valoraciones guardadas por lotes.
- Archivos:
  - `FEATURE_LOG.md`, `docs/bond-calculator-audit.md`, `scripts/fixtures/coreweave-bond-reference.json`, `scripts/test-bond-calculator.ts`, `scripts/test-bond-calculator-ui.ts`, `scripts/verify-coreweave-bond.py`, `src/components/academy/calculators/BondCalculator.css`, `src/components/academy/calculators/BondCalculator.tsx`, `src/services/bondCalculator.ts`, `src/constants/app.ts`, `src/components/expenses/ExpenseImportDialog.tsx`, `src/components/expenses/ExpenseManager.css`, `src/components/expenses/ExpenseManager.tsx`, `src/services/expenseImport.ts`, `src/services/expensePlanner.ts`, `src/services/expenseStore.ts`, `src/components/dashboard/AssetsTable.tsx`, `src/components/dashboard/FundTransferDialog.css`, `src/components/dashboard/FundTransferDialog.tsx`, `src/components/dashboard/LivePortfolioPlan.tsx`, `src/context/PortfolioContext.tsx`, `src/pages/Dashboard/Dashboard.tsx`, `src/pages/Transactions/Transactions.css`, `src/pages/Transactions/Transactions.tsx`, `src/services/portfolioHistoryArchive.ts`, `src/services/portfolioPerformance.ts`, `src/services/portfolioResults.ts`, `src/services/portfolioTradeReplay.ts`, `src/services/portfolioWorkbookHistory.ts`, `src/types/portfolio.ts`, `scripts/test-batch-history.ts`, `src/services/dailyMarketData.ts`, `supabase/migrations/20261014192131_portfolio_fund_transfer_execution_prices.sql`, `scripts/test-architecture-hardening.ts`, `scripts/test-batch-benchmark-ui.ts`, `scripts/test-benchmark-comparison.ts`, `scripts/test-market-refresh-cadence.ts`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/services/benchmarkComparison.ts`, `supabase/migrations/20261014194446_snapshot_ledger_membership.sql`.


### 2026-10-14 - v6.3.1 - Importación y gestión de movimientos del planificador
- Funcionalidad:
  - Importa extractos BBVA desde Excel y sugiere categorías para movimientos reconocibles.
  - Permite borrar todos los movimientos con confirmación; conserva cuentas, categorías, presupuestos y reglas recurrentes.
- Resumen:
  - Agiliza la importación de gastos, permite empezar de nuevo sin perder la configuración del libro y reduce los errores de base de datos registrados por conflictos normales de sincronización.
- Archivos:
  - `FEATURE_LOG.md`, `package.json`, `package-lock.json`, `src/components/expenses/ExpenseImportDialog.tsx`, `src/components/expenses/ExpenseManager.css`, `src/components/expenses/ExpenseManager.tsx`, `src/services/expenseImport.ts`, `src/services/expenseWorkbook.ts`, `src/constants/app.ts`, `src/services/portfolioRepository.ts`, `supabase/migrations/20261014190000_expected_portfolio_conflicts.sql`.

### 2026-10-09 - v6.3.0 - Planificador de gastos y presupuesto
- Funcionalidad:
  - Añade un libro de gastos independiente de las inversiones, con cuentas, movimientos, importación CSV, presupuestos, recurrencias y objetivos.
  - Ofrece almacenamiento local o sincronización privada por cuenta; la carga remota usa RPC autenticadas y control de revisiones.
  - Incorpora adaptación Liquid Glass con soporte para temas y preferencias de movimiento y transparencia.
- Resumen:
  - Permite registrar ingresos y gastos, planificar presupuestos y guardar el libro privado en Supabase sin conectar con bancos ni mover dinero.
- Archivos:
  - `.gitignore`, `README.md`, `docs/expense-planner.md`, `FEATURE_LOG.md`, `package.json`, `package-lock.json`, `scripts/test-expense-backend.ts`, `scripts/test-expense-planner.ts`, `scripts/test-expense-sync.ts`, `scripts/test-expense-ui.ts`, `src/app/routes/academyRoutes.tsx`, `src/components/expenses/ExpenseEditors.tsx`, `src/components/expenses/ExpenseImportDialog.tsx`, `src/components/expenses/ExpenseManager.css`, `src/components/expenses/ExpenseManager.tsx`, `src/components/expenses/useExpenseBook.ts`, `src/context/AccountContext.tsx`, `src/context/AppearanceContext.tsx`, `src/services/expenseImport.ts`, `src/services/expensePlanner.ts`, `src/services/expenseRepository.ts`, `src/services/expenseStore.ts`, `src/types/expenses.ts`, `supabase/migrations/20261009000900_expense_books.sql`.


### 2026-10-09 - v6.2.0 - Asignación de cartera, cuentas remuneradas y resultados estimados
- Funcionalidad:
  - Desglosa fondos y ETF por exposición económica, con un interruptor compartido entre Asignación y Benchmark; permite fijar categorías manuales y sincroniza las preferencias de cartera.
  - Añade una TAE opcional y editable a las cuentas de liquidez, visible en el detalle. El saldo solo cambia al registrar intereses abonados.
  - Identifica como estimados los resultados realizados y totales que incluyen operaciones reconstruidas autorizadas.
- Resumen:
  - Amplía el análisis de la cartera y el registro de cuentas de liquidez, y señala claramente cuándo los resultados incluyen operaciones estimadas.
- Archivos:
  - `README.md`, `docs/portfolio-history.md`, `package.json`, `package-lock.json`, `scripts/test-cash-account-ui.ts`, `scripts/test-dashboard-results.ts`, `scripts/test-portfolio-blocks-ui.ts`, `scripts/test-portfolio-blocks.ts`, `scripts/test-portfolio-sync.ts`, `scripts/test-ytd-verification-ui.ts`, `src/app/routes/academyRoutes.tsx`, `src/components/academy/calculators/Calculators.tsx`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/PortfolioExcelInsights.css`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/constants/app.ts`, `src/pages/AddInvestment/AddInvestment.tsx`, `src/services/portfolioBenchmark.ts`, `src/services/portfolioBlocks.ts`, `src/services/portfolioCloudStorage.ts`, `src/services/portfolioPositionGroups.ts`, `src/services/portfolioResults.ts`, `src/services/storageService.ts`, `src/types/asset.ts`, `src/types/portfolio.ts`, `FEATURE_LOG.md`.


### 2026-10-08 - v6.1.6 - NAV de fondos actualizado y benchmark con fechas explícitas
- Funcionalidad:
  - Conserva en el gráfico el último extremo verificado de la cartera aunque el NAV del benchmark aún no esté disponible para esa fecha, sin arrastrar cotizaciones anteriores.
  - Añade Financial Times como fuente diaria de NAV para fondos, validando el ISIN y la clase antes de aceptar la observación.
  - Mejora las diferencias de benchmark por fecha y agiliza el análisis del dashboard.
  - En el tooltip muestra el último retorno disponible del benchmark con su fecha cuando la cartera termina después del NAV; mantiene los cálculos basados en observaciones reales, sin crear puntos sintéticos.
- Resumen:
  - Muestra el rendimiento de cartera hasta la última fecha confirmada, informa la fecha del último NAV disponible y añade una fuente fresca para NAV de fondos.
- Archivos:
  - `README.md`, `docs/daily-market-data.md`, `docs/portfolio-history.md`, `package.json`, `package-lock.json`, `scripts/test-architecture-hardening.ts`, `scripts/test-benchmark-comparison.ts`, `scripts/test-dashboard-quality.ts`, `scripts/test-financial-times-funds.ts`, `scripts/test-history-archive.ts`, `scripts/test-structured-history-ui.ts`, `scripts/test-ytd-verification-ui.ts`, `src/components/dashboard/PortfolioExcelInsights.css`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/useDashboardAnalytics.ts`, `src/constants/app.ts`, `src/services/benchmarkComparison.ts`, `src/services/portfolioBenchmark.ts`, `src/services/dashboardMarketHistory.ts`, `src/services/portfolioCalendar.ts`, `src/services/portfolioPerformance.ts`, `supabase/functions/_shared/fundQuotePolicy.ts`, `supabase/functions/daily-market-data/financialTimesFund.ts`, `supabase/functions/daily-market-data/fundSources.ts`, `supabase/functions/daily-market-data/index.ts`, `supabase/functions/daily-market-data/providers.ts`, `supabase/migrations/20261008205147_financial_times_fund_source.sql`, `FEATURE_LOG.md`.
  
### 2026-10-08 - v6.1.5 - Historial estructurado e integridad del benchmark
- Funcionalidad:
  - Desacopla el histórico del dashboard de la importación de hojas de cálculo y conserva observaciones estructuradas de valoraciones, flujos y benchmark.
  - Mantiene los periodos de benchmark verificados cuando hay movimientos recientes sin reconciliar y corrige la interpretación de registros eliminados.
  - Normaliza las claves temporales del histórico para que las correcciones sustituyan el evento equivalente.
- Resumen:
  - Preserva la evolución histórica de la cartera y evita presentar como verificados los tramos de benchmark que aún requieren conciliación.
- Archivos:
  - `README.md`, `docs/daily-market-data.md`, `docs/portfolio-history.md`, `docs/portfolio-supabase.md`, `package.json`, `package-lock.json`, `scripts/test-benchmark-comparison.ts`, `scripts/test-dashboard-results.ts`, `scripts/test-history-archive.ts`, `scripts/test-portfolio-periods-ui.ts`, `scripts/test-portfolio-periods.ts`, `scripts/test-portfolio-sync.ts`, `scripts/test-structured-history-backend.ts`, `scripts/test-structured-history-ui.ts`, `scripts/test-ytd-verification-ui.ts`, `src/components/dashboard/AssetsTable.tsx`, `src/components/dashboard/LivePortfolioPlan.tsx`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.css`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/components/dashboard/useDashboardAnalytics.ts`, `src/context/PortfolioContext.tsx`, `src/hooks/usePortfolioHistoryArchive.ts`, `src/pages/Dashboard/Dashboard.tsx`, `src/pages/PortfolioCsv/PortfolioCsv.tsx`, `src/pages/PortfolioCsv/portfolioCsvConstants.ts`, `src/pages/PortfolioCsv/portfolioCsvTypes.ts`, `src/pages/PortfolioCsv/portfolioCsvUtils.ts`, `src/services/dashboardHistory.ts`, `src/services/deletedRecordCorrections.ts`, `src/services/imports/portfolioCsvConstants.ts`, `src/services/imports/portfolioCsvTypes.ts`, `src/services/imports/portfolioCsvUtils.ts`, `src/services/imports/portfolioHistoryImport.ts`, `src/services/portfolioCloudStorage.ts`, `src/services/portfolioHistoryArchive.ts`, `src/services/portfolioPerformance.ts`, `src/services/portfolioResults.ts`, `src/services/portfolioWorkbookHistory.ts`, `src/services/storageService.ts`, `src/types/portfolio.ts`, `supabase/migrations/20261008175018_portfolio_structured_history.sql`, `supabase/migrations/20261008175952_portfolio_history_event_dates.sql`, `src/constants/app.ts`, `FEATURE_LOG.md`.
  
### 2026-10-08 - v6.1.4 - YTD verificado con movimientos pendientes
- Funcionalidad:
  - Conserva el último resultado YTD calculable cuando un movimiento reciente impide verificar el tramo más nuevo.
  - Muestra hasta qué fecha llega el cálculo tanto en el resumen como en la comparación con benchmark y señala desde cuándo hay datos pendientes.
  - Excluye del gráfico el tramo no verificado; no presenta una eliminación como una venta ni cambia el libro de operaciones.
- Resumen:
  - Mantiene visible la rentabilidad YTD respaldada por datos y comunica claramente el periodo aún pendiente de reconciliar.
- Archivos:
  - `README.md`, `package.json`, `package-lock.json`, `scripts/test-portfolio-periods.ts`, `scripts/test-ytd-verification-ui.ts`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/constants/app.ts`, `src/pages/Dashboard/Dashboard.tsx`, `src/services/portfolioPerformance.ts`, `src/types/portfolio.ts`.
  
### 2026-10-08 - v6.1.3 - Agrupación fija y compras por lote
- Funcionalidad:
  - Agrupa siempre en «Mis Activos» las posiciones del mismo instrumento y muestra el detalle de compras con fecha, cantidad, precio medio y coste.
  - Conserva cada registro para operar sobre lotes individuales; la agrupación sigue siendo una vista y no modifica la cartera guardada.
  - Retira el selector que permitía desactivar la agrupación.
- Resumen:
  - Simplifica la vista de cartera y expone la composición de cada posición agrupada con el historial de compras.
- Archivos:
  - `README.md`, `package.json`, `package-lock.json`, `scripts/test-dashboard-edit-return-ui.ts`, `scripts/test-position-groups-ui.ts`, `src/components/dashboard/AssetDetail.css`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/AssetsTable.css`, `src/components/dashboard/AssetsTable.tsx`, `src/constants/app.ts`.
  
### 2026-10-08 - v6.1.2 - Agrupación de posiciones y retorno al dashboard
- Funcionalidad:
  - Agrupa por defecto las posiciones del mismo instrumento, muestra cantidades y valores agregados y conserva el desglose para operar sobre cada lote individual. La agrupación es solo una vista y no reescribe la cartera.
  - Mantiene el estado previo del dashboard al cancelar o volver desde una edición, compra o venta, incluidos scroll, filtros, orden, periodo y lotes expandidos.
- Resumen:
  - Simplifica la consulta de carteras con compras repetidas y evita perder el contexto de navegación al descartar cambios.
- Archivos:
  - `README.md`, `package.json`, `package-lock.json`, `scripts/test-dashboard-edit-return-ui.ts`, `scripts/test-position-groups-ui.ts`, `scripts/test-position-groups.ts`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/AssetsTable.css`, `src/components/dashboard/AssetsTable.tsx`, `src/components/layout/MainLayout/MainLayout.tsx`, `src/components/layout/MainLayout/dashboardNavigation.ts`, `src/pages/AddInvestment/AddInvestment.tsx`, `src/pages/Dashboard/Dashboard.tsx`, `src/services/portfolioPositionGroups.ts`.
  
### 2026-10-08 - v6.1.1 - Cotizaciones en vivo y ajustes del dashboard
- Funcionalidad:
  - Actualiza las cotizaciones de acciones y cripto cada minuto y añade proveedores alternativos verificados para mantener datos disponibles.
  - Mejora la comparación con benchmark, la consulta de histórico de fondos y la presentación del estado de actualización del dashboard.
  - Retira una explicación redundante de resultados y documenta la política de refresco y las alternativas de cotización.
- Resumen:
  - La versión v6.1.1 hace más actuales las cotizaciones intradía y mejora la claridad del dashboard y de sus resultados comparativos.
- Archivos:
  - `README.md`, `docs/daily-market-data.md`, `package.json`, `package-lock.json`, `scripts/test-benchmark-comparison.ts`, `scripts/test-daily-market-ui.ts`, `scripts/test-live-market-quotes-ui.ts`, `scripts/test-live-market-quotes.ts`, `scripts/test-portfolio-periods-ui.ts`, `src/components/dashboard/AssetDetail.css`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/components/dashboard/useDashboardAnalytics.ts`, `src/constants/app.ts`, `src/context/PortfolioContext.tsx`, `src/pages/Dashboard/Dashboard.css`, `src/pages/Dashboard/Dashboard.tsx`, `src/services/apiService.ts`, `src/services/benchmarkComparison.ts`, `src/services/market/alternativeQuotes.ts`, `src/services/market/priceRefreshPolicy.ts`, `src/services/market/stockQuoteMarkets.ts`, `src/services/portfolioQuoteService.ts`, `src/services/storageService.ts`, `src/types/api.ts`, `src/types/asset.ts`, `vercel.json`, `vite.config.ts`.
  
### 2026-10-08 - v6.1.0 - Operaciones retroactivas y calculadora salarial
- Funcionalidad:
  - Reproduce las compras y ventas de cartera en orden cronológico y valida las ventas retroactivas frente al saldo disponible en esa fecha.
  - Añade una calculadora de salario neto y retención IRPF para 2026, con escenarios y exportación CSV.
  - Documenta el alcance y las limitaciones del cálculo fiscal; no guarda los datos introducidos.
- Resumen:
  - La versión v6.1.0 incorpora el cálculo correcto de posiciones con operaciones fechadas y una herramienta de estimación salarial para España.
- Archivos:
  - `README.md`, `docs/dashboard-review.md`, `docs/salary-calculator.md`, `package.json`, `package-lock.json`, `scripts/generate-seo.js`, `scripts/prerender.js`, scripts de verificación de cartera y calculadora, `src/app/routes/academyRoutes.tsx`, `src/components/academy/calculators/Calculators.tsx`, `src/components/academy/calculators/SalaryCalculator.tsx`, `src/components/academy/calculators/SalaryCalculator.css`, `src/context/PortfolioContext.tsx`, `src/constants/app.ts`, `src/services/irpf/salaryCalculator.ts`, `src/services/irpf/taxData2026.ts`, `src/services/portfolioPerformance.ts`, `src/services/portfolioResults.ts`, `src/services/portfolioTradeReplay.ts`, `supabase/migrations/20261008102825_portfolio_chronological_trades.sql`.

### 2026-10-08 - v6.0.14 - NAV verificados y cierres históricos
- Funcionalidad:
  - Actualiza el batch de cotizaciones a cada 30 minutos entre las 08:00 y las 22:30 de Madrid, con alertas que reconocen la fecha de activación del nuevo horario.
  - Contrasta los NAV por ISIN y clase entre Finect, VDOS/Quefondos y Yahoo; añade NAV de gestoras para Cobas y Azvalor y refresco cloud a demanda autenticado, limitado por cuenta y fondo.
  - Usa cierres cotizados de Yahoo en las valoraciones históricas, sin ajustes por dividendos, y distingue la variación del precio de la rentabilidad no realizada.
  - Corrige la selección de NAV de Pictet y DWS y conserva el dato válido más fresco cuando falla una fuente.
- Resumen:
  - Mejora la frescura y trazabilidad de los NAV de fondos y la precisión de las valoraciones históricas.
- Archivos:
  - `README.md`, `docs/daily-market-data.md`, `docs/dashboard-review.md`, `package.json`, `package-lock.json`, `scripts/test-architecture-hardening.ts`, `scripts/test-dashboard-results-ui.ts`, `scripts/test-fund-quotes-ui.ts`, `scripts/test-fund-quotes.ts`, `scripts/test-historical-price-basis-ui.ts`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/context/PortfolioContext.tsx`, `src/constants/app.ts`, `src/services/apiService.ts`, `src/services/dailyMarketData.ts`, `src/services/funds/freshFundQuote.ts`, `src/services/portfolioQuoteService.ts`, `src/types/api.ts`, `src/types/asset.ts`, `supabase/functions/_shared/fundQuotePolicy.ts`, `supabase/functions/daily-market-data/deno.json`, `supabase/functions/daily-market-data/fundSources.ts`, `supabase/functions/daily-market-data/providers.ts`, `supabase/functions/fund-quote/deno.json`, `supabase/functions/fund-quote/handler.ts`, `supabase/functions/fund-quote/index.ts`, `supabase/migrations/20261007223438_market_half_hour_schedule.sql`, `supabase/migrations/20261007231120_fund_quote_sources.sql`, `FEATURE_LOG.md`.

### 2026-10-07 - v6.0.13 - Cierres cripto y sincronización de cartera
- Funcionalidad:
  - Calcula la variación cripto con el cierre real del día anterior UTC y aplica el cambio de divisa fechado, tanto en el navegador como en el worker.
  - Conserva las ediciones concurrentes de cartera al confirmar reintentos y evita publicar snapshots con precios incompletos.
  - Mantiene la valoración actual si falta el cierre anterior y permite completar la verificación MFA aunque falle la recarga de datos.
- Resumen:
  - Corrige la variación diaria de criptoactivos y refuerza la recuperación de sincronización y la captura completa de valoraciones.
- Archivos:
  - `docs/daily-market-data.md`, `package.json`, `package-lock.json`, `scripts/test-architecture-hardening.ts`, `scripts/test-crypto-variation-ui.ts`, `scripts/test-news-article-editor-ui.ts`, `scripts/test-portfolio-sync.ts`, `src/constants/app.ts`, `src/pages/Account/AccountMfa.tsx`, `src/pages/AddInvestment/AddInvestment.tsx`, `src/services/apiService.ts`, `src/services/portfolioCloudStorage.ts`, `src/services/portfolioQuoteService.ts`, `supabase/functions/_shared/quoteCurrency.ts`, `supabase/functions/daily-market-data/providers.ts`, `supabase/migrations/20261007182903_market_snapshot_completeness.sql`, `FEATURE_LOG.md`.

### 2026-10-07 - v6.0.12 - Endurecimiento de cotizaciones y persistencia
- Funcionalidad:
  - Normaliza unidades de cotización minoritarias y valida precio, moneda y cambio fechado antes de publicar datos de mercado.
  - Conserva el libro inmutable asociado a cada valoración y captura snapshots solo con precios recientes de la ejecución correspondiente.
  - Añade alertas de salud del batch y guarda los cambios cloud de cartera mediante parches idempotentes.
  - Endurece las autorizaciones editoriales, las invitaciones recuperables y los permisos sobre artículos e imágenes.
- Resumen:
  - Refuerza la integridad de cotizaciones, valoraciones y sincronización cloud, junto con el control de acceso editorial.
- Archivos:
  - `README.md`, `docs/daily-market-data.md`, `package.json`, `package-lock.json`, `scripts/test-architecture-hardening.ts`, `scripts/test-daily-market-ui.ts`, `scripts/test-news-article-editor-ui.ts`, `src/constants/app.ts`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/useDashboardAnalytics.ts`, `src/context/AccountContext.tsx`, `src/context/PortfolioContext.tsx`, `src/pages/Account/AccountMfa.tsx`, `src/pages/Dashboard/Dashboard.tsx`, `src/pages/NewsAdmin/NewsAdmin.tsx`, `src/services/apiService.ts`, `src/services/dailyMarketData.ts`, `src/services/market/fundamentals.ts`, `src/services/newsService.ts`, `src/services/portfolioCloudStorage.ts`, `src/services/portfolioQuoteService.ts`, `src/services/portfolioRepository.ts`, `src/types/api.ts`, `src/types/asset.ts`, `src/types/portfolio.ts`, `supabase/functions/_shared/quoteCurrency.ts`, `supabase/functions/daily-market-data/index.ts`, `supabase/functions/daily-market-data/providers.ts`, `supabase/functions/invite-news-editor/index.ts`, `supabase/migrations/20261007163808_architecture_hardening.sql`, `supabase/migrations/20261007163855_market_publication_hardening.sql`, `supabase/migrations/20261007163927_portfolio_delta_commands.sql`, `supabase/migrations/20261007164501_architecture_advisor_cleanup.sql`, `supabase/news-schema.sql`.

### 2026-10-07 - v6.0.11 - Cotizaciones y valoraciones diarias
- Funcionalidad:
  - Automatiza las cotizaciones y valoraciones de carteras sincronizadas con fechas contables, fuentes identificadas y validación de precios, divisas y cobertura.
  - Actualiza acciones y ETF durante la sesión y prioriza el batch para fondos y mercados cerrados; los refrescos manuales evitan cachés antiguas.
  - Ejecuta el batch en ocho franjas horarias peninsulares, recupera cierres tardíos y aplica cambios de divisa fechados.
  - Añade descripciones breves de empresas cuando se verifica la identidad del instrumento.
- Resumen:
  - Mejora la actualidad y trazabilidad de la cartera sin fabricar cotizaciones ni modificar cantidades o transacciones.
- Archivos:
  - `README.md`, `docs/daily-market-data.md`, `package.json`, `package-lock.json`, `src/constants/app.ts`, `src/components/dashboard/AssetDetail.css`, `src/components/dashboard/AssetDetail.tsx`, `src/context/PortfolioContext.tsx`, `src/services/apiService.ts`, `src/services/dashboardIntegrity.ts`, `src/services/market/companyOverview.ts`, `src/services/market/fundamentals.ts`, `src/services/market/marketConfig.ts`, `src/services/market/marketSessions.ts`, `src/services/portfolioQuoteService.ts`, `src/types/api.ts`, `supabase/functions/daily-market-data/providers.ts`, `supabase/migrations/20261007153147_daily_market_two_hour_schedule.sql`.

### 2026-10-07 - v6.0.10 - Cartera, benchmark y herramientas de inversión
- Funcionalidad:
  - Separa la rentabilidad de cartera de la comparación fechada con benchmark y muestra aportaciones en bloques completos de 50 €.
  - Añade cierres mensuales para el análisis histórico, detalle de instrumentos subyacentes y generación local del QR de MFA.
  - Mejora el reto Market Timing, la edición de noticias por sus autores y la presentación del Dashboard.
  - La cartera conserva el periodo completo aunque el benchmark tenga cobertura parcial; la comparación mensual se alinea por fecha de cierre y los controles se adaptan a móvil.
  - El reto Market Timing vs DCA ya no muestra el enlace de retorno «← Academia».
- Resumen:
  - Refuerza el análisis de cartera y amplía las herramientas educativas y editoriales.
- Archivos:
  - `README.md`, `docs/dashboard-review.md`, `docs/news-and-market-timing.md`, `package.json`, `package-lock.json`, `scripts/test-academy-account-polish.ts`, `scripts/test-dashboard-logic.ts`, `scripts/test-dashboard-quality-ui.ts`, `scripts/test-market-timing-ui.ts`, `scripts/test-market-timing.ts`, `scripts/test-news-article-editor-ui.ts`, `scripts/test-portfolio-periods-ui.ts`, `scripts/test-portfolio-periods.ts`, `scripts/test-underlying-detail-ui.ts`, `scripts/test-underlying-resolution.ts`, `src/components/academy/guides/InvestorTimeline.tsx`, `src/components/academy/simulators/MarketTimingGame.css`, `src/components/academy/simulators/MarketTimingGame.tsx`, `src/components/academy/simulators/PortfolioBuilder.css`, `src/components/academy/simulators/marketTimingEngine.ts`, `src/components/dashboard/AssetDetail.css`, `src/components/dashboard/AssetDetail.tsx`, `src/components/dashboard/LivePortfolioPlan.tsx`, `src/components/dashboard/PortfolioComposition.css`, `src/components/dashboard/PortfolioComposition.tsx`, `src/components/dashboard/PortfolioExcelInsights.css`, `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/components/dashboard/UnderlyingAssetDetail.tsx`, `src/components/layout/Sidebar/Sidebar.css`, `src/hooks/useNewsEditorId.ts`, `src/pages/Account/AccountMfa.tsx`, `src/pages/Dashboard/Dashboard.css`, `src/pages/Dashboard/Dashboard.tsx`, `src/pages/News/News.css`, `src/pages/News/News.tsx`, `src/pages/NewsAdmin/NewsAdmin.tsx`, `src/services/apiService.ts`, `src/services/dashboardIntegrity.ts`, `src/services/mfaQr.ts`, `src/services/portfolioPerformance.ts`, `src/services/portfolioPlan.ts`, `src/services/underlyingInstruments.ts`, `src/types/api.ts`, `src/types/portfolio.ts`.

### 2026-10-07 - v6.0.9 - Fundamentales de acciones e históricos de fondos
- Funcionalidad:
  - Resolución de históricos de fondos por ISIN y clase completa para elegir la serie NAV correcta y descartar ETFs o clases distintas.
  - Recuperación de fundamentales publicados de acciones con fecha y divisa de origen, alternativas verificadas y sin mezclar periodos incompatibles.
  - Reintento de datos fundamentales independiente de la carga del histórico.
- Resumen:
  - Amplía la lectura de cartera con históricos de fondos más fiables y fundamentales de acciones trazables.
- Archivos:
  - `docs/dashboard-review.md`, `package.json`, `scripts/test-fund-chart-resolution.ts`, `scripts/test-fund-chart-ui.ts`, `scripts/test-stock-fundamentals.ts`, `scripts/test-stock-fundamentals-ui.ts`, `src/components/dashboard/AssetDetail.css`, `src/components/dashboard/AssetDetail.tsx`, `src/services/apiService.ts`, `src/services/funds/fundChartResolution.ts`, `src/services/market/fundamentals.ts`, `src/types/api.ts`, `vercel.json`, `vite.config.ts`.

### 2026-10-06 - v6.0.8 - Ajustes de lectura del Dashboard
- Funcionalidad:
  - Textos más breves en el análisis avanzado y detalles del cálculo de resultados plegados inicialmente.
  - Paneles del desglose de fondos cerrados inicialmente; cobertura y posiciones permanecen visibles al abrirlos.
- Resumen:
  - Reduce la densidad visual inicial y deja disponible el detalle bajo demanda.
- Archivos:
  - `src/components/dashboard/PortfolioExcelInsights.tsx`, `src/components/dashboard/PortfolioExcelInsights.css`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `src/components/dashboard/PortfolioSummary/PortfolioSummary.css`, `src/components/dashboard/PortfolioComposition.tsx`, `docs/dashboard-review.md`.

### 2026-10-06 - v6.0.7 - Recuperación del desglose de fondos
- Funcionalidad:
  - Compatibilidad con el estado actual de Finect y su formato URI legado, sin evaluar JavaScript del proveedor.
  - Recuperación de todas las posiciones publicadas y las distribuciones disponibles por fondo.
  - Indicador de cobertura y origen; se conserva el desglose guardado cuando la respuesta remota es menos completa.
- Resumen:
  - Restaura los desgloses disponibles y mejora la lectura de exposición consolidada en el Dashboard.
- Archivos:
  - `src/services/finect/finectService.ts`, `src/services/fundBreakdown.ts`, `src/components/dashboard/PortfolioComposition.tsx`, `docs/dashboard-review.md`.

### 2026-10-06 - v6.0.6 - Actualización diaria de mercado y benchmark Fidelity
- Funcionalidad:
  - Captura programada de precios y NAV con trazabilidad de fuente, divisa y fecha de cotización.
  - Valoraciones diarias privadas de cartera y consumo de precios guardados en el Dashboard.
  - Benchmark Fidelity MSCI World ACC EUR, sin inventar histórico anterior a la activación.
- Resumen:
  - Mantiene la evolución diaria de la cartera con datos verificables aunque no se abra la aplicación.
- Archivos:
  - `supabase/functions/daily-market-data/`, `supabase/migrations/`, `src/hooks/useDailyMarketData.ts`, `src/services/dailyMarketData.ts`, `src/components/dashboard/`, `docs/daily-market-data.md`.

### 2026-10-02 - v6.0.5 - Calculadoras y Dashboard: simulaciones y lectura de cartera
- Funcionalidad:
  - Interés compuesto con intereses generados, retiradas acumuladas y saldo disponible diferenciados, también en gráfico y detalle anual.
  - Fondo de emergencia sin resultados engañosos cuando no hay gastos; entradas de inflación editables y etiquetas accesibles en FIRE, jubilación y emergencia.
  - Comparación de hasta tres escenarios en FIRE y jubilación, conservando los parámetros y unidades de cada simulación mientras permanece abierta la pantalla.
  - Buscador por nombre, símbolo o ISIN y filtro por tipo en Mis Activos, sin alterar los pesos de la cartera completa.
  - Variación de la última cotización identificada por fecha; cotizaciones antiguas no se presentan como cambio de hoy. Rankings identificados como rentabilidad desde la compra.
  - Reintento del benchmark limitado a la solicitud manual, conservando la caché en las consultas posteriores.
- Resumen:
  - Corrige resultados y etiquetas ambiguos y facilita comparar simulaciones y consultar carteras con muchos activos.
- Archivos:
  - `src/components/academy/calculators/`, `src/components/dashboard/`, `src/services/dashboardIntegrity.ts`, `src/pages/Dashboard/Dashboard.tsx`, `scripts/test-calculator-dashboard-usability.ts`, `scripts/test-assets-table.ts`, `package.json`.

### 2026-10-02 - v6.0.4 - Dashboard: claridad de datos y plan móvil
- Funcionalidad:
  - Rankings con colores según ganancias o pérdidas, independientemente de su clasificación.
  - Los lotes del mismo instrumento no se confunden con registros de identificador duplicado.
  - Valoraciones estimadas identificadas junto al precio, valor y resumen; panel compacto de calidad de datos y explicación de ratios sin dato.
  - Histórico de mercado conservado seis horas, con actualización incremental, reintentos limitados y respaldo ante fallos.
  - Plan móvil con peso actual, objetivo y aportación propuesta, y detalle desplegable de cada posición.
- Resumen:
  - Hace más clara la información de cartera y reduce consultas redundantes sin cambiar la navegación ni las fórmulas de rentabilidad.
- Archivos:
  - `src/components/dashboard/`, `src/pages/Dashboard/Dashboard.tsx`, `src/services/dashboardIntegrity.ts`, `src/services/dashboardMarketHistory.ts`, `scripts/test-dashboard-quality.ts`, `scripts/test-dashboard-quality-ui.ts`, `package.json`.

### 2026-10-02 - v6.0.3 - Bonos, Nasdaq 100 y controles móviles
- Funcionalidad:
  - Resultado TIR/YTM legible en tema claro y en Liquid Glass, con tipografía y contraste coherentes.
  - Nasdaq 100 en el heatmap, con composición oficial de Betashares NDQ, cotización de referencia QQQ y respaldo completo de posiciones.
  - Acciones de cartera separadas en móvil, con áreas táctiles de 44 px y controles compatibles con Liquid Glass.
  - Avisos de carga y error de cotizaciones legibles sobre el fondo oscuro del heatmap en ambos temas.
- Resumen:
  - Mejora la lectura de resultados y reduce pulsaciones accidentales al gestionar activos desde el móvil.
- Archivos:
  - `src/components/academy/calculators/BondCalculator.css`, `src/components/academy/tools/MarketHeatmap.css`, `src/components/dashboard/AssetsTable.css`, `src/data/marketHeatmapIndices.ts`, `src/data/nasdaq100Holdings.ts`, `src/services/marketHeatmapService.ts`, `scripts/test-dashboard-market-polish.ts`, `package.json`, `vite.config.ts`, `vercel.json`

### 2026-10-02 - v6.0.2 - Academia y configuración de cuenta
- Funcionalidad:
  - Ruta guiada de Fundamentos desplegada por defecto, manteniendo el control para contraerla.
  - Configuración TOTP con QR legible, clave manual accesible y tratamiento explícito de factores pendientes.
  - Ajustes visuales del modo Liquid Glass y control accesible para activar o desactivar peticiones a APIs.
  - Novedades de cuenta agrupadas y términos ampliados sobre almacenamiento, sincronización y seguridad.
- Resumen:
  - Pulido de Academia, apariencia y controles de cuenta, con instrucciones más claras para configurar el segundo factor.
- Archivos:
  - `src/components/academy/guides/Fundamentos.tsx`, `src/pages/Account/AccountMfa.tsx`, `src/pages/Account/Account.css`, `src/services/mfaQr.ts`
  - `src/pages/Settings/Settings.tsx`, `src/pages/Settings/Settings.css`, `src/pages/FeatureLog/FeatureLog.tsx`, `src/pages/TermsAndConditions/TermsAndConditions.tsx`
  - `scripts/test-academy-account-polish.ts`, `scripts/test-portfolio-ui.ts`, `package.json`, `package-lock.json`

### 2026-10-02 - v6.0.1 - Mejoras de acceso y configuración de cuenta
- Funcionalidad:
  - Ruta guiada de Fundamentos desplegada por defecto, manteniendo el control para contraerla.
  - QR del autenticador con fondo blanco y margen de lectura, normalización de SVG y clave manual para configurar desde el mismo móvil.
  - Icono Liquid Glass sin el borde interior que conectaba visualmente sus dos elementos.
  - Interruptor de peticiones a APIs sin etiquetas interiores, con estado accesible para lectores de pantalla.
  - Términos actualizados para explicar el almacenamiento local y en Supabase, junto con controles de acceso, segundo factor, integridad del guardado y precauciones para dispositivos y copias privadas.
  - Aviso claro al encontrar una cartera local y una cuenta sin importar, con opciones para revisarla o continuar sin subir datos.
  - Guía de tres pasos en Mi cuenta, revisión enfocada y botón explícito para guardar la cartera en la cuenta.
  - Mensajes de error y confirmación de Mi cuenta con el mismo aviso flotante del acceso editorial de Noticias.
  - Formato compartido para recuperación, registro, importación y verificación en dos pasos, con roles accesibles y ajuste móvil.
  - Tarjeta de conexión cuidada e indicador de carga integrado en el botón de acceso, sin textos sueltos al iniciar sesión o refrescar.
  - Plantillas de acceso y recuperación en español, con cambio de correo seguro e invitaciones editoriales.
  - Transporte privado para Microsoft Graph, validación de redirects y pruebas sin envío real.
- Resumen:
  - Reúne las mejoras de Academia, configuración y acceso de la cuenta, facilita conectar una cartera existente sin borrar la copia local ni reemplazar datos, y unifica los avisos y estados de carga.
  - Incluye la preparación técnica del correo con Outlook; su conexión y activación requieren registrar y autorizar la aplicación de Microsoft.
- Archivos:
  - `src/components/academy/guides/Fundamentos.tsx`, `src/pages/Account/Account.tsx`, `src/pages/Account/Account.css`, `src/pages/Account/AccountMfa.tsx`, `src/services/mfaQr.ts`, `src/pages/NewsAdmin/NewsAdmin.tsx`
  - `src/pages/Settings/Settings.tsx`, `src/pages/Settings/Settings.css`, `src/pages/FeatureLog/FeatureLog.tsx`, `src/pages/TermsAndConditions/TermsAndConditions.tsx`, `scripts/test-academy-account-polish.ts`
  - `src/components/ui/LocalPortfolioPrompt.tsx`, `src/components/ui/LocalPortfolioPrompt.css`, `src/components/layout/MainLayout/MainLayout.tsx`, `src/services/localPortfolioSummary.ts`, `scripts/test-portfolio-ui.ts`
  - `src/components/ui/FeedbackToast.tsx`, `src/components/ui/FeedbackToast.css`, `src/components/ui/useFeedbackNotice.ts`
  - `src/context/FeedbackContext.tsx`, `src/context/AccountContext.tsx`, `src/main.tsx`, `src/components/ui/AccountConnectionState.tsx`, `src/components/ui/AccountConnectionState.css`, `scripts/test-account-feedback.ts`
  - `supabase/mail/outlook.ts`, `scripts/test-outlook-mail.ts`, `docs/outlook-auth-mail.md`

### 2026-10-02 - v6.0.0 - Cartera multidispositivo con Supabase
- Funcionalidad:
  - Mi cuenta: acceso, registro, recuperación y autenticador en dos pasos.
  - Estado de sincronización integrado en el menú, sin franja superior ni enlaces de navegación redundantes en Mi cuenta.
  - Formularios y botones de cuenta con espaciado coherente y controles táctiles adaptados a móvil y Liquid Glass.
  - Correo con tipografía contenida y selector de copia privada accesible, con formato coherente en pantallas pequeñas.
  - Importación voluntaria con vista previa y respaldo privado, sin reemplazar una cartera existente ni borrar la copia local.
  - Sincronización de posiciones, movimientos, Excel, objetivos y preferencias con revisión, idempotencia y conflictos explícitos.
  - Cálculo decimal servidor para DCA y ventas, aislamiento de cuentas y cancelación de respuestas de sesiones anteriores.
  - Dependencias actualizadas y pruebas de PostgreSQL, sincronización y navegador con la cartera de referencia.
- Resumen:
  - Desarrollo habilitado en local y esquema instalado en Supabase. La activación pública permanece condicionada a verificar correo, redirects y acceso multidispositivo.
- Archivos:
  - `supabase/migrations/20261001232427_portfolio_foundation.sql`, `supabase/migrations/20261001232431_portfolio_commands.sql`, `supabase/migrations/20261001234107_portfolio_mfa_guard.sql`, `supabase/migrations/20261002000609_portfolio_command_validation.sql`
  - `src/context/AccountContext.tsx`, `src/pages/Account`, `src/services/portfolioCloudStorage.ts`, `src/services/portfolioRepository.ts`
  - Contextos y páginas de cartera, preferencias, cliente de Noticias y documentación de privacidad.
  - `scripts/test-portfolio-backend.ts`, `scripts/test-portfolio-sync.ts`, `scripts/test-portfolio-ui.ts`, `docs/portfolio-supabase.md`

### 2026-10-02 - v5.3.14 - Divisa de las operaciones
- Funcionalidad:
  - Selector de divisa para compras, ventas y edición manual de posiciones.
  - Conversión a euros con el cierre histórico de la fecha (hasta siete días anteriores) o con el importe real indicado por el usuario.
  - Las posiciones, ventas y aportaciones DCA se contabilizan en EUR; la divisa y el precio originales quedan anotados en el movimiento.
- Resumen:
  - Permite registrar operaciones en moneda extranjera conservando los cálculos de cartera en euros.
- Archivos:
  - `src/pages/AddInvestment/AddInvestment.tsx`, `src/services/operationCurrency.ts`
  - `src/services/apiService.ts`, `src/context/PortfolioContext.tsx`, `scripts/test-operation-currency.ts`

### 2026-10-02 - v5.3.13 - Detalle y ordenación de Mis Activos
- Funcionalidad:
  - En móvil, «Ver todo» muestra los nombres completos a ancho de fila y mantiene visible la variación diaria.
  - Ordenación ascendente y descendente por variación porcentual de hoy, con los valores no disponibles al final.
  - El detalle móvil incluye el precio actual y presenta las cantidades con formato y precisión consistentes.
- Resumen:
  - Mejora la lectura y exploración de la cartera sin alterar sus datos; incluye regresiones para variaciones, ordenación y diseño adaptable.
- Archivos:
  - `src/components/dashboard/AssetsTable.tsx`, `src/components/dashboard/AssetsTable.css`
  - `src/services/dashboardIntegrity.ts`, `scripts/test-assets-table.ts`

### 2026-10-02 - v5.3.12 - Calculadoras, integridad del Dashboard y desglose de fondos
- Funcionalidad:
  - Calculadoras: aportaciones necesarias coherentes con las aportaciones al inicio de mes; objetivos inalcanzables y entradas inválidas identificados; retiradas limitadas al saldo; correcciones de casos límite en FIRE e Inflación; cupones de bonos con ancla de fecha, finales de mes y años bisiestos.
  - Dashboard: edición de posiciones sin alterar su fecha de compra ni aplicar cotizaciones de instrumentos anteriores; búsqueda inequívoca y detalle de subyacentes sin posiciones ficticias; valores sin cotización como N/D, ordenación estable y cobertura incompleta explícita; resumen mensual coherente con Evolución; objetivos, historial y reintentos actualizados sin cálculos duplicados; fechas de consulta y precio diferenciadas, avisos de antigüedad y errores de persistencia visibles.
  - Noticias: SDK editorial compartido y cargado solo al utilizar esa sección, sin diferir la navegación de rutas.
  - Desglose de fondos: celdas legibles en móvil y escritorio, exposición consolidada a ancho completo, asignaciones por fondo desplegables y título «Mapa de riesgo».
- Resumen:
  - Reúne correcciones matemáticas, de integridad de cartera y de presentación; incluye regresiones automatizadas para calculadoras, Dashboard y desglose de fondos.
- Archivos:
  - `src/components/academy/calculators/`, `scripts/test-calculator-integrity.ts`
  - `src/services/dashboardIntegrity.ts`, `src/services/portfolioQuoteStatus.ts`, `src/services/portfolioPerformance.ts`, `src/services/portfolioComposition.ts`, `src/services/apiService.ts`, `src/services/newsService.ts`
  - `src/context/PortfolioContext.tsx`, `src/pages/AddInvestment/AddInvestment.tsx`, `src/pages/Dashboard/`, `src/pages/PortfolioCsv/`
  - `src/components/dashboard/`, `src/components/charts/`, `scripts/test-dashboard-audit-fixes.ts`, `scripts/test-dashboard-bundle.ts`, `scripts/test-dashboard-followups.ts`, `scripts/test-fund-breakdown-layout.ts`
  - `README.md`, `docs/dashboard-logic-review.md`

### 2026-10-01 - v5.3.11 - Coherencia de cálculos y planificación del Dashboard
- Funcionalidad:
  - YTD completo separado de los tramos comparables del benchmark, con consulta de su base y selección por cobertura.
  - Riesgo compartido con Portfolio: drawdown ajustado por flujos, volatilidad muestral, Sortino y tasa libre de riesgo del Excel.
  - Objetivos por instrumento, entrada decimal, agrupación de lotes y reparto exacto de la aportación en céntimos.
  - Importación sin duplicar flujos, nombres de meses ampliados y calendario contable de Madrid.
  - Valoraciones, rankings y composición con bases válidas y residuos reconciliados.
- Resumen:
  - Revisión de la lógica del Dashboard acompañada de regresiones y verificación local de las posiciones de referencia.
- Archivos:
  - `src/services/portfolioRisk.ts`, `src/services/portfolioPlan.ts`, `src/services/portfolioCalendar.ts`
  - `src/services/portfolioPerformance.ts`, `src/services/portfolioWorkbookHistory.ts`, `src/services/apiService.ts`
  - `src/components/dashboard/`, `src/pages/Dashboard/`, `src/pages/PortfolioCsv/`
  - `scripts/test-dashboard-logic.ts`, `docs/dashboard-logic-review.md`

### 2026-09-30 - v5.3.10 - Cobertura del benchmark e intervalos mensuales
- Funcionalidad:
  - La comparativa con MSCI World conserva los puntos disponibles cuando faltan cotizaciones en parte del periodo, sin unir tramos de rentabilidad desconocida.
  - El resumen mensual distingue intervalos mensuales, diarios y entre valoraciones para no confundirlos con días cubiertos.
  - Se simplifica el texto del periodo efectivo del resumen.
- Resumen:
  - Comparativas parciales visibles y cobertura del histórico más clara.
- Archivos:
  - `src/services/portfolioPerformance.ts`, `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`, `scripts/test-import-benchmark-coverage.ts`

### 2026-09-30 - Correcciones de la auditoría del Dashboard
- Funcionalidad:
  - Periodo compartido entre resumen, evolución y benchmark, con bases verificables y protección frente a huecos diarios.
  - Valoración coherente ante precios cero o ausentes, precisión de cantidades y divisa explícita en el detalle.
  - Vinculación local y explícita del Excel con la cartera, sin publicar posiciones privadas ni convertir el saldo inicial en compras reales.
  - Desgloses parciales con concurrencia limitada y reintento; sectores y países separados de los subyacentes, consolidación por ISIN y coincidencias aproximadas identificadas.
  - Sincronización local entre pestañas, liquidez como tipo propio y actualización sin crear registros con cotizaciones antiguas.
  - Navegación accesible por teclado, foco contenido y restaurado en modales, controles táctiles y dependencias pesadas cargadas solo al usarse, sin diferir rutas.
  - Aviso de nueva versión con acceso a las novedades, mostrado una sola vez por versión en cada navegador.
  - La importación de posiciones termina en el total de Cartera para no incorporar los resúmenes de bloques como activos adicionales.
  - La comparativa usa la rentabilidad ajustada por flujos de Evolución y Diario, e identifica las coberturas parciales frente al periodo completo.
- Resumen:
  - Correcciones acompañadas de pruebas sintéticas de regresión.
- Archivos:
  - `src/services/assetValuation.ts`, `src/services/portfolioPerformance.ts`, `src/services/portfolioWorkbookHistory.ts`
  - `src/components/dashboard/`, `src/pages/Dashboard/Dashboard.tsx`, `src/components/ui/Modal/`
  - `src/context/PortfolioContext.tsx`, `src/hooks/useLocalDataVersion.ts`, `src/services/storageService.ts`
  - `src/pages/AddInvestment/AddInvestment.tsx`, `src/pages/PortfolioCsv/PortfolioCsv.tsx`, `src/pages/NewsAdmin/NewsAdmin.tsx`
  - `scripts/test-dashboard-audit.ts`, `scripts/test-workbook-continuity.ts`, `scripts/test-dashboard-integrity.ts`, `scripts/test-portfolio-performance.ts`

### 2026-09-30 - v5.3.9 - Continuidad del histórico y pulido del Dashboard
- Funcionalidad:
  - Se conservan los cierres mensuales y se añade la continuación diaria sin duplicar aportaciones ni asignar fechas inventadas a los movimientos.
  - Se reconocen fechas con año de dos cifras y la hoja Diario; los periodos incompletos conservan su base y cuentan los intervalos válidos y desconocidos.
  - Se usa una escala temporal real en evolución, se contienen las columnas del Dashboard en escritorio y los modales evitan el fondo gris en Liquid Glass claro manteniendo el bloqueo de scroll.
  - Las cotizaciones antiguas no generan una valoración nueva al abrir el Dashboard y el detalle no inventa una variación diaria cuando falta el cierre anterior.
  - Las doce guías de Recursos enlazan directamente a sus vídeos concretos de YouTube y cada enlace incluye un nombre accesible con el título del vídeo.
- Resumen:
  - Mejora la continuidad y trazabilidad de los datos importados, el aspecto del Dashboard en Liquid Glass claro y el acceso a los recursos de Academy.
- Archivos:
  - `src/services/portfolioWorkbookHistory.ts`
  - `src/services/portfolioPerformance.ts`
  - `src/pages/PortfolioCsv/portfolioCsvUtils.ts`
  - `src/pages/PortfolioCsv/PortfolioCsv.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/components/dashboard/useDashboardAnalytics.ts`
  - `src/components/dashboard/AssetDetail.tsx`
  - `src/components/dashboard/AssetDetail.css`
  - `src/components/ui/Modal/Modal.tsx`
  - `src/styles/liquidGlass.css`
  - `src/components/dashboard/PortfolioComposition.css`
  - `src/pages/Dashboard/Dashboard.css`
  - `src/types/portfolio.ts`
  - `scripts/test-workbook-continuity.ts`
  - `src/components/academy/guides/InProcess.tsx`

### 2026-09-21 - v5.3.8 - Integridad del Dashboard y continuidad de cartera
- Funcionalidad:
  - Se reconcilian el histórico, las compras, las ventas completas y las aportaciones para evitar duplicidades y valoraciones inconsistentes.
  - Se continúa el histórico importado desde Excel con las operaciones posteriores y se distinguen las estimaciones de mercado de los datos verificados.
  - Se alinean rendimiento, benchmark, fechas, divisas y cierres anteriores, evitando indicadores cuando no existe una base válida.
  - Se unifica el guardado local de posiciones y operaciones con escritura atómica y errores visibles, sin sobrescribir la cartera ante un fallo.
  - Se actualizan las tablas, tarjetas, insights y el plan del Dashboard para consumir el mismo modelo analítico, junto con pruebas específicas de integridad.
- Resumen:
  - El Dashboard ofrece métricas de cartera más coherentes y trazables, conserva correctamente las operaciones y deja claro cuándo un dato procede de una estimación.
- Archivos:
  - `src/components/dashboard/useDashboardAnalytics.ts`
  - `src/services/dashboardHistory.ts`
  - `src/services/portfolioPerformance.ts`
  - `src/services/portfolioQuoteService.ts`
  - `src/services/storageService.ts`
  - `src/context/PortfolioContext.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `scripts/test-dashboard-integrity.ts`

### 2026-09-17 - v5.3.7 - Aviso informativo del Dashboard
- Funcionalidad:
  - Se incorpora un aviso modal persistente para informar de que el Dashboard sigue en desarrollo.
  - Se añaden accesos directos a Academia, Configuración y Portfolio desde el aviso.
- Resumen:
  - El Dashboard comunica sus limitaciones actuales y orienta al usuario hacia las vistas más completas de la aplicación.
- Archivos:
  - `src/pages/Dashboard/Dashboard.tsx`

### 2026-09-17 - v5.3.6 - Cabeceras compartidas y pulido responsive de Academy
- Funcionalidad:
  - Se incorpora una cabecera de página compartida para las secciones de Academy y se unifica su navegación auxiliar.
  - Se ajustan guías, calculadoras, simuladores y herramientas para usar la nueva cabecera y mejorar la adaptación a móvil.
  - Se revisan las superficies Liquid Glass y los estilos de interacción para mantener una presentación consistente en todo el recorrido de Academy.
- Resumen:
  - Academy gana una estructura visual más uniforme y compacta, con cabeceras reutilizables y mejor comportamiento responsive.
- Archivos:
  - `src/components/academy/layout/AcademyPageHeader.tsx`
  - `src/components/academy/layout/AcademyPageHeader.css`
  - `src/components/academy/layout/AcademyLayout.tsx`
  - `src/components/academy/layout/AcademyLayout.css`
  - `src/components/academy/assets/*`
  - `src/components/academy/calculators/*`
  - `src/components/academy/guides/*`
  - `src/components/academy/simulators/*`
  - `src/components/academy/tools/MarketHeatmap.tsx`
  - `src/components/academy/tools/MarketHeatmap.css`
  - `src/components/ui/PageHeader/*`
  - `src/components/ui/index.ts`
  - `src/components/layout/MainLayout/MainLayout.tsx`
  - `src/components/layout/MainLayout/MainLayout.css`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/pages/Dashboard/Dashboard.css`
  - `src/context/AppearanceContext.tsx`
  - `src/styles/liquidGlass.css`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-17 - v5.3.5 - Corrección de versionado de hotfixes
- Funcionalidad:
  - Se actualiza la versión visible de FreeWallet a `v5.3.5` en Sidebar, Configuración y Feature Log mediante la constante compartida.
  - Se sincroniza la versión del paquete y su lockfile con la versión publicada en `hotfixes`.
- Resumen:
  - La rama `hotfixes` queda identificada correctamente como `v5.3.5` sin alterar las mejoras funcionales ya integradas.
- Archivos:
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-17 - v5.3.4 - Pulido del Heatmap y animaciones de interacción
- Funcionalidad:
  - Se mueve el resumen por sectores del Heatmap debajo del mapa para mantener primero la lectura visual principal.
  - Se convierte el resumen sectorial en una superficie integrada con el diseño de la herramienta.
  - Se amplía Liquid Glass a más módulos y controles, incluyendo una animación de confirmación de selección reutilizable y compatible con movimiento reducido.
- Resumen:
  - El Heatmap presenta una jerarquía más clara y las selecciones de la interfaz tienen una respuesta visual consistente en toda la aplicación.
- Archivos:
  - `src/components/academy/tools/MarketHeatmap.tsx`
  - `src/components/academy/tools/MarketHeatmap.css`
  - `src/context/AppearanceContext.tsx`
  - `src/styles/liquidGlass.css`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-17 - v5.3.3 - Correcciones de rendimiento, benchmark y responsive
- Funcionalidad:
  - Se corrigen los cálculos de rendimiento de cartera y benchmark para usar el cierre previo disponible, alinear datos intradía y rebajar correctamente los acumulados de YTD.
  - Se incorpora el cálculo automático del benchmark teniendo en cuenta los flujos de cartera y se actualizan sus pruebas de regresión.
  - Se ajusta la lectura responsive de activos, composición, donut y pantallas de Academy para evitar recortes y mejorar el uso en móvil.
  - Se amplía Liquid Glass a más superficies, filtros, controles, resultados flotantes y navegación auxiliar.
- Resumen:
  - Las métricas de evolución y comparativa quedan más consistentes en periodos cortos y con datos importados, mientras la interfaz se adapta mejor a pantallas pequeñas.
- Archivos:
  - `scripts/test-portfolio-performance.ts`
  - `src/services/portfolioPerformance.ts`
  - `src/services/apiService.ts`
  - `src/types/api.ts`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`
  - `src/components/dashboard/AssetsTable.tsx`
  - `src/components/dashboard/AssetsTable.css`
  - `src/components/dashboard/PortfolioComposition.css`
  - `src/components/charts/DonutChart.tsx`
  - `src/components/charts/DonutChart.css`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/components/academy/guides/Fundamentos.tsx`
  - `src/components/academy/guides/Fundamentos.css`
  - `src/components/academy/layout/AcademyLayout.tsx`
  - `src/components/academy/layout/AcademyLayout.css`
  - `src/components/layout/MainLayout/MainLayout.tsx`
  - `src/components/layout/MainLayout/MainLayout.css`
  - `src/context/AppearanceContext.tsx`
  - `src/styles/liquidGlass.css`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-17 - v5.3.2 - Detalle de activos en móvil y navegación simplificada
- Funcionalidad:
  - Se convierte el detalle de un activo en un modal flotante centrado en móvil, evitando el espaciado superior propio del panel anclado al borde inferior.
  - Se adapta el interior del detalle al material Liquid Glass en métricas, gráfico, selector de periodos y paneles de información.
  - Se eliminan variables de color no disponibles en el detalle y se usan los tokens semánticos compartidos.
  - Se retira `Añadir inversión` del sidebar, manteniendo sus accesos contextuales dentro de la aplicación.
- Resumen:
  - El detalle de activos ofrece una lectura más equilibrada en pantallas pequeñas y una integración visual más coherente con Liquid Glass, mientras que el sidebar queda centrado en las secciones principales.
- Archivos:
  - `src/components/ui/Modal/Modal.css`
  - `src/components/dashboard/AssetDetail.css`
  - `src/styles/liquidGlass.css`
  - `src/components/layout/Sidebar/Sidebar.tsx`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-16 - v5.3.1 - Pulido de Liquid Glass y navegación auxiliar
- Funcionalidad:
  - Se amplía el efecto Liquid Glass a controles, selectores, filtros, resultados flotantes y superficies de módulos que no usan el componente de tarjeta común.
  - Se añaden objetivos de interacción para que el resaltado dinámico acompañe también a estos controles.
  - Se corrige la posición del botón flotante de volver en Términos y condiciones para que no herede el desplazamiento del sidebar.
- Resumen:
  - La apariencia Liquid Glass mantiene un lenguaje visual más consistente en toda la aplicación y la navegación auxiliar queda correctamente alineada.
- Archivos:
  - `src/context/AppearanceContext.tsx`
  - `src/styles/liquidGlass.css`
  - `src/pages/TermsAndConditions/TermsAndConditions.css`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-16 - v5.3.0 - Apariencia Liquid Glass y preferencias por defecto
- Funcionalidad:
  - Se incorpora el estilo de interfaz Liquid Glass como opción configurable para toda la aplicación.
  - Se establecen Liquid Glass y el tema Sistema como preferencias iniciales cuando no existe una selección guardada.
  - Se simplifica el título de la configuración de apariencia eliminando el icono decorativo de brillo.
  - Se mantiene el historial de mejoras ordenado de la versión más reciente a la más antigua.
- Resumen:
  - FreeWallet arranca con una apariencia más integrada con el sistema y permite cambiar el material visual desde Configuración sin perder las preferencias existentes.
- Archivos:
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/context/AppearanceContext.tsx`
  - `src/context/ThemeContext.tsx`
  - `src/styles/liquidGlass.css`
  - `src/pages/Settings/Settings.tsx`
  - `src/pages/Settings/Settings.css`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-16 - v5.2.0 - Heatmap de mercados y reorganización del dashboard
- Funcionalidad:
  - Se incorpora la herramienta `Heatmap de mercados` con vistas para S&P 500, MSCI World y MSCI Emerging Markets.
  - Se cargan las composiciones oficiales de los índices mediante endpoints proxy y se completan sus cotizaciones diarias con Yahoo Finance Spark.
  - Se añade la navegación de `Herramientas`, la ruta pública del heatmap y su inclusión en SEO y prerender.
  - Se reorganizan las secciones del dashboard para mostrar por separado el resumen mensual, los últimos movimientos y el plan de cartera.
  - Se establece el tema oscuro como valor inicial y se actualiza la versión visible de la aplicación a `v5.2.0`.
- Resumen:
  - FreeWallet incorpora una lectura visual de la sesión de mercado y una navegación más clara para las herramientas, manteniendo el dashboard dividido en bloques más manejables.
- Archivos:
  - `src/components/academy/tools/MarketHeatmap.tsx`
  - `src/components/academy/tools/MarketHeatmap.css`
  - `src/data/marketHeatmapIndices.ts`
  - `src/services/marketHeatmapService.ts`
  - `src/services/apiService.ts`
  - `src/services/market/marketConfig.ts`
  - `src/components/layout/Sidebar/Sidebar.tsx`
  - `src/app/routes/academyRoutes.tsx`
  - `src/constants/routes.ts`
  - `src/App.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/context/ThemeContext.tsx`
  - `scripts/generate-seo.js`
  - `scripts/prerender.js`
  - `vercel.json`
  - `vite.config.ts`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-16 - v5.1.0 - Hotfix de rendimiento y lectura móvil de cartera
- Funcionalidad:
  - Se elimina la carga diferida de rutas para que la navegación y el renderizado sean inmediatos.
  - Se muestra el cambio de ganancia o pérdida del último día anterior cuando no hay histórico diario disponible.
  - Se reorganiza `Mis Activos` en móvil para mostrar primero la información esencial y dejar el detalle y las acciones bajo controles de tarjeta.
  - Se amplían los precios de compra y venta hasta seis decimales para activos de valor unitario pequeño.
  - Se separan las exposiciones de fondos marcadas como `Resto no desglosado` en su propia sección y se corrige el recorte responsive del donut y su leyenda.
- Resumen:
  - El dashboard carga de forma más fluida, conserva una referencia diaria útil y ofrece una lectura compacta y completa de la cartera según la necesidad del usuario.
- Archivos:
  - `src/App.tsx`
  - `src/app/routes/academyRoutes.tsx`
  - `src/components/charts/DonutChart.tsx`
  - `src/components/charts/DonutChart.css`
  - `src/components/dashboard/AssetDetail.tsx`
  - `src/components/dashboard/AssetsTable.tsx`
  - `src/components/dashboard/AssetsTable.css`
  - `src/components/dashboard/PortfolioComposition.tsx`
  - `src/components/dashboard/PortfolioComposition.css`
  - `src/components/dashboard/PortfolioSummary/PortfolioSummary.tsx`
  - `src/pages/AddInvestment/AddInvestment.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/pages/Dashboard/Dashboard.css`
  - `src/pages/Transactions/Transactions.tsx`
  - `src/services/portfolioPerformance.ts`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-13 - v5.0.14 - Hotfix de carga inicial de Academy
- Funcionalidad:
  - Se carga `Fundamentos` dentro del shell inicial de Academy para evitar el estado de carga en la primera visita.
  - Se mantienen bajo demanda las guías, calculadoras y simuladores más pesados.
  - Se actualiza la versión visible del sidebar a `v5.0.14`.
- Resumen:
  - La entrada de Academy queda disponible inmediatamente y el resto de rutas conserva la división por carga diferida.
- Archivos:
  - `src/app/routes/academyRoutes.tsx`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-13 - v5.0.13 - Hotfix de rendimiento del dashboard y analítica importada
- Funcionalidad:
  - Se difieren las secciones pesadas del dashboard y se aíslan los cálculos del contador de refresco para reducir trabajo durante la carga inicial.
  - Se añaden cachés para históricos importados y se incorpora la lectura del histórico de benchmark desde la comparativa de Excel.
  - Se ajustan los servicios de precios, almacenamiento y normalización de cartera para mantener datos consistentes con menor coste de actualización.
  - Se actualiza la versión visible del sidebar a `v5.0.13`.
- Resumen:
  - El dashboard carga antes su contenido crítico y conserva la analítica de cartera, histórico y benchmark importados con menos recomputaciones y consultas redundantes.
- Archivos:
  - `scripts/test-portfolio-composition-ui.mjs`
  - `scripts/test-portfolio-performance.ts`
  - `src/App.tsx`
  - `src/app/routes/academyRoutes.tsx`
  - `src/components/dashboard/AssetsTable.tsx`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/components/dashboard/Performers.tsx`
  - `src/components/dashboard/PortfolioComposition.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/context/PortfolioContext.tsx`
  - `src/index.css`
  - `src/pages/Dashboard/Dashboard.css`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/services/apiService.ts`
  - `src/services/market/marketCache.ts`
  - `src/services/portfolioQuoteService.ts`
  - `src/services/portfolioWorkbookHistory.ts`
  - `src/services/storageService.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-13 - v5.0.12 - Hotfix de benchmark y refresco de precios
- Funcionalidad:
  - Se permite seleccionar el periodo de la comparativa automática frente al benchmark URTH.
  - Se ajusta el refresco automático de precios a 5 minutos y se refleja el intervalo en el dashboard.
  - Se actualiza la versión visible del sidebar a `v5.0.12`.
- Resumen:
  - El dashboard evita consultas de precios excesivamente frecuentes y mantiene alineado el periodo mostrado del benchmark con la evolución seleccionada.
- Archivos:
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/constants/app.ts`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `package.json`
  - `package-lock.json`

### 2026-09-13 - v5.0.11 - Composición consolidada y analítica importada
- Funcionalidad:
  - Se añade una vista consolidada de la exposición de la cartera, uniendo posiciones directas con las posiciones subyacentes de fondos y ETF.
  - Se incorpora el detalle navegable de activos subyacentes y la resolución de sus cotizaciones cuando los datos de mercado están habilitados.
  - Se integran los históricos importados desde Excel en el dashboard y en el plan mensual, manteniendo sus flujos y tolerancias temporales.
  - Se actualiza la versión visible del sidebar a `v5.0.11`.
- Resumen:
  - La cartera puede mostrar solapamientos entre fondos y posiciones directas, abrir el detalle de una exposición y calcular métricas sobre históricos importados sin confundir datos parciales con rentabilidad observada.
- Archivos:
  - `src/components/charts/DonutChart.tsx`
  - `src/components/charts/DonutChart.css`
  - `src/components/charts/Heatmap.tsx`
  - `src/components/charts/Heatmap.css`
  - `src/components/dashboard/PortfolioComposition.tsx`
  - `src/components/dashboard/PortfolioComposition.css`
  - `src/components/dashboard/UnderlyingAssetDetail.tsx`
  - `src/components/dashboard/UnderlyingAssetDetail.css`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/components/dashboard/index.ts`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/services/finect/finectService.ts`
  - `src/services/portfolioComposition.ts`
  - `src/services/portfolioWorkbookHistory.ts`
  - `src/services/portfolioPerformance.ts`
  - `src/types/asset.ts`
  - `src/constants/app.ts`
  - `scripts/test-portfolio-composition.ts`
  - `scripts/test-portfolio-composition-ui.mjs`
  - `scripts/test-portfolio-performance.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-13 - v5.0.10 - Histórico de mercado para carteras importadas
- Funcionalidad:
  - Se incorpora la reconstrucción del histórico de cartera a partir de velas históricas de cada activo.
  - Se conserva la escala en euros de la cartera y se amplían las ventanas válidas para datos semanales y cierres mensuales.
  - Se añaden comprobaciones para validar que la curva de mercado conserva el movimiento histórico esperado.
- Resumen:
  - El análisis de evolución puede ofrecer una curva histórica útil incluso cuando la cartera no tiene snapshots diarios suficientes, sin convertir huecos o cambios de posición en rentabilidades ficticias.
- Archivos:
  - `src/services/portfolioPerformance.ts`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `scripts/test-portfolio-performance.ts`

### 2026-09-12 - v5.0.9 - Histórico verificable y analítica de cartera
- Funcionalidad:
  - Se corrigen los saltos espurios del histórico y se preservan únicamente valoraciones respaldadas por cotizaciones y operaciones conocidas.
  - El dashboard incorpora señales de calidad del histórico, benchmark y lecturas de cartera sin sustituir datos faltantes por valores inventados.
  - Se endurecen las pruebas de rendimiento, procedencia del histórico y el prerender de producción.
- Resumen:
  - Las métricas de rentabilidad y riesgo dejan de amplificar importaciones, ventas o snapshots no verificables y muestran N/D cuando falta una base fiable.
- Archivos:
  - `src/services/portfolioPerformance.ts`
  - `src/context/PortfolioContext.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/components/dashboard/PortfolioBenchmark.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/services/storageService.ts`
  - `src/types/portfolio.ts`
  - `scripts/test-portfolio-performance.ts`
  - `scripts/test-history-provenance-ui.ts`
  - `scripts/prerender.js`
  - `package.json`
  - `package-lock.json`
  - `src/constants/app.ts`

### 2026-09-12 - v5.0.8 - Fórmulas del Excel y rentabilidad por periodo
- Funcionalidad:
  - Se replica la metodología de `Estadísticas avanzadas` para meses cerrados, libre de riesgo, Sharpe, Sortino, volatilidad, anualización y drawdown.
  - Se evita mostrar la ganancia acumulada como `Cambio hoy` cuando no existe un cierre diario verificable y se amplía la retención del histórico a cinco años.
  - El detalle de cada activo muestra la rentabilidad del horizonte seleccionado y permite medir upside/drawdown con dos dedos en móvil, incluyendo el primer punto de la gráfica.
- Resumen:
  - El dashboard queda alineado con las fórmulas comprobadas del workbook y las gráficas de acciones y fondos muestran periodos y variaciones más fiables.
- Archivos:
  - `src/components/dashboard/AssetDetail.tsx`
  - `src/components/dashboard/AssetDetail.css`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/services/portfolioPerformance.ts`
  - `src/services/storageService.ts`
  - `scripts/test-portfolio-performance.ts`
  - `package.json`
  - `package-lock.json`
  - `src/constants/app.ts`

### 2026-09-11 - v5.0.7 - Gráficas de detalle y medición táctil
- Funcionalidad:
  - Se amplía el área útil de las gráficas de detalle reduciendo el espacio lateral reservado al eje Y.
  - La medición de upside y drawdown en móvil requiere dos dedos y permite ajustar ambos puntos sin interferir con el desplazamiento normal.
  - Se corrige el etiquetado del benchmark para distinguir claramente la cartera del MSCI World.
- Resumen:
  - El detalle de acciones y fondos aprovecha mejor el ancho disponible y ofrece una interacción táctil más precisa.
- Archivos:
  - `src/components/dashboard/AssetDetail.tsx`
  - `src/components/dashboard/AssetDetail.css`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `package.json`
  - `package-lock.json`
  - `src/constants/app.ts`

### 2026-09-11 - v5.0.6 - Auditoría de periodos y flujos de cartera
- Funcionalidad:
  - Se recalculan los retornos 1D, 7D, 1M, 3M, YTD y Todo con TWR ajustado por compras y ventas fechadas por el usuario.
  - Se evita convertir primeras cotizaciones, saltos largos o aportaciones importadas en rentabilidades y drawdowns falsos.
  - Se reconcilian importes duplicados conservando las fechas y se añaden pruebas deterministas de una cartera diversificada a cinco años.
- Resumen:
  - El dashboard muestra métricas comparables y honestas: cuando no existe una valoración cercana, el periodo queda como N/D en lugar de reutilizar una base antigua.
- Archivos:
  - `src/services/portfolioPerformance.ts`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.css`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `src/components/dashboard/PortfolioBenchmark.tsx`
  - `scripts/test-portfolio-performance.ts`
  - `package.json`
  - `package-lock.json`
  - `src/constants/app.ts`

### 2026-09-11 - v5.0.5 - Benchmark, histórico y acciones flotantes
- Funcionalidad:
  - Se corrigen las etiquetas duplicadas del benchmark y se simplifica el nombre visible de MSCI World.
  - La evolución de la cartera respeta la fecha de operación introducida y alinea Sharpe, Sortino, volatilidad y drawdown con el cálculo mensual del Portfolio.
  - Se mueve la actualización manual de precios a una acción flotante sobre el botón de añadir inversión.
- Resumen:
  - La analítica avanzada refleja mejor el histórico real de la cartera y mantiene las acciones principales accesibles en móvil.
- Archivos:
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/services/portfolioPerformance.ts`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/pages/Dashboard/Dashboard.css`
  - `src/components/dashboard/LivePortfolioPlan.tsx`
  - `package.json`
  - `src/constants/app.ts`

### 2026-09-11 - v5.0.4 - Versión visible de producción
- Funcionalidad:
  - Se alinea la versión visible de la aplicación con el paquete y la release publicada.
- Resumen:
  - La navegación, ajustes y novedades muestran ahora la versión real desplegada.
- Archivos:
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-09-11 - v5.0.3 - Dashboard consolidado y analítica viva
- Funcionalidad:
  - Se unifican las métricas de evolución, riesgo, asignación, benchmark y controles en una única analítica avanzada del dashboard.
  - Se corrige la cobertura de cotizaciones antiguas, se sincroniza la analítica con cada snapshot y se muestra la cartera junto al benchmark cuando hay fechas coincidentes.
  - El mapa de calor permite abrir el detalle del activo y el desglose de fondos mantiene estados claros cuando no hay posiciones disponibles.
- Resumen:
  - El dashboard reduce tarjetas repetidas sin perder las lecturas del portfolio y ofrece una vista más coherente en escritorio y móvil.
- Archivos:
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.css`
  - `src/components/dashboard/PortfolioComposition.tsx`
  - `src/components/charts/Heatmap.tsx`
  - `src/components/dashboard/PortfolioHealth.tsx`
  - `src/components/dashboard/PortfolioAnalytics.tsx`

### 2026-09-11 - v5.0.2 - Refresco persistente y acciones móviles
- Funcionalidad:
  - Se reduce el ciclo de actualización automática a un minuto y se conserva la última cotización al volver desde segundo plano.
  - Se evita lanzar una actualización duplicada si la cartera aún tiene cotizaciones vigentes.
  - Se coloca `Mis Activos` junto al resumen y se sustituye el botón superior de añadir por una acción flotante inferior.
- Resumen:
  - La aplicación retoma el seguimiento de la cartera sin reiniciar innecesariamente el temporizador al volver al móvil.
- Archivos:
  - `src/constants/app.ts`
  - `src/context/PortfolioContext.tsx`
  - `src/pages/Dashboard/`

### 2026-09-11 - v5.0.1 - Dashboard: lectura visual del Excel
- Funcionalidad:
  - Se añade una lectura tabulada del Excel en el dashboard con evolución, comparativa contra MSCI World, asignación por categorías y buckets, mapa de riesgo mensual y controles importados.
  - Se sincronizan objetivos, movimientos, estadísticas avanzadas y fecha de importación en una misma vista compacta.
  - Se elimina la variación aleatoria del desglose interno de fondos para que la visualización sea reproducible.
- Resumen:
  - El dashboard mantiene el seguimiento automático de precios y ahora permite consultar también las series históricas y controles del portfolio sin saltar de sección.
- Archivos:
  - `src/components/dashboard/PortfolioExcelInsights.tsx`
  - `src/components/dashboard/PortfolioExcelInsights.css`
  - `src/components/dashboard/PortfolioComposition.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`

### 2026-09-11 - v5.0.0 - Dashboard de cartera autónomo y detalle completo de fondos
- Funcionalidad:
  - Se recuperan las cotizaciones de acciones en producción mediante rutas proxy propias y se protege la búsqueda frente a respuestas tardías.
  - El detalle de fondos carga el histórico real de la clase localizada por ISIN, amplía la ficha con costes, rentabilidades, estadísticas, composición y política de inversión, y evita desbordamientos laterales.
  - Se separan la planificación, el resumen mensual y los últimos movimientos en tarjetas independientes.
  - Se añaden asignación objetivo, propuesta de aportaciones, controles de calidad, Sharpe, Sortino, mejores y peores meses y comparación automática con MSCI World mediante URTH.
- Resumen:
  - El dashboard incorpora los principales controles del Excel y los recalcula con las operaciones y cotizaciones guardadas, sin confundir aportaciones o retiradas con rentabilidad.
- Archivos:
  - `src/components/dashboard/`
  - `src/components/ui/Modal/Modal.css`
  - `src/context/PortfolioContext.tsx`
  - `src/pages/AddInvestment/AddInvestment.tsx`
  - `src/pages/Dashboard/Dashboard.tsx`
  - `src/services/apiService.ts`
  - `src/services/market/marketConfig.ts`
  - `src/services/portfolioPerformance.ts`
  - `vercel.json`

### 2026-09-11 - v4.0.0 - Portfolio conectado y seguimiento avanzado
- Funcionalidad:
  - Se amplía la importación del Excel para leer movimientos, objetivos, controles y datos diarios, incluyendo una plantilla demo con valores mockeados.
  - Se incorporan al dashboard el estado de la cartera, analítica de rentabilidad, control de concentración, movimientos y objetivos.
  - Se mejora el detalle de acciones y fondos con cotizaciones actualizadas, históricos de precio/participación, periodos seleccionables y medición de mejora o drawdown entre dos puntos.
  - Se robustece la búsqueda de activos, la normalización de cotizaciones a euros y la selección de sugerencias al añadir una inversión.
- Resumen:
  - La versión `v4.0.0` convierte el portfolio basado en Excel en un panel de seguimiento más completo y resistente, manteniendo el Excel como fuente de importación y permitiendo avanzar hacia una cartera actualizada automáticamente.
- Archivos:
  - `public/plantilla-portfolio.xlsx`
  - `src/components/dashboard/`
  - `src/components/charts/PortfolioChart.tsx`
  - `src/context/PortfolioContext.tsx`
  - `src/pages/AddInvestment/`
  - `src/pages/Dashboard/`
  - `src/pages/PortfolioCsv/`
  - `src/services/apiService.ts`
  - `src/services/portfolioQuoteService.ts`
  - `src/services/market/`
  - `src/types/`
  - `src/constants/app.ts`
  - `package.json`
  - `package-lock.json`

### 2026-08-30 - v3.10.1 - Refinamiento del panel editorial
- Funcionalidad:
  - Se homogeneiza la cabecera pública de Noticias con el patrón visual de Portfolio.
  - Se añade edición explícita de artículos existentes desde el panel editorial.
  - Se incorpora una vista previa antes de guardar o publicar una noticia.
  - Se simplifica la descripción del equipo editorial y se mejora el diagnóstico de errores de invitación.
- Resumen:
  - La versión `v3.10.1` pule el flujo editorial para revisar, editar y publicar noticias con mayor claridad.
- Archivos:
  - `src/constants/app.ts`
  - `src/pages/News/News.tsx`
  - `src/pages/News/News.css`
  - `src/pages/NewsAdmin/NewsAdmin.tsx`
  - `src/pages/NewsAdmin/NewsAdmin.css`
  - `src/services/newsService.ts`
  - `README.md`

### 2026-08-29 - v3.10.0 - Noticias editoriales privadas
- Funcionalidad:
  - Se incorpora la sección pública `/news` con listado y páginas individuales por slug.
  - Se añade el panel editorial privado `/admin/news` con Supabase Auth, borradores, publicación y borrado.
  - Se integra un editor WYSIWYG con formato enriquecido, enlaces seguros, sanitización HTML y tamaños de letra.
  - Se protege la edición con RLS y roles de propietario/editor, incluyendo invitaciones por correo y revocación de acceso.
  - Se añaden avisos flotantes temporales y redirección al listado después de publicar.
- Resumen:
  - La versión `v3.10.0` permite publicar análisis editoriales desde la SPA manteniendo el contenido compartido en Supabase y el acceso de edición restringido.
- Archivos:
  - `src/pages/News/News.tsx`
  - `src/pages/News/News.css`
  - `src/pages/NewsAdmin/NewsAdmin.tsx`
  - `src/pages/NewsAdmin/NewsAdmin.css`
  - `src/components/news/RichTextEditor/RichTextEditor.tsx`
  - `src/components/news/RichTextEditor/RichTextEditor.css`
  - `src/components/ui/Input/Input.tsx`
  - `src/services/newsService.ts`
  - `src/types/news.ts`
  - `src/utils/newsContent.ts`
  - `supabase/news-schema.sql`
  - `supabase/functions/invite-news-editor/index.ts`
  - `package.json`
  - `package-lock.json`
  - `README.md`
  - `FEATURE_LOG.md`

### 2026-08-29 - Noticias editoriales con panel privado
- Funcionalidad:
  - Se añade una sección pública de Noticias con listado y páginas individuales por slug.
  - Se incorpora un panel editorial privado con autenticación, borradores, publicación y borrado.
  - Se añade un editor WYSIWYG ligero para títulos, formato, listas, citas, enlaces y código.
  - Se integra Supabase mediante REST/Auth y se incluye el esquema SQL con RLS para limitar la edición al administrador.
- Resumen:
  - FreeWallet puede publicar análisis editoriales desde la propia SPA sin mantener un backend Node separado.
- Archivos:
  - `src/pages/News/News.tsx`
  - `src/pages/News/News.css`
  - `src/pages/NewsAdmin/NewsAdmin.tsx`
  - `src/pages/NewsAdmin/NewsAdmin.css`
  - `src/components/news/RichTextEditor/RichTextEditor.tsx`
  - `src/services/newsService.ts`
  - `src/utils/newsContent.ts`
  - `supabase/news-schema.sql`
  - `.env.example`
  - `README.md`

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
