# Migración progresiva a Tailwind

La primera fase integra Tailwind CSS 4 con Vite y migra `Button`, `Card`, `Input`, `MetricCard`, `Modal`, `PageHeader` y Mi cuenta. La segunda amplía la migración a Noticias y el radar de fondos. La tercera incorpora Academia, herramientas, Dashboard, gastos, navegación y demás pantallas mediante componentes compartidos y CSS de módulos compilado con Tailwind. No cambia el modelo de datos, las operaciones financieras ni las llamadas de autenticación.

## Convivencia y temas

- `src/styles/tailwind.css` importa tema y utilidades, **sin Preflight**: el reset existente sigue en `src/index.css`.
- Las utilidades llevan el prefijo `tw:`. No colisionan con clases existentes como `text-muted` o `font-medium`.
- Las utilidades quedan sin capa mientras el CSS antiguo siga sin capa. Esto evita que la prioridad de las capas inutilice las utilidades durante la transición; los selectores propios de los módulos pueden seguir refinando sus componentes. No se activa `important` global.
- Los alias de `@theme inline` de `module-theme.css` leen las variables existentes en cada elemento. Colores, bordes, sombras, radios y espaciados responden al tema claro/oscuro, al modo estándar/Liquid Glass y al tamaño de pantalla.
- `dark:` usa `data-theme`, y `glass:` usa `data-appearance`. Ambas preferencias siguen siendo independientes.
- Las animaciones específicas permanecen en CSS, respetando movimiento reducido. El antiguo `spin` se conserva en el reset para las pantallas todavía no migradas.

## Componentes y composición

```tsx
import { Button, Card, Input, ActionGroup } from '../components/ui';

<Card className="tw:p-4">
    <Input label="Nombre" hint="Una explicación breve" />
    <ActionGroup stackOnMobile>
        <Button variant="secondary" type="button">Cancelar</Button>
        <Button>Guardar</Button>
    </ActionGroup>
</Card>
```

`cn()` combina clases con `clsx` y `tailwind-merge`, configurado con el prefijo y los tokens propios. El `className` del consumidor se pasa al final para sobrescribir valores base, incluyendo los espaciados `ui-*`. Los nombres completos de las utilidades deben aparecer en el código: no construir `tw:bg-${color}` dinámicamente. Las variantes usan mapas estáticos.

`Button` mantiene variantes, tamaños, iconos, estado desactivado y carga. Durante la carga conserva su tamaño y nombre accesible, muestra un indicador visible y expone `aria-busy`. Los enlaces reales usan `buttonStyles()`; no se anidan enlaces y botones.

`Input` enlaza etiqueta, ayuda y error mediante identificadores estables y atributos ARIA. `density="comfortable"` conserva la presentación de Mi cuenta; el valor normal conserva la de los formularios existentes. `inputClassName` ajusta el campo y `className` su contenedor. Los selectores nativos que necesiten esa presentación pueden usar `inputStyles()`.

`Card` admite `div`, `section`, `article` o `form` mediante `as`. `ActionGroup` centraliza el espaciado y la disposición móvil de las acciones. `Modal` conserva portales, bloqueo de scroll, foco inicial, Tab/Escape, restauración del foco y altura estable para gráficos.

Mi cuenta compone estos elementos con `AccountPanel`, `AccountActions`, `AccountHelp`, `AccountHeading`, `AccountInset` y `AccountDetail`. Registro, acceso, recuperación, perfil, importación, exportación y autenticador mantienen sus flujos existentes.

## Compatibilidad durante la migración

Se mantienen los nombres de clases usados por Liquid Glass, las interacciones y las pruebas (`btn`, `card`, `modal`, etc.) como puntos de conexión. No son una segunda copia de los estilos retirados. No eliminarlos sin revisar también `AppearanceContext`, `liquidGlass.css` y los consumidores pendientes.

Los dos selectores de Añadir activo y el enlace del aviso de versión usan las recetas compartidas. Las tarjetas de fundamentales de `AssetDetail` mantienen sus estilos particulares, acotados a ese modal para que no modifiquen `MetricCard` en otras pantallas.

Se retiran siete archivos: los CSS de los seis componentes base y `Account.css`. Los módulos aún no migrados conservan sus estilos; no se ha completado una conversión de toda la aplicación.

## Segunda fase: Noticias y radar de fondos

Noticias migra su portada, tarjetas, artículo, comentarios, respuestas y panel editorial, incluida la gestión de portadas y colaboradores. Los mapas estáticos `newsStyles`, `newsAdminStyles` y `commentStyles` contienen las utilidades completas, conservando los nombres de clase que usan Liquid Glass y las pruebas. Se retiran `News.css`, `NewsAdmin.css` y `NewsComments.css`.

Los estilos de HTML enriquecido quedan en `newsContent.css`: el contenido editorial no se construye mediante componentes React. El editor Tiptap conserva su CSS específico. La animación del aviso también permanece en ese archivo. Se conservan el ancho completo y la proporción 16:9 de las portadas de la lista, con `object-fit: contain` para evitar recortar otros formatos.

El catálogo y el formulario de edición del radar comparten `radarStyles`, con filtros y campos basados en `inputStyles()`. Las consultas de contenedor mantienen el cambio de columnas según el espacio real disponible, incluido el modal de edición. `FundRadar.css` conserva únicamente el medidor nativo y sus pseudoelementos específicos de cada navegador. Las notas, fórmulas, fechas, permisos y consultas al proveedor mantienen su implementación.

Los tamaños de texto usan los tokens `--font-size-*` existentes: no se sustituyen por escalas de Tailwind de nombres parecidos que puedan tener otras medidas o interlineados.

