# Inventario de la migración de módulos a Tailwind

La tercera fase conserva los selectores y consultas de medios de los módulos densos, y compila su presentación con `@apply` y `@reference` a `src/styles/module-theme.css`. Los patrones `ui-row`, `ui-stack`, `ui-panel`, `ui-surface` y `ui-control` comparten estructura y tokens. Los rellenos `ui-fill-*` y bordes `ui-border*` conservan los shorthands originales.

Las tarjetas de calculadora, avisos flotantes, estados de ruta y pantalla 404 pasan a utilidades en React y retiran sus cuatro CSS. La tabla registra las hojas que conservaba la tercera fase y usaban `@apply`; no afirma que todas sus propiedades sean utilidades ni que se hayan eliminado todos los CSS.

| Módulo | Hojas con referencia | Declaraciones sustituidas | Bloques `@apply` |
| --- | ---: | ---: | ---: |
| `src/components/academy/assets` | 1 | 933 | 385 |
| `src/components/academy/calculators` | 11 | 2009 | 832 |
| `src/components/academy/guides` | 11 | 1489 | 614 |
| `src/components/academy/layout` | 2 | 35 | 18 |
| `src/components/academy/simulators` | 5 | 1208 | 498 |
| `src/components/academy/tools` | 1 | 242 | 90 |
| `src/components/charts` | 3 | 187 | 69 |
| `src/components/dashboard` | 14 | 1546 | 579 |
| `src/components/expenses` | 1 | 644 | 253 |
| `src/components/layout` | 2 | 168 | 70 |
| `src/components/news` | 1 | 149 | 70 |
| `src/components/ui` | 4 | 65 | 20 |
| `src/pages/AddInvestment` | 1 | 235 | 85 |
| `src/pages/Dashboard` | 1 | 171 | 66 |
| `src/pages/FeatureLog` | 1 | 87 | 36 |
| `src/pages/Planning` | 1 | 79 | 29 |
| `src/pages/PortfolioCsv` | 1 | 405 | 147 |
| `src/pages/Settings` | 1 | 176 | 63 |
| `src/pages/TermsAndConditions` | 1 | 60 | 27 |
| `src/pages/Transactions` | 1 | 76 | 33 |
| **Total** | **64** | **9964** | **3984** |

## CSS específico que se conserva

- `src/index.css`: reset, variables globales y compatibilidad de formularios.
- `src/styles/liquidGlass.css`: materiales ópticos, gradientes y ajustes de apariencia.
- `src/styles/tailwind.css` y `src/styles/module-theme.css`: configuración, tokens y utilidades compartidas.
- `src/components/news/newsContent.css`: tipografía de HTML enriquecido y animación del aviso de Noticias.
- `src/components/academy/simulators/FundRadar.css`: pseudoelementos del medidor nativo.
- Dentro de las hojas con `@apply`, se conservan reglas que lo requieren: selectores de editor/gráficos, animaciones, transformaciones, sombras, tipografía contextual, pseudoelementos y propiedades personalizadas.

## Criterios de equivalencia

Se compararon los selectores, condiciones y declaraciones del CSS anterior con el compilado de las 68 hojas preparadas, antes de retirar cuatro de ellas. La comparación conserva los valores y la precedencia de shorthands y longhands; no depende del orden de propiedades independientes ni de la unión de reglas adyacentes. No detectó diferencias en ese contrato. Se desactivaron los polyfills de la API de compilación en esa comparación para poder contrastar las declaraciones originales; el build normal conserva la compatibilidad de Tailwind.

Las capturas y medidas de rutas complementan esta comprobación. Los tests funcionales siguen comprobando los cálculos financieros, importaciones, formularios, permisos y operaciones.

El recorrido de producción pasó las 41 rutas y sus 492 combinaciones de tamaño/apariencia, sin desbordamientos horizontales. La referencia anterior registra 82 combinaciones de móvil/escritorio. Al contrastar 4.497 elementos coincidentes no hubo diferencias en las propiedades medidas: disposición, columnas, tipografía, relleno, separación, radios, colores, bordes y altura mínima. Esta medición no se presenta como una comparación píxel a píxel de todos los estados interactivos.

## Actualización de la cuarta fase

Se retiran otros siete archivos: `ScenarioComparison.css`, `Performers.css`, `DashboardInfo.css`, `AccountConnectionState.css`, `LocalPortfolioPrompt.css`, `PendingChangesGuard.css` y `VersionNotice.css`. Sus componentes usan utilidades en React. `DefinitionList` comparte las listas de escenarios y detalles del plan; `LivePortfolioPlan.css` retira las cuatro reglas correspondientes. Quedan 57 hojas de módulos con `@reference`, además del CSS específico descrito arriba. Las cifras de la tabla anterior son el registro de la tercera fase.

