# FreeWallet

Aplicación web de gestión de cartera y educación financiera, construida con React, TypeScript y Vite. Incluye un Dashboard, importación de Excel/CSV, cartera multidispositivo con Supabase, noticias editoriales y una academia con guías, calculadoras y simuladores.

Este README describe el código de la rama que estás consultando. Las funciones disponibles en una web publicada dependen de la versión desplegada y de su configuración. La versión de la aplicación está en [`src/constants/app.ts`](src/constants/app.ts).

## Contenido

- [Funciones](#funciones)
- [Instalación local](#instalación-local)
- [Configuración](#configuración)
- [Actualización de precios e histórico](#actualización-de-precios-e-histórico)
- [Noticias editoriales](#noticias-editoriales)
- [Arquitectura y rutas](#arquitectura-y-rutas)
- [Scripts](#scripts)
- [Despliegue](#despliegue)
- [Problemas habituales](#problemas-habituales)
- [Documentación técnica](#documentación-técnica)

## Funciones

### Dashboard y cartera

- Registro y edición de posiciones, compras adicionales y ventas; libro de operaciones y respaldo JSON.
- Valor actual, coste de posiciones abiertas, resultado no realizado y rendimiento por periodo. El realizado y el total solo se muestran cuando los movimientos permiten calcularlos: borrar una posición no equivale a registrar su venta.
- Los reembolsos reconstruidos con aproximaciones autorizadas se identifican en sus notas y marcan el realizado y el total como estimados; no son justificantes fiscales.
- Las entradas eliminadas que se crearon por error pueden clasificarse desde «Ver motivo» del resumen. La corrección es reversible, conserva el libro de operaciones y no permite excluir registros con ventas o posiciones activas.
- Evolución mensual importada y valoraciones diarias cuando existe cobertura suficiente. Los periodos sin datos fiables se identifican en la interfaz.
- Comparación con Fidelity MSCI World ACC EUR, ISIN **IE00BYX5NX33**, utilizando las fechas comunes disponibles y fechando la diferencia cuando el NAV termina antes que la cartera. No se completa el benchmark con precios inventados ni con otro instrumento.
- Composición por activos y exposición consolidada: suma las posiciones directas y las participaciones conocidas dentro de los fondos. Identifica el resto sin desglosar y las coincidencias aproximadas.
- Al activar «Desglosar fondos», el mapa de calor y los desgloses por fondo quedan cerrados por defecto y pueden abrirse individualmente.
- Detalle de activos con gráficos históricos, una breve descripción de la empresa antes de las métricas y fundamentales disponibles, incluido EBITDA en acciones. La identidad de la clase del fondo, la divisa y la fecha del precio se conservan; un dato ausente no se sustituye por cero.
- Plan y control de cartera, con sugerencias de aportaciones en bloques de **50 €**, sin céntimos.
- Las cuentas de liquidez admiten una TAE opcional y editable, incluido 0 %. Se guarda con la cuenta y se muestra en su ficha; no incrementa automáticamente el saldo.
- Cabecera compacta: fechas de lectura, consulta al proveedor y próxima consulta dentro de un desplegable.

### Cuenta y sincronización

- Modo local sin backend obligatorio, con persistencia en el navegador.
- Con Supabase configurado: registro con nombre de usuario único, acceso con usuario o correo, confirmación de correo, recuperación de contraseña y verificación en dos pasos mediante TOTP, QR o clave manual. El nombre se puede cambiar desde Mi cuenta. [Modelo y API de usuarios](docs/account-usernames.md).
- Una cartera por cuenta, sincronización entre dispositivos y control de revisiones, conflictos y peticiones repetidas. Los guardados posteriores a la importación envían cambios y borrados de campos, con respuesta incremental.
- La importación de una cartera local a la cuenta requiere confirmación expresa. No reemplaza automáticamente una cartera remota existente.
- Las modificaciones de una cartera conectada requieren conexión; la vista ya cargada puede consultarse sin red en esa pestaña.

### Gastos y presupuesto

Nueva sección de Herramientas en `/academy/expenses`, independiente de la cartera:

- Gastos, ingresos, reembolsos y transferencias entre cuentas; etiquetas, notas, filtros, edición y borrado con confirmación.
- Cuentas bancarias, efectivo y tarjetas con saldo inicial, historial y archivo reversible.
- Presupuestos por mes y categoría, base mensual, alertas de exceso y referencia 50/30/20.
- Recurrentes semanales, mensuales y anuales, vencimientos, pausa y omisión; cada pago o cobro se confirma antes de contarlo.
- Resumen de ingresos, gasto neto, balance y ahorro; categorías, seis meses de evolución, calendario y previstos pendientes.
- Objetivos de ahorro con reservas y aportación mensual orientativa.
- CSV y Excel bancarios (.xlsx/.xls) con asignación de columnas, selección de hoja, vista previa y revisión de coincidencias. Detección del extracto BBVA y opción de importar solo pagos de tarjeta. Copia completa JSON para exportar y restaurar.

Funciona en EUR y guarda importes en céntimos enteros. En local conserva el registro en este navegador; con una cuenta conectada usa un libro de gastos privado en Supabase, incluso sin cartera de inversiones. No conecta con bancos ni mueve dinero. [Modelo, API y validación](docs/expense-planner.md).

### Importación de Excel y CSV

La pantalla `/portfolio-csv` sigue disponible para importar y analizar hojas de cálculo. El Dashboard usa un histórico estructurado independiente del archivo y puede continuarlo con operaciones y valoraciones posteriores, según su cobertura y vinculación. Los datos antiguos se convierten una sola vez dentro de la sesión de su propietario.

- Excel `.xlsx`: hojas `Cartera` y `Evolución`; admite información adicional de `Diario`, `Movimientos`, `Comparativa`, `Objetivos`, `Control` y `Datos diarios` según el formato de la plantilla.
- CSV separados de cartera y evolución mensual.
- Plantillas descargables, composición, aportaciones, rentabilidad, concentración y métricas de riesgo cuando las series lo permiten.

El Excel proporciona posiciones, movimientos e histórico inicial. Las carteras nuevas usan el mismo motor de resultados sin necesitar un archivo. En Supabase, las RPC autenticadas permiten añadir valoraciones, flujos y NAV del benchmark directamente; los agentes externos deben configurarse para llamarlas. Consulta el [modelo y la API de histórico](docs/portfolio-history.md).

### Academia y herramientas

- Fundamentos, **Tu viaje como inversor**, glosario, errores comunes, fiscalidad, estrategias y gestión del riesgo.
- Guías de acciones, bonos, efectivo, REITs y criptoactivos.
- Perfil inversor, escenarios de crisis y ficha de fondos.
- **Radar de fondos**: catálogo público en Supabase, gestión desde la interfaz para editores de noticias, retirada/restauración e historial de cambios. Consulta diaria a Finect a las 09:15 de Madrid, fechas por métrica, ratio retorno/volatilidad y notas continuas de 0 a 100 dentro de las categorías generales del radar, con muestras pequeñas marcadas como provisionales. [Catálogo, permisos y proceso diario](docs/fund-radar.md).
- **Estrategia y cartera**: modelos con filtros de plazo/riesgo, comparación de hasta tres carteras, pesos e importes editables y traslado al simulador por hipótesis. Los siete bloques se conservan; las preferencias son locales y no modifican el Dashboard. [Alcance y fórmulas](docs/strategy-portfolio.md).
- Calculadoras de interés compuesto, FIRE, jubilación, fondo de emergencia, bonos, impuestos e inflación.
- Calculadora de IRPF y sueldo neto 2026: nómina en 12/14 pagas, Seguridad Social, circunstancias familiares, estimación individual de renta por comunidad y comparación de escenarios. Consulta el [alcance del cálculo](docs/salary-calculator.md).
- **Reto: Market Timing vs DCA**: tres rondas de 30 segundos, compras y ventas parciales, órdenes con demora y límite de operaciones. Ambas estrategias incluyen efectivo y costes; se requieren dos rondas ganadas y al menos 100 € de ventaja acumulada. Son mercados simulados, no una predicción de resultados reales.

### Noticias

Análisis públicos en `/news` y editor privado en `/admin/news`, con borradores, publicación, invitaciones y revocación de editores. El autor con acceso editorial activo puede abrir la edición de su artículo desde un lápiz flotante en la vista de lectura. Los artículos incluyen comentarios públicos con edición y borrado propios, moderación editorial y límites de uso. [Permisos, API y pruebas de comentarios](docs/news-comments.md).

## Instalación local

### Requisitos

- **Node.js 22.12 o superior**, compatible con Vite y el Puppeteer del proyecto.
- npm y el `package-lock.json` del repositorio.
- Para el prerender o las pruebas de navegador: un Chromium compatible con Puppeteer y sus dependencias del sistema.

```bash
git clone https://github.com/danielcc2304/freewallet.git
cd freewallet
git switch dev
npm ci
npm run dev
```

Abre la dirección que muestre Vite, normalmente `http://localhost:5173`. `dev` es la base de desarrollo; selecciona la rama de una feature si quieres trabajar con cambios todavía no integrados.

Para utilizar únicamente la cartera local y la Academia no hace falta configurar Supabase. Las funciones de cuenta y Noticias sí requieren backend.

## Configuración

Las variables de ejemplo están en [`.env.example`](.env.example). Para usar Supabase, copia ese archivo a `.env.local` y rellena:

| Variable | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL pública del proyecto de Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable del cliente. |
| `VITE_SUPABASE_ANON_KEY` | Alternativa de compatibilidad con la clave `anon` antigua. |
| `VITE_PORTFOLIO_CLOUD_ENABLED` | `true` para habilitar la cartera cloud después de preparar la base y Auth; por defecto `false`. |
| `VITE_FINECT_API_KEY` | Opcional: sustituye la clave de cliente utilizada para las fichas de Finect. |

Las variables `VITE_*` se incluyen en el cliente. Nunca uses una clave secreta ni `service_role` en ellas. `.env.local` no debe subirse al repositorio. Más información: [claves de Supabase](https://supabase.com/docs/guides/api/api-keys).

### Cartera cloud

Las migraciones están en [`supabase/migrations`](supabase/migrations). Antes de habilitar el flag, configura Auth, correo y redirects de `/account`, y comprueba qué migraciones están ya aplicadas. En una instalación nueva, prepara primero el esquema editorial base y después aplica todas las migraciones versionadas; estas también protegen Noticias.

Consulta [cartera con Supabase](docs/portfolio-supabase.md) para el modelo, la importación, las revisiones, los conflictos y MFA. Ese documento incluye informes de implementación y validaciones de su fecha; no constituye una comprobación del estado actual de cada despliegue.

### Datos locales

La cartera local actual guarda posiciones y operaciones en `freewallet_portfolio_v1`, con lectura compatible de claves anteriores. Histórico, ajustes, objetivos, watchlist y datos importados usan almacenamiento adicional. Las preferencias de API y apariencia se gestionan desde Ajustes.

Los datos del navegador dependen del origen: cambiar dominio o puerto no comparte `localStorage`. Exporta un respaldo desde la aplicación antes de limpiar datos o trasladarlos a otro dispositivo.

## Actualización de precios e histórico

«Mis Activos» agrupa los registros del mismo instrumento: suma cantidades, costes y valoraciones y muestra el precio medio ponderado. El desglose conserva cada registro para añadir compras, editar, vender o eliminar de forma individual. La agrupación es una vista: no fusiona posiciones guardadas ni reescribe operaciones; mantiene separadas clases de fondos, monedas y mercados bursátiles distintos, y señala valoraciones estimadas o de varias fechas.

Si un movimiento o hueco impide verificar un periodo completo, los periodos con cobertura suficiente conservan su tramo inicial verificable y muestran las fechas reales en el resumen y la comparativa. Los rangos diario/semanal solo recuperan ventanas recientes; no se rellenan huecos ni bases ausentes. El tramo pendiente queda fuera del gráfico.

El Dashboard utiliza dos vías de actualización. El radar de fondos tiene su propio [proceso diario independiente](docs/fund-radar.md), que no modifica posiciones ni snapshots de las carteras:

Las consultas del navegador contrastan Yahoo con **Google Finance para el mismo mercado** cuando falta un precio reciente, y con **CoinGecko para criptos identificadas**. Nextil (`ES0126962069`) prioriza Madrid/BME; su ficha permite escoger el mercado del registro. El worker y las capturas resuelven también esa preferencia por cuenta mediante el registro privado de mercados verificados; no cambian el símbolo de las operaciones ni mezclan observaciones de bolsas distintas. Los precios conservan la fecha publicada y nunca se reemplazan por observaciones anteriores. La consulta cada minuto no garantiza un dato nuevo ni un feed bursátil en tiempo real.

| Proceso | Funcionamiento |
| --- | --- |
| Refresco del navegador | Acciones en sesión y criptos las 24 horas: cada minuto con el Dashboard visible y consultas habilitadas. Fondos, ETF, acciones fuera de sesión y otras pantallas conservan cinco minutos. La app oculta pausa las consultas. «Consultar precios ahora» permite reintentar manualmente. |
| Actualización en Supabase | Edge Function `daily-market-data` cada 30 minutos, de **08:00 a 22:30 en España peninsular** (`Europe/Madrid`, con ajuste de verano/invierno). Acciones, ETF y criptos mantienen esa frecuencia; fondos y benchmark se consultan a las **08:00, 12:00, 16:00 y 22:00**, con consultas adicionales para nuevos fondos, NAV caducados y reintentos tras fallos. Las valoraciones reutilizan únicamente NAV vigentes comprobados desde el último punto de control. Los fondos contrastan Finect, VDOS/Quefondos, Financial Times, Yahoo y gestoras compatibles. |

El proceso en Supabase requiere las migraciones, la función desplegada y el job configurado. Publicar el frontend no instala ni activa por sí solo ese proceso. Tampoco el hecho de que el batch esté activo actualiza el código de una web que aún no haya desplegado la integración.

Los instrumentos negociados usan **Yahoo Finance**. Los fondos contrastan **Finect, VDOS/Quefondos y series NAV de Yahoo** por ISIN y clase; Cobas Internacional D y Azvalor Internacional consultan además sus gestoras. Se escoge la fecha de NAV más reciente y se prioriza la fuente más fiable para la misma fecha. Las cotizaciones bursátiles de un fondo no se usan como su NAV. Los gráficos y fundamentales tienen su propia cobertura y pueden recurrir a Alpha Vantage y Finnhub.

El refresco manual de fondos de una cuenta cloud utiliza la Edge Function autenticada `fund-quote`, con la misma selección de fuentes del batch. Puede ejecutarse fuera del horario automático; comprueba sesión activa, MFA y acceso al fondo, y limita las consultas repetidas. Si una fuente falla o devuelve un NAV anterior, conserva el dato válido disponible. La cartera local conserva su consulta directa a Finect.

El proceso conserva precio y unidad originales (incluidos GBp), divisa, proveedor, fecha de cotización y fecha de consulta. El cliente y el batch usan el cambio correspondiente al día del precio y guardan su fecha. Convierte las valoraciones a EUR según las observaciones de cambio admitidas. Un fallo parcial conserva los datos disponibles y registra errores, sin publicar una valoración total incompleta. No modifica cantidades, costes ni el libro de operaciones.

El batch reintenta fallos transitorios, cancela consultas al agotar su plazo y cuenta con un watchdog cada cinco minutos; los avisos aparecen en el Dashboard. Cada valoración captura solo el bloqueo de su cuenta y referencia un libro de operaciones deduplicado. Es la última valoración del día con precios/NAV de distintas fechas, no un cierre oficial.

La serie diaria comienza al activar el proceso: no recupera automáticamente todos los precios anteriores. Fondos, festivos y fines de semana pueden conservar el último NAV o cierre disponible. Consulta [actualización diaria](docs/daily-market-data.md) para despliegue, calendario, permisos y diagnóstico.

## Noticias editoriales

1. Prepara Auth y la cuenta propietaria indicada en las reglas de bootstrap de [`supabase/news-schema.sql`](supabase/news-schema.sql).
2. En una instalación nueva, aplica ese esquema base **antes** de las migraciones versionadas. En proyectos ya preparados utiliza las migraciones; no vuelvas a ejecutar el bootstrap. Configura las variables públicas del frontend.
3. Configura los redirects de `/admin/news` y el correo de Auth.
4. Para invitar editores, despliega la Edge Function [`invite-news-editor`](supabase/functions/invite-news-editor) y configura sus secretos `APP_URL` y `ALLOWED_ORIGINS` para el dominio autorizado.

La función de invitaciones usa credenciales administrativas únicamente en el servidor. El propietario administra el equipo; los invitados establecen su contraseña mediante el correo de Supabase. Una membresía revocada pierde acceso editorial aunque su cuenta de Auth siga existiendo. Las operaciones requieren sesión vigente y MFA si está activado. Cada editor modifica sus artículos; el propietario puede gestionar todos. Las invitaciones se registran antes del envío y pueden recuperarse sin duplicar correos.

Las noticias se almacenan como HTML sanitizado, con editor Tiptap. La portada utiliza una URL HTTPS. Los permisos editoriales no permiten acceder a carteras de otros usuarios.

## Arquitectura y rutas

### Stack

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Recharts, Lucide, Supabase, Tiptap, DOMPurify y SheetJS. Las versiones y dependencias exactas están en [`package.json`](package.json) y `package-lock.json`.

```text
src/
  app/routes/         Definiciones de rutas de Academia y herramientas
  components/         Academia, Dashboard, gráficos, navegación y UI
  context/            Cartera, cuenta y apariencia
  pages/              Dashboard, cuenta, noticias, importación y ajustes
  services/           Mercado, valoración, histórico, persistencia y Supabase
supabase/
  migrations/         Esquema y funciones de la cartera y datos diarios
  functions/          Procesos diarios e invitaciones editoriales
  news-schema.sql     Esquema editorial
scripts/              SEO, prerender y verificaciones
public/               Recursos estáticos
```

La navegación principal está en [`src/App.tsx`](src/App.tsx); Academia y herramientas se definen en [`src/app/routes/academyRoutes.tsx`](src/app/routes/academyRoutes.tsx).

| Ruta | Pantalla |
| --- | --- |
| `/` | Dashboard de cartera |
| `/account` | Cuenta, sincronización y verificación en dos pasos |
| `/add` | Alta y edición de posiciones |
| `/planning` | Planificación |
| `/transactions` | Operaciones |
| `/portfolio-csv` | Importación y análisis de Excel/CSV |
| `/settings` | Ajustes |
| `/market-heatmap` | Mapa de mercado |
| `/news`, `/news/:slug` | Noticias y lectura de artículos |
| `/admin/news` | Panel editorial |
| `/academy` | Fundamentos y acceso a Academia |
| `/academy/timeline` | Tu viaje como inversor |
| `/academy/portfolio` | Estrategia y cartera |
| `/academy/market-timing-game` | Reto Market Timing vs DCA |
| `/academy/fund-information` | Ficha de fondos por ISIN |
| `/feature-log`, `/terms` | Novedades y condiciones |

### Estilos y componentes

La migración a Tailwind es progresiva. La base compartida (`Button`, `Card`, `Input`, `MetricCard`, `Modal`, `PageHeader` y `ActionGroup`) y Mi cuenta usan utilidades `tw:` vinculadas a los temas existentes. El resto de pantallas conserva su CSS. No se activa Preflight ni un `important` global; se mantienen los puntos de conexión de Liquid Glass durante la transición. [Arquitectura, convenciones y pruebas](docs/tailwind-migration.md).

## Scripts

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor Vite con recarga durante el desarrollo. |
| `npm run build` | TypeScript, bundle de Vite, SEO y prerender de rutas públicas con Puppeteer. |
| `npm run preview` | Vista local de la compilación. |
| `npm run lint` | ESLint. |
| `npm run check` | Lint, TypeScript y todas las pruebas locales de lógica/base de datos; incluye la referencia independiente de bonos en Python. |
| `npm run test:smoke` | Arranca Vite con configuración sintética y ejecuta los recorridos de navegador principales. Requiere Chromium/Puppeteer. |
| `npm run test:build` | Tras compilar, comprueba el tamaño del JS inicial y que calculadoras y SDK editorial se carguen bajo demanda. |
| `npm run verify-funds` | Verificación de identidad/enlaces de fondos del catálogo. |

Las regresiones están agrupadas en scripts `test:*` de `package.json`, entre ellos:

- Cartera y sincronización: `test:portfolio-backend`, `test:portfolio-sync`, `test:portfolio-ui`.
- Histórico independiente: `test:history-archive`, `test:structured-history-backend`, `test:portfolio-periods-ui`, `test:ytd-verification-ui`.
- Actualizaciones diarias: `test:daily-market`, `test:daily-market-ui`.
- Dashboard: `test:dashboard-audit`, `test:dashboard-results`, `test:portfolio-periods`, `test:portfolio-composition`.
- Fondos y acciones: `test:fund-chart-resolution`, `test:fund-breakdown`, `test:stock-fundamentals`, `test:underlying-resolution`.
- Noticias y juego: `test:news-article-editor-ui`, `test:market-timing`, `test:market-timing-ui`.

`test:smoke` prepara su propio puerto y backend de prueba; las peticiones externas de sus escenarios se interceptan. Para usar Chromium del sistema puedes definir `PUPPETEER_EXECUTABLE_PATH`. Los scripts UI individuales aceptan `FREEWALLET_TEST_URL`; consulta sus cabeceras. No configures pruebas de escritura con credenciales de una cartera real. Los logs y resultados quedan en `test-results/` (ignorado por Git).

Puedes repetir una sola suite con `npm run test:smoke -- --only=test-portfolio-ui.ts`; sus logs quedan separados de la ejecución completa.

El workflow [Application quality](.github/workflows/quality.yml) ejecuta estos controles, build y auditoría de dependencias en las PR y en `dev`, `release` y `master`. También exige incorporar los hotfixes de `master` antes de promover `dev`/`release`. La protección obligatoria de ramas debe configurarse en GitHub para exigir su resultado.

## Despliegue

El frontend produce `dist`. [`vercel.json`](vercel.json) configura rutas de proxy hacia Yahoo Finance, Finect y fuentes de posiciones, además del fallback de la SPA. Vite proporciona los proxies durante el desarrollo. Otros alojamientos deben ofrecer rutas equivalentes para mantener el mismo transporte; una publicación estática de `dist` no los incluye por sí sola.

Supabase aloja Auth, la base y las Edge Functions. Sus migraciones y funciones se gestionan por separado del despliegue del frontend.

La compilación genera `sitemap.xml`, `robots.txt` y, fuera de Vercel, prerender con Puppeteer. `FREEWALLET_SITE_URL` configura el origen público de producción (por defecto `https://freewallet-gilt.vercel.app`). Las previews, las ramas Vercel `release`/`dev` y los entornos con `FREEWALLET_DEPLOYMENT_ENV=preproduction` generan robots sin indexación, sitemap vacío y una meta `noindex,nofollow`. Esto cubre también un proyecto Vercel independiente de PRE que despliega `release` como su rama de producción.

Las pantallas se descargan por ruta, con indicador de carga y recuperación de errores, manteniendo la navegación visible. Los gastos pendientes conservan su aviso al salir de la pantalla y bloquean el cierre de sesión hasta reintentar o exportar. Consulta las [correcciones de la auditoría y su despliegue](docs/application-audit-fixes.md), incluida la identidad de mercado compartida entre navegador, worker y capturas.

Para omitir solo el prerender en un entorno que no disponga de Chromium:

```bash
# Bash / shells POSIX
SKIP_PRERENDER=1 npm run build
```

```powershell
# PowerShell
$env:SKIP_PRERENDER="1"
npm run build
```

```bat
:: Windows CMD
set SKIP_PRERENDER=1 && npm run build
```

El script también omite automáticamente el prerender al detectar `VERCEL`. `PUPPETEER_EXECUTABLE_PATH` permite seleccionar un Chromium ya instalado.

## Problemas habituales

- **No aparecen Cuenta o Noticias con acceso funcional:** revisa variables públicas, flag de cartera, esquemas, Auth y redirects. Las variables del frontend necesitan reiniciar Vite o recompilar el despliegue.
- **No cambian los precios:** comprueba el ajuste de consultas, la conectividad y los límites del proveedor. En cloud revisa las ejecuciones del batch; una fecha de consulta reciente no significa que el NAV sea de hoy.
- **Histórico o rentabilidad no disponibles:** revisa cobertura de fechas, clase/ISIN, divisa y operaciones registradas. No se extrapolan resultados para ocultar huecos.
- **Fondos parcialmente desglosados:** las fuentes pueden publicar solo algunas posiciones o distribuciones agregadas; el Dashboard conserva el resto sin identificar y permite reintentar consultas fallidas.
- **Conflicto al guardar:** exporta los cambios pendientes y carga expresamente la revisión del servidor. No se fusionan automáticamente decisiones financieras.
- **Falla el prerender:** revisa Chromium y sus dependencias; puedes omitir esa fase con `SKIP_PRERENDER=1` sin saltarte TypeScript ni la compilación de Vite.

## Documentación técnica

- [Migración de estilos a Tailwind](docs/tailwind-migration.md): componentes, temas y primera fase de Mi cuenta.
- [Cartera con Supabase](docs/portfolio-supabase.md): importación, sincronización, permisos y MFA.
- [Histórico independiente del Excel](docs/portfolio-history.md): migración, almacenamiento y API para agentes.
- [Actualización diaria](docs/daily-market-data.md): batch, benchmark, histórico y diagnóstico.
- [Revisión de lógica del Dashboard](docs/dashboard-logic-review.md).
- [Revisión del Dashboard](docs/dashboard-review.md).
- [Noticias y Market Timing](docs/news-and-market-timing.md).

Los informes técnicos recogen el alcance y las verificaciones realizadas en sus respectivas revisiones; para conocer una instalación concreta hay que contrastarlos con su configuración y versión desplegada.
