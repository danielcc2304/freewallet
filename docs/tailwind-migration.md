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