En variantes arbitrarias que apuntan a clases BEM, los guiones bajos literales se escapan (`.card\_\_content`). Las recetas utilizan `String.raw` para que JavaScript y el escáner de Tailwind lean el mismo selector. Un guion bajo sin escapar representa un espacio en estas variantes. Las pruebas comprueban también el espaciado del acceso editorial y la jerarquía de las métricas del radar para detectar estas pérdidas de estilos.

Las nuevas dependencias tienen versiones fijadas y lockfile. Vite se actualiza de 7.3.6 a 7.3.7 para corregir los avisos de seguridad detectados por la auditoría durante esta entrega. `tailwind-merge` añade código al cliente: el bundle inicial medido pasa de unos 618 a 651 kB, dentro del límite de 700 kB comprobado por el proyecto. Esta fase busca reducir duplicación y facilitar el mantenimiento; no afirma una mejora de rendimiento por instalar Tailwind.

## Tercera fase: módulos restantes

Las 64 hojas de módulos conservadas usan `@reference` a `module-theme.css` y comparten 9.964 declaraciones mediante utilidades `@apply`. El [inventario por módulo](tailwind-module-inventory.md) detalla su cobertura y el CSS específico conservado. Las tarjetas de calculadora, los avisos flotantes, los estados de carga/error y la pantalla 404 pasan a utilidades en React y retiran otros cuatro CSS.

```css
@reference "../../../styles/module-theme.css";

.module__summary {
    @apply tw:ui-row tw:gap-ui-md tw:p-[1rem] tw:ui-border-default;
    line-height: 1.4;
}
```

La ruta de referencia se resuelve desde cada hoja. Este patrón permite migrar las tablas, gráficos, modales y selectores de editor conservando su especificidad y sus consultas de medios. Los componentes React nuevos reutilizan la base compartida y utilidades directas; `@apply` mantiene las integraciones cuyo comportamiento depende de la cascada existente.

`module-theme.css` contiene los tokens y patrones compartidos, sin las animaciones predeterminadas de Tailwind. Los módulos pueden aplicar sus utilidades sin que una animación histórica llamada `bounce` o `spin` incorpore keyframes de otro tema. El tema completo y las animaciones `ui-*` siguen disponibles en `tailwind.css` para React.

Los shorthands se conservan como tales: `ui-fill-*` usa `background`, y `ui-border*` usa `border`. Sustituirlos solo por `background-color` o `border-width` dejaría imágenes o estilos anteriores activos. Las alturas y medidas originalmente expresadas en píxeles mantienen esa unidad. La tipografía contextual, las sombras, los efectos ópticos y las reglas específicas de editor/gráficos conservan CSS cuando hace falta para mantener sus efectos y su herencia.

Los tests estructurales de tablas y desglose inspeccionan el CSS compilado con `compileModuleStyles()`, de modo que siguen comprobando sus reglas sin depender de cómo se escriba un `@apply`.

## Comprobaciones

```bash
npm run lint
npm run typecheck
SKIP_PRERENDER=1 npm run build
npm run test:unit
npm run test:build
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium npm run test:smoke
```

`test-tailwind-foundation-ui.ts` captura Mi cuenta y una galería de componentes a 320, 390 y 1280 px con las cuatro combinaciones de tema y apariencia. Comprueba desbordamientos, sobrescritura del relleno, ayuda/error accesibles, foco de teclado, carga, estados desactivados, enlaces con apariencia de botón y navegación de teclado del modal. Cuando Chromium sin interfaz declara que no tiene dispositivo de hover, la prueba habilita esa condición de medios en su página aislada para comprobar los selectores y declaraciones reales. La galería está en `scripts/fixtures`, se importa expresamente desde la prueba y no añade una ruta ni un import al producto.

Los recorridos existentes comprueban además usuario/correo, registro, errores y recuperación, cambio de nombre, altas/bajas del autenticador y lectura del QR en cada tema. Las pruebas de otros módulos verifican consumidores de los componentes compartidos. Utilizan sesiones y respuestas sintéticas; no operan con cuentas reales.

Validación de la primera fase: 64 comprobaciones de lógica e integración y 15 suites de navegador verificadas, además de lint, TypeScript, build y presupuesto del bundle. La pasada general de navegador detectó tres fallos; tras corregirlos se repitieron esas suites y las afectadas por los últimos ajustes. Todos sus resultados finales pasan. La instalación limpia con el lockfile también pasa y la auditoría de dependencias informa de cero vulnerabilidades conocidas en la fecha de entrega.

Validación de la segunda fase: pasan las cuatro suites de navegador de Noticias/comentarios, edición de artículos, radar y base compartida. Incluyen vistas de 320 a 1920 px, claro/oscuro y estándar/Liquid Glass, permisos, respuestas, imágenes, edición y conflictos. También pasan las pruebas de lógica de imágenes, comentarios y notas por categoría, lint, TypeScript y build. El control de carga mantiene el JavaScript inicial en 651,40 kB y confirma que el editor y las calculadoras siguen fuera del arranque.

Para repetir solo la galería con un servidor aislado:

```bash
npm run test:smoke -- --only=test-tailwind-foundation-ui.ts
```

## Validación de módulos y mantenimiento

`npm run test:tailwind-modules-ui` comprueba la compilación de producción y requiere ejecutar antes `SKIP_PRERENDER=1 npm run build`. Recorre 41 rutas con anchos de 320, 390 y 1280 px, y las cuatro combinaciones de tema/apariencia: 492 combinaciones. Captura nueve pantallas representativas y guarda sus medidas en `/tmp/freewallet-tailwind-modules-after`. La referencia local anterior registra móvil y escritorio por ruta. El recorrido bloquea peticiones a proveedores, incluidos los proxies locales.