## Actualización de la quinta fase

El catálogo y las calculadoras de emergencia, impacto fiscal e inflación pasan a componentes y recetas en React. Se retiran `Calculators.css`, `EmergencyFundCalculator.css` y `TaxSimulator.css`; `InflationPredator.css` conserva solo la animación `float`. Los campos, superficies, métricas y tarjetas se reutilizan sin trasladar las fórmulas a los componentes de presentación. Quedan 53 hojas de módulos con `@reference`, además del CSS específico, incluida esa animación.


## Actualización de la sexta fase

Interés compuesto, FIRE y jubilación reutilizan 19 campos y nueve tarjetas de resultados mediante componentes React con estructura y estilos propios. Se retiran 26 reglas de sus hojas locales. No se retiran hojas completas: se mantienen 53 módulos con `@reference`, con la disposición y los gráficos específicos separados de los componentes de presentación.


## Actualización de la séptima fase

Bonos, IRPF/sueldo neto y ficha de fondos usan componentes que encapsulan estructura y estilos para controles, paneles, desplegables, resultados, tablas, distribuciones y documentación. Sus CSS locales suman 671 líneas frente a 962 antes de esta fase. Se mantienen las 53 hojas de módulos con `@reference`: continúan conteniendo el diseño de página y los elementos específicos.


## Actualización de la octava fase

El Dashboard comparte nueve componentes de interfaz con marcado y utilidades Tailwind. Se retiran `PortfolioSummary.css` y `PortfolioDataQuality.css`; sus estilos se componen en React. Las hojas del Dashboard pasan de 1.804 a 1.457 líneas, incluida su página principal. Quedan 51 hojas con `@reference`; se mantienen estilos específicos de tablas, gráficos y disposición.


## Actualización de la novena fase

Academia y los simuladores componen superficies, tarjetas enlazadas, rejillas, secciones con título, indicadores, campos y vídeos mediante siete componentes en `src/components/academy/ui`. Se reutilizan en 20 módulos. El CSS total de `src` pasa de 14.974 a 14.791 líneas (183 menos); se mantienen 58 archivos CSS y 51 hojas con `@reference`. Los selectores contextuales de los módulos conservan adaptaciones móviles, materiales Liquid Glass y elementos específicos.


## Actualización de la décima fase

Gestión de gastos comparte catorce componentes de interfaz en diez archivos de `src/components/expenses/ui`. Se aplican a la pantalla principal, edición e importación. Su hoja local pasa de 298 a 254 líneas (28.980 a 23.525 bytes de fuente); conserva materiales, gráficos, tablas y estilos contextuales. El total de `src` queda en 14.747 líneas y 58 archivos CSS; se mantienen 51 módulos con `@reference`.


### Piezas compartidas entre pantallas

Planificación, Operaciones, Portfolio CSV, Añadir activo y mapa de calor incorporan componentes comunes de `src/components/ui`: indicadores con variantes, cabeceras compactas, campos y ayudas. Las calculadoras reutilizan los mismos indicadores y campos; las tablas de ficha de fondos e IRPF comparten `DataTable` con movimientos e importación de gastos. Las cinco guías de activos componen sus pasos numerados y avisos mediante `AcademyStepCard` y `AcademyCallout`. Se conservan los hooks de estilos necesarios para materiales y ajustes contextuales. Quedan 14.557 líneas en 58 hojas CSS (36,02 % menos frente al inicio).


### Tarjetas educativas y estilos antiguos del simulador

Fundamentos compone sus tarjetas de progreso, checklists, catálogo y accesos mediante `AcademyProgressCard`, `AcademyLearningLink` y `AcademyRouteLink`. Sus indicadores utilizan `DataItem`. Las cinco guías de activos utilizan `AcademyListCard` para ventajas, riesgos y comparativas; renta variable utiliza además `AcademyExplainerCard`. El simulador conserva sus estilos actuales y retira 84 selectores de la interfaz anterior sin referencias en los módulos actuales. Quedan 13.762 líneas en 58 hojas CSS, un 39,52 % menos respecto al inicio.


### Portfolio y estados de Operaciones

Portfolio utiliza `PortfolioPanel` y `PortfolioButton` para tarjetas de análisis y acciones, y `DataItem` para sus indicadores, estadísticas, flujos y datos diarios. `StatusPill` comparte sus estados de control con los distintivos de Operaciones. Se conservan los materiales Liquid Glass, gráficos y tablas específicas. El total queda en 13.621 líneas en 58 hojas CSS: 40,14 % menos frente al inicio.
