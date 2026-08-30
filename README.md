# FreeWallet

Aplicacion web de gestion de cartera + academia financiera, construida con React, TypeScript y Vite.

FreeWallet combina dos bloques en una sola app:

1. `Dashboard de cartera` para registrar activos, seguir rendimiento y actualizar precios.
2. `Academy` con guias, simuladores y calculadoras para educacion financiera practica.

Ademas incluye una pantalla especializada de `Portfolio CSV` para analizar composicion y evolucion mensual desde ficheros CSV exportados de Excel.

---

## Tabla de contenidos

- [Vision del producto](#vision-del-producto)
- [Funcionalidades principales](#funcionalidades-principales)
- [Stack tecnico](#stack-tecnico)
- [Arquitectura y flujo de datos](#arquitectura-y-flujo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas de la aplicacion](#rutas-de-la-aplicacion)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Scripts disponibles](#scripts-disponibles)
- [SEO y prerender](#seo-y-prerender)
- [Configuracion y datos locales](#configuracion-y-datos-locales)
- [Portfolio CSV: guia funcional](#portfolio-csv-guia-funcional)
- [Academy: guia funcional](#academy-guia-funcional)
- [Despliegue](#despliegue)
- [Troubleshooting](#troubleshooting)
- [Seguridad y buenas practicas](#seguridad-y-buenas-practicas)

---

## Vision del producto

FreeWallet esta pensado para usuarios que quieren:

- Llevar control de su cartera en una interfaz clara y simple.
- Visualizar metricas clave sin depender de hojas de calculo complejas.
- Aprender fundamentos de inversion dentro de la misma aplicacion.
- Validar decisiones con simuladores y calculadoras tematicas.

La filosofia es unir `operativa` + `educacion` en una sola experiencia.

---

## Funcionalidades principales

### 1) Dashboard de cartera

- Alta, edicion y borrado de activos.
- Resumen de rendimiento (invertido, valor actual, plusvalia, cambios periodicos).
- Composicion visual (tabla, mapas, graficos).
- Carga de datos demo para pruebas.
- Persistencia local via `localStorage`.

### 2) Actualizacion de precios

- Servicio de cotizaciones con estrategia de fallback:
  - Yahoo Finance (via proxies CORS).
  - Alpha Vantage.
  - Finnhub.
- Caches y TTL para reducir llamadas y mejorar UX.
- Control de activacion via ajustes (`apiEnabled`).

### 3) Academy de inversion

- Guias: fundamentos, timeline, fiscalidad, riesgo, estrategias, glosario, etc.
- Simuladores: crisis, perfil inversor, market timing, asset allocation, portfolio builder.
- Calculadoras: interes compuesto, FIRE, jubilacion, fondo de emergencia, bonos, impuestos, inflacion.
- Deep-dives por tipo de activo (equities, bonds, cash, REITs, crypto).

### 4) Portfolio CSV

- Carga de CSV de cartera y evolucion mensual.
- KPIs automaticos: concentracion, diversificacion efectiva, retorno medio, volatilidad.
- Graficos: composicion, bloques, valor total vs invertido, drivers, mapa de riesgo.
- Plantillas de descarga y persistencia local de los CSV.

---

## Stack tecnico

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `Recharts`
- `Lucide React`
- `Axios`
- `date-fns`
- `ESLint`

Post-build:

- `scripts/generate-seo.js` para `sitemap.xml` y `robots.txt`.
- `scripts/prerender.js` con `puppeteer` para prerender SPA por rutas.

---

## Arquitectura y flujo de datos

### Capa UI

- Componentes en `src/components`.
- Paginas en `src/pages`.
- Navegacion por rutas en `src/App.tsx`.

### Capa de estado

- `PortfolioProvider` en `src/context/PortfolioContext.tsx`.
- Gestiona estado de activos, loading, actualizacion de precios y acciones CRUD.

### Capa de persistencia

- `src/services/storageService.ts` guarda:
  - Activos.
  - Historial.
  - Settings de la app.
- Todo en `localStorage` (sin backend obligatorio para operar).

### Capa de datos de mercado

- `src/services/apiService.ts`:
  - Busqueda de simbolos.
  - Cotizaciones.
  - Datos fundamentales.
  - Datos historicos.
  - Batch update.
- Estrategia defensiva con cache, rate limiting y fallback entre proveedores.

---

## Estructura del proyecto

Estructura resumida:

```text
freewallet/
  public/
  scripts/
    generate-seo.js
    prerender.js
    verify-funds.ts
  src/
    components/
      academy/
      charts/
      dashboard/
      layout/
      ui/
    context/
      PortfolioContext.tsx
      ThemeContext.tsx
    data/
      academy/
      mockData.ts
    pages/
      Dashboard/
      AddInvestment/
      Settings/
      PortfolioCsv/
      TermsAndConditions/
      NotFound/
    services/
      apiService.ts
      storageService.ts
    App.tsx
    main.tsx
  vercel.json
  package.json
```

---

## Rutas de la aplicacion

### Core

- `/` -> Dashboard
- `/add` -> Alta/edicion de activo
- `/settings` -> Ajustes de app y datos
- `/portfolio-csv` -> Analisis por CSV
- `/terms` -> Terminos

### Academy (subset principal)

- `/academy` -> Landing Academy
- `/academy/calculators`
- `/academy/portfolio`
- `/academy/asset-allocation`
- `/academy/investor-profile-test`
- `/academy/assets/equities`
- `/academy/assets/bonds`
- `/academy/assets/cash`
- `/academy/assets/reits`
- `/academy/assets/crypto`

Y otras rutas de guias/simuladores listadas en `src/App.tsx`.

---

## Puesta en marcha local

## Requisitos

- `Node.js` 20+ recomendado.
- `npm` (el proyecto usa `package-lock.json`).

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la URL que muestre Vite (normalmente `http://localhost:5173`).

---

## Scripts disponibles

### `npm run dev`

Inicia servidor de desarrollo con HMR.

### `npm run build`

Pipeline completo:

1. `tsc -b`
2. `vite build`
3. `node scripts/generate-seo.js`
4. `node scripts/prerender.js`

Nota: el prerender requiere entorno compatible con Puppeteer.

### `npm run preview`

Sirve la build local para validacion manual.

### `npm run lint`

Ejecuta ESLint en el proyecto.

### `npm run verify-funds`

Script utilitario para verificar fondos de `BEST_FUNDS` (consistencia de enlace/ISIN/nombre).

## Noticias editoriales

La ruta `/news` muestra los análisis publicados y `/admin/news` ofrece un panel privado para crear borradores y publicar noticias desde un editor WYSIWYG con formato, enlaces seguros y tamaños de letra.

La feature no necesita un servidor Node separado: el frontend sigue desplegándose en Vercel y usa Supabase como backend gestionado para Auth y PostgreSQL.

### Configuración de Supabase

1. Crea un proyecto en Supabase.
2. En `Authentication > Users`, crea la cuenta propietaria con el correo configurado para esta feature (`daniel230401@gmail.com`). Define la contraseña desde Supabase; no se guarda ni se cifra en el frontend. Supabase Auth gestiona el hash y la verificación de credenciales.
3. Ejecuta `supabase/news-schema.sql` desde el SQL Editor. Al iniciar sesión, la función `ensure_news_owner` registra automáticamente al propietario y activa su membresía.
4. Copia `.env.example` como `.env.local` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (también se admite `VITE_SUPABASE_ANON_KEY`). No subas `.env.local` al repositorio.
5. Desactiva el registro público de usuarios en Supabase si solo quieres altas mediante invitación. El propietario es la única cuenta que puede invitar o revocar editores desde `/admin/news`.

### Invitaciones de editores

El botón `Enviar invitación` llama a la Edge Function `invite-news-editor`, que usa `auth.admin.inviteUserByEmail` con la `service_role` únicamente en Supabase. Esa clave nunca debe estar en Vite, `.env.local` ni en el navegador.

Despliega la función y configura la URL pública de retorno:

```bash
supabase functions deploy invite-news-editor
supabase secrets set APP_URL=https://tu-dominio.example ALLOWED_ORIGINS=https://tu-dominio.example
```

La cuenta invitada recibe el email de Supabase, crea su propia contraseña y entonces pasa de `invited` a `active` en `public.news_admins`. Revocar el acceso marca la membresía como `revoked`; las políticas RLS dejan de permitirle leer o modificar borradores aunque conserve su cuenta de Auth.

Configura también el proveedor de correo de Supabase (SMTP propio para producción). En local, `APP_URL` debe coincidir con la URL de Vite que uses, por ejemplo `http://127.0.0.1:5173`.

Si el listado del equipo carga pero `Enviar invitación` falla, comprueba primero que la función esté desplegada y que tenga `APP_URL`; el panel muestra el motivo concreto como aviso flotante. Si el proyecto no inyecta sus claves internas automáticamente, configura `SUPABASE_SERVICE_ROLE_KEY` como secreto de la función, nunca como variable `VITE_*`.

Las noticias se guardan como HTML sanitizado. La portada acepta de momento una URL HTTPS; el bucket `news-images` queda preparado para añadir subida de imágenes más adelante.

---

## SEO y prerender

Durante `build` se generan:

- `dist/sitemap.xml`
- `dist/robots.txt`

Tambien se prerenderizan rutas clave con Puppeteer para mejorar discoverability y carga inicial.

### Saltar prerender si hace falta

En entornos donde Puppeteer falle (CI restringido, timeout, sin sandbox, etc):

```bash
set SKIP_PRERENDER=1 && npm run build
```

En PowerShell:

```powershell
$env:SKIP_PRERENDER="1"; npm run build
```

El script tambien evita prerender en Vercel cuando detecta `VERCEL`.

---

## Configuracion y datos locales

### Persistencia local

`storageService` usa estas claves:

- `freewallet_assets`
- `freewallet_history`
- `freewallet_settings`

Para `Portfolio CSV` se usan claves propias (holdings/evolution/file labels/updatedAt).

### Ajuste de API

- `apiEnabled` controla si se realizan llamadas de mercado.
- Se guarda en `localStorage` desde `Settings`.

### Clave Finnhub personalizada

El usuario puede guardar una clave propia en localStorage (fallback adicional).

### Consulta de fondos por ISIN

La herramienta `/academy/fund-information` permite pegar el ISIN de una clase de fondo y consultar su ficha pública de Finect desde el SPA. La consulta normaliza identidad, costes, riesgo, rentabilidades, composición, posiciones y documentación disponible.

En desarrollo local, Vite expone dos rutas proxy (`/__finect/api` y `/__finect/site`) para que la ficha funcione sin bloquearse por CORS. En Vercel, las mismas rutas se reescriben server-side hacia Finect, manteniendo la petición same-origin sin añadir un backend de aplicación; si el despliegue no soporta esas reescrituras, se conserva un fallback mediante proxies CORS temporales desde el navegador. Por ello está pensada para pruebas o uso interno: un proxy público puede tener límites o dejar de estar disponible y la clave de cliente queda expuesta en el bundle del frontend.

Se puede sobrescribir la clave pública de cliente con `VITE_FINECT_API_KEY` en `.env.local` si Finect la rota. Cuando exista backend, debe conservarse el contrato de `getFundRelevance(isin)` y sustituirse únicamente el transporte para mover la clave y el scraping al servidor.

---

## Portfolio CSV: guia funcional

Pantalla: `/portfolio-csv`

### Que espera

- CSV de cartera con columnas de activo/importe/peso.
- CSV de evolucion mensual con valor total, aportaciones, plusvalias y retornos.
- Excel `.xlsx` con hojas `Cartera` y `Evolucion`; `Comparativa`, `Estadisticas avanzadas` y `Datos diarios` son opcionales.

### Que calcula

- Patrimonio total.
- Concentracion Top 3.
- Diversificacion efectiva (HHI invertido).
- Ratio de meses positivos.
- Retorno medio mensual y volatilidad.
- Proyeccion base a 12 meses.

### Visualizaciones

- Donut de composicion por activo.
- Barras por bloques.
- Area de valor total vs capital invertido.
- Drivers mensuales (aportacion vs plusvalia).
- Mapa de riesgo (retorno, drawdown, TWR YTD).
- Ratios de riesgo recalculados a partir de las series validas: Sharpe, Sortino, alpha, beta, drawdown, tracking error y volatilidad diaria.

### UX

- Descarga de plantillas CSV.
- Descarga de la plantilla Excel de referencia, con formatos, formulas, graficos y datos de prueba.
- Persistencia de ficheros cargados.
- Modo demo recuperable en un click.

---

## Academy: guia funcional

### Objetivo

Convertir la app en entorno de aprendizaje aplicado:

- Conceptos + practica + simulacion.
- Rutas de contenido por nivel.
- Herramientas orientadas a toma de decisiones.

### Portfolio Builder (seccion de modelos)

La seccion ahora permite:

- Ver listado general por defecto.
- Filtrar por perfil:
  - Horizonte temporal.
  - Estilo de inversion.
  - Aversion al riesgo.
- Visualizar solo carteras relevantes para el filtro.
- Limpiar filtros y volver al catalogo completo.

---

## Despliegue

### Vercel

`vercel.json` aplica fallback SPA:

- Si no existe fichero fisico, redirige a `index.html`.

### Flujo recomendado

1. `npm run lint`
2. `npx tsc -b`
3. `npm run build`
4. Publicar `dist` o desplegar con Vercel.

---

## Troubleshooting

### 1) `npm run build` falla en prerender por timeout

Sintoma tipico: `Navigation timeout exceeded` en Puppeteer.

Acciones:

- Reintentar en local (a veces es intermitente).
- Ejecutar build con `SKIP_PRERENDER=1`.
- Revisar rutas lentas o bloqueadas.
- Aumentar timeout en `scripts/prerender.js` si procede.

### 2) No actualiza precios

Comprobar:

- `apiEnabled` activado en ajustes.
- Conectividad de red.
- Limites/rate limit en proveedores.
- Restricciones CORS/proxy temporal.

### 3) Resultado de busqueda pobre para algunos fondos

El buscador aplica heuristicas y varios backends, pero algunos ISIN/simbolos pueden variar por mercado.

Sugerencias:

- Probar ISIN directo.
- Probar ticker + exchange.
- Guardar clave real de Finnhub (mejora fallback vs `demo`).

### 4) Datos incoherentes tras pruebas

- Limpiar storage desde `Settings`.
- Recargar demo.
- Repetir flujo con dataset limpio.

---

## Seguridad y buenas practicas

- No subir secretos reales al repo.
- Mantener `.env.local` fuera de control de versiones.
- Rotar tokens que se hayan expuesto por error.
- Evitar claves hardcodeadas en frontend para produccion real.
- Si se evoluciona a backend, mover integraciones sensibles al servidor.

---

## Resumen rapido

FreeWallet reúne en una sola app la parte de `gestion + aprendizaje`.

La base actual ya cubre:

- Operativa local completa.
- Integracion de datos de mercado con fallbacks.
- Seccion educativa extensa.
- Analitica avanzada por CSV.
- Pipeline de build con SEO + prerender.

La base actual cubre bien el uso local, la parte educativa y el analisis por CSV.