Los recorridos funcionales de `test:smoke` conservan Vite dev porque algunos fixtures importan servicios de `/src`. Cada servidor de prueba tiene su propia caché de prebundles, lo que permite aislar las referencias de otros worktrees. La CI ejecuta lógica/build, recorridos funcionales y la auditoría de rutas en grupos separados; el job final `verify` comprueba que todos terminen correctamente.

El CSS específico conservado se enumera en el inventario. Las futuras mejoras pueden pasar más composición a React cuando aporten claridad, reutilizando los mismos tokens. Cada modificación debe comprobar móvil/escritorio, las cuatro apariencias y los flujos afectados.

Validación de la tercera fase: pasan las 64 comprobaciones únicas de lógica e integración y las 16 suites funcionales de navegador. La prueba de histórico estructurado superó el límite de tiempo al compartir recursos con el navegador; su repetición aislada pasó. También pasan lint, TypeScript incluido en el build, compilación de producción y presupuesto del bundle (652,83 kB de JavaScript inicial). El recorrido adicional pasa las 41 rutas y 492 combinaciones de tamaño/apariencia. La comparación con la referencia anterior de 82 combinaciones no encuentra diferencias en las propiedades medidas de 4.497 elementos coincidentes.

## Cuarta fase: composición de detalles y avisos

`DefinitionList` comparte la estructura semántica `dl > div > dt + dd` entre los resultados/parámetros guardados en `ScenarioComparison` y los detalles móviles de `LivePortfolioPlan`. Las variantes `stacked` e `inline` conservan sus respectivas distribuciones; los valores se siguen calculando y formateando en los consumidores. El componente acepta atributos nativos de `dl` y contenido React en cada valor.

`Performers` utiliza recetas de presentación comunes a mejores y peores activos. La ayuda del Dashboard y los avisos de conexión, cartera local, cambios pendientes y versión pasan a utilidades en React; el aviso de versión reutiliza `ActionGroup`. Se eliminan siete CSS de componentes y las cuatro reglas de listas repetidas en el plan, manteniendo los hooks que usan las pruebas y los estilos de apariencia. No se cambian cálculos, sincronización ni permisos.

La suite existente de usabilidad de calculadoras puede repetirse con servidor aislado mediante `npm run test:smoke -- --only=test-calculator-dashboard-usability.ts`. Su fixture del selector de benchmark explicita el modo MSCI y alimenta el histórico Fidelity con la función real `dailyHistory`; la expectativa sobre los NAV utilizados se mantiene. La ejecución de Chromium utiliza las mismas opciones de contenedor que las demás suites.

Validación de la cuarta fase: pasan lint, TypeScript, build de producción y presupuesto de carga (654,47 kB de JavaScript inicial). Pasan las cinco suites de navegador seleccionadas: usabilidad de calculadoras, feedback de cuenta, auditoría de aplicación, calidad del Dashboard y Portfolio/importación. Cubren escenarios inmutables, listas móviles del plan, ayudas, conexión, gastos pendientes e importación de cartera local. Se revisaron además las capturas de escenarios y detalles del plan.

## Quinta fase: primeras calculadoras

El catálogo, el fondo de emergencia, el simulador de impacto fiscal y el de inflación usan composición React y recetas estáticas Tailwind. `CalculatorTile` comparte la estructura de las ocho tarjetas del catálogo; `CalculatorPanel` conserva las superficies y sus variantes; `CalculatorMetric` comparte las etiquetas y resultados. `CalculatorField` agrupa doce controles con etiqueta, icono, unidad y contenido adicional, manteniendo en el consumidor el control nativo, su valor, límites y callback. Las etiquetas fiscales quedan asociadas mediante `htmlFor`/`id`, y el deslizador recibe nombre accesible.

Las recetas usan `String.raw` para preservar los guiones bajos literales en selectores BEM. Conservan media queries inclusivas, estados y selectores contextuales. La animación óptica de inflación sigue en un CSS pequeño. Los estilos globales `calc__*` se mantienen por compatibilidad con las calculadoras que todavía no usan el nuevo campo.

`CalculatorPanel` conserva los hooks de sus consumidores. Se mantiene separado del anterior `CalculatorCard` porque este último tiene ajustes ópticos Liquid Glass propios: sustituir uno por otro indiscriminadamente cambiaría la apariencia.

Para comprobar solo estas pantallas sobre un build de producción:

```bash
SKIP_PRERENDER=1 npm run build
FREEWALLET_VISUAL_ROUTES='/academy/calculators,/academy/emergency-fund,/academy/taxes,/academy/inflation-predator' npm run test:tailwind-modules-ui
```

El filtro solo admite rutas existentes y rechaza listas vacías. Sin filtro, la auditoría de CI mantiene sus 41 rutas. Las comprobaciones funcionales de la suite de usabilidad incluyen navegación del catálogo, métricas fiscales al cambiar ganancias, persistencia, entradas vacías y activación de la visualización de inflación.

La centralización de utilidades cambia la distribución del CSS: el archivo inicial pasa de 138,64 kB (22,40 kB gzip) a 158,20 kB (26,12 kB gzip) en esta fase. La reducción de hojas y líneas de CSS fuente mide organización y reutilización; no implica una reducción del CSS inicial descargado. El JavaScript inicial queda en 654,39 kB y conserva la carga diferida de calculadoras.

Validación de la quinta fase: pasan lint, TypeScript, build, presupuesto de carga y la prueba de integridad de calculadoras. La auditoría de producción pasa 48 combinaciones (cuatro rutas, tres anchos y cuatro apariencias). La comparación anterior/posterior de 32 combinaciones no encuentra diferencias en las propiedades medidas de 2.896 elementos; se revisaron las capturas. Las 67 sentencias de lógica y almacenamiento comparadas antes del render permanecen iguales. La suite de usabilidad ampliada pasa: cubre navegación, impuestos progresivos, persistencia, campos vacíos y la visualización activa de inflación. Su primer arranque en Vite agotó la navegación de 30 segundos; con los 60 segundos usados por otras suites pasa en 224 segundos.


