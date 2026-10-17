# Correcciones de la auditoría · 17 de octubre de 2026

Rama: `feature/application-audit-fixes`, creada desde `dev` (`f4bdba7`), que ya contiene el hotfix del histórico de fondos de `master` y la revisión visual de riesgo. No se crea PR ni se promueve el frontend desde esta tarea.

| Hallazgo | Corrección y comprobación |
| --- | --- |
| A01 · HTML de Noticias | DOMPurify sanea todo el árbol antes de normalizar formatos. Lista explícita de etiquetas, atributos y protocolos, enlaces externos con `noopener noreferrer`, imágenes HTTP(S) y tamaños de texto permitidos. Prueba en Chromium con HTML anidado, atributos ejecutables, SVG/MathML, URLs codificadas, estilos y saneamiento repetido. |
| A02 · Mercados distintos | Registro de mercados verificados, resolución por cuenta y clave que incluye mercado; usado por navegador, worker y capturas. Prueba SQL con dos usuarios que valoran el mismo título en mercados diferentes, permisos y metadatos de procedencia. |
| A03 · Gastos pendientes | Guard global que permanece al navegar, aviso con acceso a reintentar/exportar, bloqueo de logout tanto en Mi cuenta como en Noticias. Una recarga automática por error de un chunk tampoco debe descartar cambios pendientes. |
| A04 · Hotfix ausente | La base actual ya incluye la integración. CI comprueba que `master` sea antecesor antes de promover `dev`/`release`, además de ejecutar la regresión de histórico de fondos. |
| A05 · Calidad | Se actualizan expectativas anteriores de los tests y el estado del importador Excel. Un runner ejecuta pruebas locales, otro los recorridos de navegador con backend sintético; CI añade lint, tipos, build y auditoría de dependencias. |
| A06 · Carga inicial | Rutas principales y de Academia diferidas; navegación visible, estado de carga y límite de errores por ruta. Una prueba de build controla el grafo de imports iniciales y evita cargar calculadoras/SDK editorial antes de necesitarlos. |
| A07 · Contraseñas filtradas | **Pendiente:** la organización usa Supabase Free; la protección nativa exige Pro. No se cambia el plan ni se da por implementada una protección equivalente solo en frontend. |
| A08 · Dependencias | Lockfile actualizado a `source-map-js` 1.2.2 y DOMPurify 3.4.17. Validar con `npm ci` y `npm audit --audit-level=low`. |
| A09 · SEO | Origen HTTPS configurable, dominio de producción corregido y previews sin indexación. Pruebas de validación, rutas únicas, sitemap y robots. |

## Identidad de cotización

Las posiciones y las operaciones conservan su símbolo original. Para valorarlas se resuelve una identidad de mercado distinta cuando existe un mercado verificado y la preferencia de la cuenta lo selecciona. Por ejemplo, un registro `NXTE.XD` puede valorarse con `NXT:BME` si la cuenta elige Madrid. Otra cuenta que elige «original» sigue usando `NXTE.XD`; sus observaciones no se mezclan.

El registro del navegador vive en `supabase/functions/_shared/stockListings.ts`; el registro privado de base es `portfolio_private.stock_quote_listings`. Una prueba compara ambos. El modelo admite nuevas bolsas y títulos; cada nueva asociación requiere verificar ISIN, símbolo, mercado y divisa, y añadir una migración y su entrada de cliente. No se deduce una bolsa a partir del nombre ni se sustituye silenciosamente por una más reciente.

La selección por cuenta se guarda en `freewallet_settings.stockQuoteMarkets`. El worker recibe `googleListing` y `quoteCurrency` del registro privado. Su parser verifica símbolo, bolsa, divisa y fecha; un cambio o fallo del proveedor produce un error explícito y no una cotización de otra bolsa. El navegador y las capturas guardan `quoteInstrument`, proveedor y fecha de la observación. La protección contra precios anteriores se aplica dentro del mismo mercado: al cambiar de bolsa puede aceptarse una observación de hora anterior que sí pertenece a la bolsa elegida. El caché conserva esa procedencia al sincronizar. Se conservan las reglas de sesión, MFA, acceso privado, cadencia, lease y publicación completa.

