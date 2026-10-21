# Tailwind · base compartida y Mi cuenta

La primera fase integra Tailwind CSS 4 con Vite y migra `Button`, `Card`, `Input`, `MetricCard`, `Modal`, `PageHeader` y Mi cuenta. El resto de módulos conserva su CSS y se migrará por fases. No cambia el modelo de datos, las operaciones financieras ni las llamadas de autenticación.

## Convivencia y temas

- `src/styles/tailwind.css` importa tema y utilidades, **sin Preflight**: el reset existente sigue en `src/index.css`.
- Las utilidades llevan el prefijo `tw:`. No colisionan con clases existentes como `text-muted` o `font-medium`.
- Las utilidades quedan sin capa mientras el CSS antiguo siga sin capa. Esto evita que la prioridad de las capas inutilice las utilidades durante la transición; los selectores propios de los módulos pueden seguir refinando sus componentes. No se activa `important` global.
- Los alias de `@theme inline` leen las variables existentes en cada elemento. Colores, bordes, sombras, radios y espaciados responden al tema claro/oscuro, al modo estándar/Liquid Glass y al tamaño de pantalla.
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

Las nuevas dependencias tienen versiones fijadas y lockfile. Vite se actualiza de 7.3.6 a 7.3.7 para corregir los avisos de seguridad detectados por la auditoría durante esta entrega. `tailwind-merge` añade código al cliente: el bundle inicial medido pasa de unos 618 a 651 kB, dentro del límite de 700 kB comprobado por el proyecto. Esta fase busca reducir duplicación y facilitar el mantenimiento; no afirma una mejora de rendimiento por instalar Tailwind.

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

Validación de esta entrega: 64 comprobaciones de lógica e integración y 15 suites de navegador verificadas, además de lint, TypeScript, build y presupuesto del bundle. La pasada general de navegador detectó tres fallos; tras corregirlos se repitieron esas suites y las afectadas por los últimos ajustes. Todos sus resultados finales pasan. La instalación limpia con el lockfile también pasa y la auditoría de dependencias informa de cero vulnerabilidades conocidas en la fecha de entrega.

Para repetir solo la galería con un servidor aislado:

```bash
npm run test:smoke -- --only=test-tailwind-foundation-ui.ts
```

## Siguientes fases

Migrar Noticias, Herramientas, Academia y Dashboard por módulos, reutilizando la base y retirando su CSS sustituido. Mantener CSS específico para gráficos, contenido editorial y efectos ópticos cuando aporte claridad. Cada entrega debe comprobar móvil/escritorio, las cuatro apariencias y los flujos del módulo antes de ampliar el alcance.