## Sexta fase: campos y tarjetas como componentes completos

Interés compuesto, FIRE y jubilación componen 19 campos con `CalculatorField`: cada uso aporta el control nativo, mientras el componente es responsable de la etiqueta, el icono, la unidad, el marco y los estilos Tailwind. El contenido posterior mantiene deslizadores y explicaciones condicionales en su posición original. Los grupos de opciones conservan su estructura específica.

`CalculatorResultCard` comparte el marcado y la presentación de nueve resultados. Sus variantes `investment`, `centered` e `icon` conservan las distribuciones existentes; recibe valores ya calculados y formateados. Los colores de énfasis usan clases Tailwind estáticas. Las clases de los slots mantienen la compatibilidad con selectores existentes, y la variante con icono reutiliza `CalculatorCard` para conservar su comportamiento Liquid Glass. Ninguna fórmula ni almacenamiento pertenece al componente de presentación.

Se retiran 26 reglas de resultados de las tres hojas locales, incluidas las variantes y la tipografía móvil. Esas hojas conservan la disposición, los gráficos y los elementos propios de cada calculadora. Esta fase elimina duplicación de estructura además de estilos; no pretende convertir indiscriminadamente cada bloque CSS en una cadena de utilidades.


La comparación del código anterior confirma que permanecen iguales las sentencias de cálculo y almacenamiento de las tres herramientas, así como las propiedades de sus 28 controles nativos (incluidos los grupos de opciones). Pasan la prueba de integridad financiera y la suite de usabilidad: resultados de interés compuesto con retiradas, escenarios inmutables, entradas vacías, persistencia y controles en móvil/escritorio. La suite se ejecuta con `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` en este entorno, que dispone de Chromium del sistema.


Validación final: pasan ESLint de los cuatro componentes afectados, TypeScript, build de producción y presupuesto de carga (654,46 kB de JavaScript inicial). La auditoría de producción pasa 36 combinaciones: tres rutas, tres anchos y las cuatro combinaciones de tema/apariencia. No hay errores de ejecución ni desbordamiento horizontal; se comprueban además los bordes de énfasis en los tres anchos. Se revisó la captura móvil de jubilación en Liquid Glass. La suite de usabilidad pasa en 163,5 segundos.


## Séptima fase: bonos, sueldo neto y ficha de fondos

Las tres herramientas pasan a componer partes completas de interfaz. `CalculatorField` mantiene su apariencia anterior y añade una variante de nómina: `NumericField` y `SelectField` conservan localmente los identificadores, los controles nativos, la validación y sus callbacks. `CalculatorCheckbox` comparte las casillas. `CalculatorPanel` añade superficies y bordes para las secciones de IRPF y los paneles de la ficha, conservando sus respectivos materiales.

`CalculatorDisclosure` utiliza `details`/`summary` nativos, con variantes de formulario y detalle sencillo, sin sustituir la interacción de teclado por un manejador propio. `CalculatorHeroMetric` comparte el resultado principal de YTM y sueldo neto y conserva sus dos apariencias. `CalculatorDataItem` compone los siete resultados secundarios de bonos y los datos, métricas y comisiones de fondos. `CalculatorSection` organiza las secciones de la ficha y `CalculatorEducationCard` las tres explicaciones de bonos.

`CalculatorTable` comparte la estructura y el estilo de las tablas: las estadísticas de fondos caben en móvil; las tablas de nómina conservan el desplazamiento nativo. `CalculatorAllocationCard` muestra las distribuciones de fondos con barras limitadas a 0–100 %; el dato numérico y su formato siguen viniendo de la ficha. `CalculatorDocumentLink` comparte el marcado y los estilos de los documentos externos.

Las hojas de bonos, IRPF y fondos pasan conjuntamente de 962 a 671 líneas (291 menos). Conservan distribución, selectores específicos, ajustes contextuales, animación de carga y ayuda de riesgo. No se eliminan hojas completas ni se presenta esta reducción de fuente como una mejora del tamaño descargado.

La nueva prueba `npm run test:fund-information-ui` usa respuestas sintéticas de Finect a través del flujo real de búsqueda y normalización. Comprueba la clase por ISIN, NAV, rentabilidades y comisiones de valor cero, ausencia de datos, estadísticas, composición, documentos y errores de consulta; recorre cuatro anchos y cuatro combinaciones de tema/apariencia. Se añade al conjunto de pruebas de navegador habitual.


Validación de esta fase: pasan ESLint de los módulos y pruebas modificados, TypeScript, compilación de producción y presupuesto de carga (654,61 kB de JavaScript inicial). Pasan las pruebas financieras de bonos, nómina y Finect, incluida la verificación independiente Decimal del calendario, cupón corrido y YTM de CoreWeave, y la integridad de las demás calculadoras. Las pruebas de navegador de bonos, IRPF y ficha de fondos pasan; la auditoría de producción cubre 36 combinaciones de las tres rutas sin errores de ejecución ni desbordamientos.

La referencia de la ficha anterior se obtuvo en un checkout separado del commit previo, con las mismas respuestas Finect simuladas. Al comparar las propiedades medidas de 2.688 elementos en 16 combinaciones de ancho/tema/apariencia no se detectan diferencias. Esto complementa las capturas y las pruebas de comportamiento; no se presenta como una comparación píxel a píxel. Se revisaron también las capturas móviles de sueldo neto y ficha de fondos.


## Octava fase: composición del Dashboard

Los componentes en `src/components/dashboard/ui` encapsulan marcado y estilos Tailwind. `DashboardMetric` recibe datos ya formateados y conserva las distribuciones de indicadores, valores de posiciones y estadísticas. `DashboardPanel` comparte las superficies interiores sin introducir el material de `Card`. `DashboardSegments` compone los botones del resumen, periodos, método de Benchmark, pestañas y gráfico de activo; los consumidores mantienen los cambios de estado, transiciones y manejadores de teclado.