**Históricos:** las observaciones anteriores conservan el mercado real con que se capturaron. Esta migración no inventa precios pasados ni reetiqueta capturas antiguas. La captura del día sigue actualizándose mediante el flujo habitual del batch; un cambio de bolsa puede explicar una diferencia real respecto a observaciones anteriores y requerir revisión específica.

## Despliegue de backend

1. Desplegar `daily-market-data` con su `deno.json` y todos los módulos relativos. Mantener `verify_jwt=false`: esta función ya autentica el secreto del job y valida su credencial en SQL. No es una función de escritura abierta.
2. Aplicar `20261017174622_unified_quote_markets.sql`. El worker nuevo admite los descriptores antiguos sin `googleListing`, por lo que puede desplegarse primero. **No invertir este orden**: el worker antiguo ignoraría los metadatos del mercado nuevo.
3. Verificar una ejecución del batch: instrumento solicitado, proveedor, precio, capturas por usuario y permisos. No imprimir secretos de Vault ni modificar operaciones de usuarios para ensayar.
4. Desplegar el frontend de esta feature cuando corresponda. Compartir base no distribuye los cambios del frontend entre PRO y PRE.

La migración solo modifica metadatos y funciones de valoración. Su modificación de funciones comprueba la presencia del contrato SQL esperado y aborta si no corresponde, preservando las protecciones existentes. La tabla de mercados no tiene políticas públicas y revoca acceso de `anon`, `authenticated` y `service_role`; las funciones autorizadas la consultan internamente. El advisor puede señalar informativamente RLS sin políticas en tablas privadas: no se deben abrir para silenciar ese aviso.

En esta tarea se desplegó el worker **v11** y se aplicó la migración. Una ejecución posterior terminó en `success`, solicitó `NXT:BME`, guardó la cotización de Google Finance y capturó las dos carteras existentes; una incluía esa identidad de Madrid. Las ejecuciones programadas conservan su horario habitual.

## Comprobaciones reproducibles

```bash
npm ci
npm run check
SKIP_PRERENDER=1 npm run build
npm run test:build
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium npm run test:smoke
npm audit --audit-level=low
```

`check` requiere Python 3 para la referencia independiente del bono. `test:smoke` inicia un Vite aislado con configuración sintética y no usa sesiones reales. Sus tests bloquean o simulan peticiones externas. El resto de scripts UI sigue disponible por separado. Los resultados de los runners quedan en `test-results/`; los datos sintéticos pueden exportarse sin revelar información de carteras reales.

Los controles se ejecutan en GitHub Actions. Para que sean obligatorios al integrar cambios, configurar la protección de ramas en GitHub; versionar un workflow no activa por sí mismo esa protección.

Validación local completada: lint y TypeScript correctos; **63/63 comprobaciones de lógica/base de datos**, referencia independiente de bonos incluida; **10 suites de navegador** correctas; build y control del grafo inicial correctos; instalación limpia del lockfile y auditoría completa con cero vulnerabilidades conocidas. La suite de migración de cartera se repitió de forma aislada tras actualizar sus contratos de API y migraciones, separar el aviso de bienvenida y esperar las confirmaciones de guardado antes de recargar. Las nueve restantes pasaron en la ejecución conjunta. No se ha ejecutado todavía este workflow en GitHub.

Para repetir una suite con su servidor de prueba aislado:

```bash
npm run test:smoke -- --only=test-portfolio-ui.ts
```

Los resultados enfocados se guardan aparte (`test-results/smoke-focused`) para conservar los logs de la ejecución conjunta.

El bundle principal pasa de 1.807,92 kB (529,46 kB gzip) a 618,32 kB (215,62 kB gzip). El control del grafo confirma que calculadoras y SDK editorial quedan fuera del arranque. Permanece un aviso de Vite por un bloque superior a 500 kB; no se oculta elevando el umbral. La reducción de JS inicial es una medida de compilación, no una medición del INP en los dispositivos de los usuarios. `beforeunload` tampoco está garantizado por todos los navegadores móviles: el aviso persistente y el bloqueo de logout complementan ese evento; no sustituyen una confirmación real del guardado.

Para A07, consultar la [protección nativa de contraseñas filtradas de Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Activarla y verificar alta/cambio de contraseña cuando el proyecto disponga del plan compatible.