`DashboardSwitch` conserva el botón con `aria-pressed` de composición y el checkbox nativo con rol `switch` de asignación/Benchmark. `DashboardFilterField` comparte los controles etiquetados de la tabla y `DashboardFormField` los seis campos del traspaso. `DashboardFundamentalCard` presenta las métricas ampliadas con sus categorías y fechas. `DashboardReviewRow` conserva las filas de corrección y `DashboardActions` las acciones flotantes con sus nombres accesibles y estados desactivados.

El resumen sigue utilizando el `MetricCard` existente. Se retiran `PortfolioSummary.css` y `PortfolioDataQuality.css`; los componentes afectados conservan sus hooks para pruebas y materiales de apariencia. El CSS del Dashboard, incluida su página principal, pasa de 1.804 a 1.457 líneas (347 menos). Las tablas, gráficos, distribución de página, animaciones y elementos específicos conservan CSS donde corresponde. La reducción de fuente no implica por sí sola una reducción del CSS descargado.

La referencia anterior se captura en un checkout separado del commit previo, con posiciones sintéticas y consultas externas bloqueadas. La comparación de 48 estados (cinco paneles y detalle de activo, dos anchos y cuatro combinaciones de tema/apariencia) coincide en las propiedades medidas de 31.520 elementos. Se ignora únicamente la clase transitoria del pulso de selección Liquid Glass; no se ocultan diferencias de propiedades. Esta comparación no sustituye una comparación píxel a píxel de todos los estados de la aplicación.

Se amplía la suite existente de calidad con navegación de pestañas por teclado y asociación del panel activo. El runner permite seleccionar también las suites existentes de métricas, desglose, resultados y traspasos sin añadirlas al conjunto predeterminado. La fixture de datos JSON completos de acciones incorpora una descripción empresarial: la aplicación ya consultaba HTML cuando faltaba esa descripción. La cotización simulada incluye su fecha de mercado para representar un dato reciente, y el contador distingue consultas de cotización e histórico. Se mantiene la comprobación de que una respuesta realmente completa no necesita ese fallback, se comprueba que su descripción aparece y que reintentar métricas no recarga el gráfico. La prueba corregida pasa también sobre el checkout anterior a la migración.


Validación final: pasan TypeScript, ESLint, compilación de producción y presupuesto de carga (654,61 kB de JavaScript inicial; calculadoras y SDK editorial mantienen su carga diferida). Pasan las suites de navegador de calidad del Dashboard, métricas de acciones, desgloses, resultados y traspasos. Pasan también las pruebas de resultados financieros, periodos y consolidación de exposición. La comparación del build de producción vuelve a coincidir en los 31.520 elementos de los 48 estados de referencia. Se revisaron capturas del resumen en escritorio y de las métricas ampliadas; las capturas nuevas de producción utilizan posiciones sintéticas.


## Novena fase: Academia y simuladores

`src/components/academy/ui` comparte siete componentes con su estructura y utilidades Tailwind. `AcademyPanel` conserva el elemento semántico de cada superficie; `AcademyLinkCard` mantiene el enlace nativo de React Router y sus atributos. `AcademyGrid` organiza las colecciones conservando los ajustes móviles y por contenedor del módulo. Las clases existentes siguen siendo hooks para estados, materiales y pruebas.

`AcademySection` compone 34 secciones de las cinco guías de activos, con títulos opcionales para la sección final. `AcademyMetric` presenta 25 indicadores de guías, asignación, crisis y market timing, sin calcular valores. `AcademyControlField` comparte etiqueta, marco, unidad y ayuda de los pesos de estrategia y las entradas de crisis, conservando los controles, identificadores y callbacks originales. `AcademyVideoCard` encapsula la previsualización y el enlace accesible; el catálogo y el estado de error de miniaturas permanecen en Recursos y guías.

Se aplican estas piezas a 20 módulos existentes. El CSS fuente de `src` pasa de 14.974 a 14.791 líneas: 183 menos en esta fase y un 34,99 % menos respecto a las 22.753 iniciales. No se retiran hojas completas. Las reglas específicas de gráficos, pseudoelementos, animaciones, sombras, contenedores y materiales permanecen donde tienen sentido. Estas cifras describen el código fuente y no el tamaño descargado.


La comparación anterior/posterior cubre 160 combinaciones de 20 rutas, dos anchos y cuatro combinaciones de tema/apariencia. Coinciden las propiedades medidas de 32.604 elementos. En Recursos se compara el estado alternativo de miniaturas: las peticiones externas están bloqueadas y se excluyen únicamente los nodos `IMG` transitorios que el navegador carga de forma diferida. No se afirma una comparación píxel a píxel. Se revisó la captura móvil de Mercado y crisis en Liquid Glass.

La prueba de market timing controla su reloj simulado durante la inspección de órdenes pendientes, evitando que dos comandos de navegador separados pierdan ese estado de dos sesiones. Mantiene las comprobaciones de compra/venta parcial y bloqueo de nuevas órdenes; espera el aumento efectivo del saldo para confirmar la venta. El límite por ronda se amplía a 60 segundos para tolerar trabajadores de CI cargados sin cambiar la duración del juego en producción.


Validación final: pasan TypeScript, ESLint de los módulos y la prueba modificados, build de producción y presupuesto de carga (654,89 kB de JavaScript inicial). Pasan las pruebas financieras de estrategia/asignación, crisis y market timing, y las pruebas de navegador de estrategia/asignación y las tres rondas completas del juego. El recorrido del build de producción pasa 20 rutas y 240 combinaciones de tres anchos y cuatro temas/apariencias sin errores de ejecución ni desbordamientos horizontales. La prueba del juego espera posiciones estables al pulsar las acciones de resultados y usa movimiento reducido para evitar carreras con el desplazamiento automático.


## Décima fase: Gestión de gastos

Los diez archivos de `src/components/expenses/ui` exponen catorce componentes con marcado y estilos Tailwind: botones y acciones, campos y casillas, selectores, paneles y tarjetas, cabeceras y títulos, rejillas, indicadores, progreso y estados vacíos. Se reutilizan en Gestión de gastos, sus seis editores y la importación CSV/Excel.

`ExpenseField` conserva la etiqueta implícita del control y permite mantener las etiquetas visualmente ocultas de los filtros. `ExpensePanel` conserva el elemento semántico de cada panel, incluido el `details` nativo del calendario; `ExpensePanelTitle` también presenta títulos que no tienen una cabecera de acciones. Los selectores utilizan botones nativos con `aria-pressed`, preservando el tipo de botón de los formularios. Los valores se calculan y formatean en sus módulos originales; la barra mantiene exactamente el cálculo y los atributos accesibles del helper anterior.

Se retiran 44 líneas del CSS local, de 298 a 254. Al estar escrito principalmente con reglas de una línea, también se registra su tamaño fuente: pasa de 28.980 a 23.525 bytes. El CSS total de `src` pasa de 14.791 a 14.747 líneas, un 35,19 % menos respecto a las 22.753 anteriores al inicio de las migraciones. No se retiran hojas completas ni se equipara esta reducción al tamaño descargado. Los materiales Liquid Glass, gráficos, tablas y ajustes contextuales conservan CSS donde corresponde.


La comparación anterior/posterior pasa 96 combinaciones: cinco pestañas, seis editores y vista previa de importación, dos anchos y cuatro temas/apariencias. Coinciden las propiedades medidas de 15.704 elementos; no se presenta como una comparación píxel a píxel de todos los estados posibles. La comprobación del código conserva las propiedades de los controles nativos y las declaraciones de lógica sin JSX de los tres módulos. Las pruebas existentes de presupuestos en céntimos e importación Excel/CSV pasan. La suite de navegador usa ahora los 60 segundos de navegación que emplean otras suites del repositorio, para tolerar la compilación de Vite en trabajadores ocupados, y registra por separado el progreso de los flujos y de los tamaños de pantalla.


Validación final: pasan ESLint, TypeScript, compilación de producción y presupuesto de carga (654,89 kB de JavaScript inicial). La suite funcional completa pasa sobre el build de producción: altas, edición, cancelación, borrado, ingresos, reembolsos, transferencias, presupuestos, recurrentes sin duplicados, objetivos, importación CSV/Excel y persistencia. Comprueba también las cinco pestañas y el editor en 320/390/768 px, además de capturas claras/oscuras. La comparación del build de producción vuelve a coincidir en los 15.704 elementos de las 96 combinaciones de referencia, incluidas ambas apariencias. Se revisó la captura móvil del resumen en Liquid Glass.


## Undécima fase: reutilización entre pantallas

`DataItem` comparte el marcado de etiqueta, valor y detalle entre las calculadoras, Planificación, Operaciones, Portfolio CSV y mapa de calor. Sus variantes conservan las diferencias de presentación y los elementos semánticos originales, incluido `CardContent` en Operaciones. Los cálculos y formatos permanecen en los consumidores. `CalculatorDataItem` conserva su nombre como reexportación del componente común.

`DataTable` aporta una única estructura de contenedor y tabla nativa a ficha de fondos, IRPF y las tablas de movimientos/importación de gastos. Las variantes conservan los estilos de columnas y el comportamiento móvil de cada herramienta. `CalculatorTable` delega en esta pieza sin mantener otra implementación.

`FormField` y `FieldHint` comparten el contenedor, la etiqueta explícita y las ayudas entre Añadir activo y los campos estándar de las calculadoras. Conservan el orden de las ayudas, `htmlFor`, identificadores, controles nativos y eventos. Los campos que ya incluyen una etiqueta mediante `Input` no reciben una segunda etiqueta. Los campos de nómina y los campos con etiqueta implícita de gastos conservan sus variantes existentes.

`PageHeading` reúne título, descripción y acciones de Planificación y Operaciones, con la misma disposición móvil. `AcademyStepCard` comparte número, título, contenido y distintivo opcional en quince tarjetas de las cinco guías de activos. `AcademyCallout` comparte icono, título, contenido y tonos de doce avisos, manteniendo estilos inline y enlaces de las lecciones. Sus estilos ordinarios pasan de `@apply` a Tailwind en los componentes; las reglas contextuales de materiales y contenedores permanecen en CSS.

El CSS fuente de `src` pasa de 14.747 a 14.557 líneas en 58 archivos: 190 menos en esta fase y un 36,02 % menos frente a las 22.753 líneas iniciales. Esta medición incluye la limpieza de espacios vacíos de las reglas retiradas; no representa ahorro equivalente en el paquete descargado.


La comparación anterior/posterior sobre el build de producción cubre trece rutas, dos anchos y cuatro combinaciones de tema/apariencia: 104 estados y 21.240 elementos. Coinciden todas las propiedades medidas, incluidas tipografía, dimensiones y sombras; no se presenta como una comparación píxel a píxel. La referencia de Portfolio se toma después de estabilizar el cambio de tamaño de sus gráficos. Se conservan también las declaraciones de lógica fuera del JSX y las propiedades de controles interactivos de doce módulos consumidores. Pasan TypeScript, ESLint, build sin prerender y presupuesto de carga (654,99 kB de JavaScript inicial), además de las pruebas financieras existentes de bonos, IRPF, gastos e importación Excel. La prueba funcional de ficha de fondos pasa con datos simulados, valores cero y ausentes, composición, documentos y dieciséis combinaciones de tamaño/tema.


La comparación de gastos pasa otros 96 estados (cinco pestañas, seis editores y vista previa de importación): coinciden las propiedades medidas de 15.704 elementos entre la referencia y el build de producción. Pasan también los flujos funcionales de altas, edición, cancelación y borrado, ingresos, reembolsos, transferencias, presupuestos, recurrentes sin duplicados, objetivos, CSV/Excel, persistencia y tamaños 320/390/768 px. El recorrido responsive de Planificación, Operaciones, Añadir activo, Portfolio y mapa de calor pasa 60 combinaciones de tres anchos y cuatro temas/apariencias, sin errores de ejecución ni desbordamientos horizontales. Se revisó la captura móvil de Planificación en Liquid Glass.


La suite de usabilidad de calculadoras y Dashboard pasa sobre producción, incluida la asociación accesible de los campos, entradas inválidas, aportaciones y retiradas, persistencia y resultados en tres anchos de pantalla.


## Duodécima fase: tarjetas educativas con estructura compartida

`AcademyProgressCard` reúne el enlace a la lección, icono, título, descripción y botón de progreso de Fundamentos. El estado y su persistencia continúan en Fundamentos: el componente recibe `done`, `onOpen` y `onToggle`, mantiene `aria-pressed` y conserva el botón separado del enlace. `AcademyLearningLink` comparte las fichas del catálogo y las checklists, con icono, título, descripción y distintivo o llamada a la acción; `AcademyRouteLink` comparte los accesos breves, incluida la variante de espaciado móvil. Todos siguen siendo enlaces nativos de React Router. Los tres indicadores superiores reutilizan una variante de `DataItem`.

`AcademyListCard` comparte título, lista y distintivo opcional para las diez tarjetas de ventajas/riesgos y las dos comparativas de las cinco guías de activos. Mantiene los elementos `ul`/`li`, los iconos y los contenidos originales. `AcademyExplainerCard` reúne concepto, explicación y rango en las cuatro tarjetas de métricas de renta variable. Las superficies siguen utilizando `AcademyPanel`; los ajustes por contenedor y los materiales específicos permanecen en sus hojas de estilos.

Se retiran 371 líneas de CSS sustituidas por estas estructuras y 424 líneas de la interfaz antigua de Estrategia y cartera. La limpieza de `PortfolioBuilder.css` elimina 84 selectores sin referencias en los módulos actuales, contrastando sus clases con los archivos TS/TSX/JS/JSX de `src`; conserva las clases que aún aparecen en otros módulos y las reglas de la interfaz actual. No se crean componentes para estilos sin consumidores.

El CSS fuente total pasa de 14.557 a 13.762 líneas en 58 archivos: 795 líneas y 164 declaraciones `@apply` menos. La reducción acumulada frente a las 22.753 líneas iniciales es del 39,52 %. Son cifras de fuente, con limpieza de espacios vacíos; no representan una reducción equivalente del tamaño descargado.


La comparación sobre el build de producción cubre siete rutas y tres estados de Fundamentos (ruta completa, plegada y con progreso), en dos anchos y cuatro combinaciones de tema/apariencia: 72 estados y 19.124 elementos. Coinciden todas las propiedades medidas; no se presenta como una comparación píxel a píxel. El recorrido responsive pasa otras 84 combinaciones de siete rutas, tres anchos y cuatro temas/apariencias sin errores de ejecución ni desbordamientos. Se revisó la captura móvil de Fundamentos en Liquid Glass.

Pasan TypeScript, ESLint de los módulos modificados, build sin prerender y presupuesto de carga (655,00 kB de JavaScript inicial). Las declaraciones fuera de JSX de los seis módulos consumidores permanecen iguales. La prueba de progreso verifica marcar/desmarcar, contadores, persistencia al recargar, plegado/desplegado, navegación que marca la lección, enlaces nativos del catálogo/checklists y tamaños 320/390/768/1280 en Liquid Glass. Las pruebas financieras de modelos y asignación de cartera pasan.


La suite funcional de Estrategia y cartera y su simulador pasa sobre producción: filtros de plazo/riesgo, objetivos táctiles, límites de comparación, persistencia de pesos e importe, normalización explícita, traspaso de los siete bloques al simulador, hipótesis editables, validación, restauración 60/40 y navegación de regreso. Comprueba ambos módulos en cinco anchos y los temas/apariencias existentes.


## Decimotercera fase: análisis de Portfolio y estados de Operaciones

`PortfolioPanel` reúne la superficie, título, descripción y fila opcional de estado de las tarjetas de análisis. Conserva los elementos `article`/`section`, las variantes de ancho completo/doble columna y las clases contextuales que utilizan los gráficos y los materiales Liquid Glass. Los párrafos y títulos del contenido conservan sus estilos, incluidos los que pertenecen a cabeceras específicas. `PortfolioButton` comparte la estructura y estilos de las acciones de subir Excel, descargar plantilla y restaurar demo, manteniendo controles y callbacks nativos.

`StatusPill` comparte los estados de control del Excel y los cinco tipos de operaciones. Mantiene sus variantes de presentación, colores, iconos, etiquetas y elementos originales (`span` en Portfolio, `div` con etiqueta interna en Operaciones). Las etiquetas y la lógica que determina el estado permanecen en los consumidores.

`DataItem` añade iconos opcionales y un elemento configurable para el detalle. Sus nuevas variantes conservan el marcado y estilos de las doce estadísticas avanzadas, tres resúmenes de movimientos y cuatro datos diarios de Portfolio. Los detalles de estadísticas siguen siendo `small`; los consumidores conservan cálculos, valores ausentes y formatos. Las variantes anteriores mantienen sus valores por defecto.

Se retiran 141 líneas de CSS y 25 declaraciones `@apply`: el total pasa de 13.762 a 13.621 líneas en 58 hojas. La reducción acumulada frente a las 22.753 líneas iniciales es del 40,14 %. Estas cifras describen el código fuente, no una reducción equivalente de descarga. Los gráficos, tablas y ajustes específicos de la pantalla conservan CSS donde corresponde.


La comparación sobre el build final de producción pasa 72 estados y 21.888 elementos: Portfolio de demostración, cambio válido de categoría, edición de pesos objetivo, los cinco tipos de operaciones, filtros y ausencia de resultados, más controles Excel OK/aviso/neutro y movimientos importados. Se comparan dos anchos y cuatro combinaciones de tema/apariencia. Los casos de controles y movimientos utilizan una copia aislada de la versión anterior como referencia. Coinciden todas las propiedades medidas; no se presenta como una comparación píxel a píxel.

La revisión de los casos adicionales conserva la precedencia de los bordes de estado frente al borde base y el margen efectivo de la sección de movimientos. El estado se expresa mediante `data-tone` para que el estilo de color tenga la especificidad necesaria, sin alterar sus etiquetas. Se retira una regla de margen de movimientos que la variante de ancho completo ya sobrescribía en la versión anterior.

Pasan TypeScript, ESLint de los módulos modificados, build sin prerender y presupuesto de carga (655,04 kB de JavaScript inicial). Las declaraciones de lógica fuera del JSX de Portfolio y Operaciones se conservan. Pasan las pruebas existentes de rentabilidad, flujos, calendario, procedencia, paridad con el Excel y continuidad del histórico. El recorrido responsive pasa 24 combinaciones de ambas pantallas, tres anchos y cuatro temas/apariencias, sin errores de ejecución ni desbordamientos horizontales.


La prueba funcional pasa edición y persistencia de categorías/pesos al recargar, advertencia de suma objetivo, apertura/cancelación del selector de archivo, petición real de la plantilla y restauración de la demo. Comprueba tamaños 320/390/768/1280 en Liquid Glass, esperando la estabilización del layout tras cambiar de ancho. Se revisó la captura móvil de Portfolio.


## Decimocuarta fase: estructuras compartidas en diez módulos

Interés compuesto, FIRE y jubilación comparten `CalculatorToolHeading`, `CalculatorChoice`, `CalculatorOption`, `CalculatorChart`, `CalculatorLegend`, `CalculatorNotice` y `CalculatorYearDetail`. Las piezas reúnen su marcado y estilos Tailwind, no solo clases sueltas. Los consumidores conservan las series de gráficos, formatos, expresiones financieras, selección y callbacks. Las tarjetas de teoría de FIRE reutilizan una variante de `CalculatorEducationCard`; los indicadores del detalle anual reutilizan `DataItem`.

La ficha de fondos compone su formulario, ejemplo, estado vacío, carga, errores, nota de procedencia y filas de posiciones mediante las cuatro piezas de `CalculatorLookup`. Conserva inputs, validación, estados accesibles, cancelación de peticiones y consultas Finect. El spinner utiliza su animación original, que permanece en CSS.

`JourneyPhase`, `JourneyTextSection`, `JourneyChecklist`, `JourneyAllocation`, `JourneyNotice` y `JourneyGuideLink` componen las etapas del viaje inversor y sus detalles a partir de los mismos datos. Conservan la apertura de etapas, conectores, iconos, listas y enlaces nativos. `AssetCategoryCard` comparte encabezado, descripción, ejemplos y pie opcional de renta variable, liquidez, inmobiliario cotizado y criptoactivos. `BondCategoryCard` comparte encabezado, riesgo, descripción y duración de los subtipos de renta fija.

Los estilos ordinarios de estas estructuras pasan a los componentes y sus mapas de variantes; se mantienen las reglas contextuales de material, contenedor, gráficos y animaciones. Las variantes conservan la precedencia de estados seleccionados, bordes de categorías y medidas móviles. Los selectores arbitrarios con hooks BEM usan `String.raw` para conservar los escapes de los guiones bajos durante la extracción y en el navegador.

Se retiran 1.069 líneas de CSS fuente y 240 declaraciones `@apply`. El total pasa de 13.621 a 12.552 líneas en 58 hojas: reducción acumulada del 44,83 % frente a las 22.753 líneas iniciales. Estas cifras describen el código fuente, no un ahorro equivalente en el paquete descargado. Las declaraciones de lógica fuera de JSX de los diez módulos consumidores permanecen iguales.


La comparación sobre producción cubre quince rutas y estados adicionales de interés compuesto, FIRE, viaje inversor y ficha de fondos: 200 estados en dos anchos y cuatro combinaciones de tema/apariencia. Coinciden las propiedades medidas de 38.704 elementos y el desbordamiento horizontal; no se presenta como una comparación píxel a píxel. La revisión responsive de los diez módulos modificados pasa otras 120 combinaciones de tres anchos y cuatro temas/apariencias, sin errores de ejecución ni desbordamientos. Se revisaron capturas de móvil y escritorio en Liquid Glass.

Pasan TypeScript, ESLint de los archivos modificados y añadidos, build sin prerender y presupuesto de carga. Las pruebas existentes de interés compuesto, asignación de cartera, bonos —incluida la verificación independiente de CoreWeave con Decimal— e IRPF pasan. La suite de usabilidad de calculadoras y Dashboard verifica controles accesibles, entradas inválidas, retiradas, persistencia y escenarios. La ficha de fondos pasa sus pruebas con consultas simuladas, clase exacta, valores cero/ausentes, comisiones, histórico, composición, documentos, tooltip accesible y dieciséis combinaciones responsive/tema. Las consultas a proveedores y el comportamiento financiero permanecen en sus módulos originales.
