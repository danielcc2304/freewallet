# Histórico independiente del Excel

El Dashboard consume un modelo de valoraciones, flujos y benchmark independiente de las hojas de cálculo. El Excel/CSV sirve como entrada de importación y sigue disponible en `/portfolio-csv`; ya no se analiza al calcular el Dashboard. Tanto una cartera nueva como una importada usan el mismo motor de rentabilidad, con la cobertura real que tengan.

## Modelo y almacenamiento

`src/services/portfolioHistoryArchive.ts` define el archivo estructurado `freewallet_history_archive_v1`:

- Valoraciones en EUR con fecha, capital aportado acumulado, frecuencia diaria/mensual y origen.
- Aportaciones y retiradas con identificador estable, importe firmado y precisión de fecha.
- Retornos acumulados importados del benchmark y de la cartera, conservados como referencia de la comparativa anterior.
- Valores liquidativos del benchmark con fecha, ISIN, divisa y fuente.
- Vinculación explícita con las posiciones/operaciones y tasa libre de riesgo importada.

En modo local se guarda en el navegador. En cloud se proyecta atómicamente en tablas del esquema `portfolio_private`:

| Tabla | Contenido |
| --- | --- |
| `historical_archives` | Metadatos y ámbito de la cartera. |
| `historical_valuations` | Valoraciones fechadas y capital aportado. |
| `historical_cash_flows` | Flujos identificados y precisión de fecha. |
| `historical_benchmarks` | NAV por ISIN y retornos acumulados de la comparativa. |
| `history_event_receipts` | Recibos de peticiones para reintentos idempotentes. |

El documento versionado conserva una copia estructurada para respaldo, sincronización y clientes anteriores. Un trigger mantiene sus tablas normalizadas dentro de la misma transacción. No se guardan CSV en estas tablas. El Dashboard consulta las tablas mediante RPC y conserva la copia estructurada cargada si falla la lectura; no recurre al Excel para reconstruirla.

## Importación y continuidad

`src/services/imports/portfolioHistoryImport.ts` es la frontera de compatibilidad. Convierte una sola vez las claves antiguas dentro de la sesión de su propietario, o al importar un archivo nuevo. Conserva valores, flujos, fechas y vínculo existentes. Una reimportación mantiene las observaciones añadidas por la API.

Un flujo del que solo se conoce el mes conserva precisión mensual y fecha efectiva de cierre del mes. No se transforma en una operación diaria con una fecha de compra inventada. Los datos futuros no se incorporan al cálculo actual. El historial no se vincula automáticamente a una cartera distinta: el usuario confirma su relación cuando no existe una vinculación previa válida.

Las valoraciones importadas tienen prioridad hasta su último día. Después continúan las valoraciones verificadas y las operaciones del Dashboard, sin duplicar los flujos ya importados. No se modifican cantidades, costes ni operaciones al migrar el histórico.

Una cartera nueva necesita operaciones y valoraciones, no un archivo. La misma lógica calcula sus resultados desde que tiene cobertura. No puede reconstruir años anteriores ni mostrar un YTD completo si falta el inicio del año. Cuando un movimiento impide verificar el tramo reciente, se conserva el último resultado verificable y su fecha explícita.

Actualizar Google Sheets no actualiza por sí solo el histórico de Supabase. Para revisar una discrepancia de YTD, compara primero la fecha final, la valoración y los flujos de ambas fuentes. Una valoración corregida se registra con la misma fecha que la anterior; un nuevo cierre se añade como otra observación mediante la API de histórico. Se conservan las operaciones y los flujos existentes, y se recalcula el porcentaje: no se guarda un YTD fijo ni se copia el porcentaje de una celda. Las observaciones registradas por la API prevalecen sobre una reimportación posterior.

El selector del benchmark aplica esta protección también a diario, semanal, mensual, trimestral y todo el histórico cuando existe una base verificable. Diario/semanal pueden usar la ventana anterior reciente con sus fechas explícitas. Los huecos intermedios siguen sin producir una rentabilidad completa; no se rellena el NAV ausente del benchmark.

Las eliminaciones ambiguas no se convierten automáticamente en ventas. El resumen permite confirmar que un registro sin ventas ni posiciones activas era una entrada errónea. La decisión reversible se guarda en `freewallet_settings.discardedPositionRecords`, referenciando el identificador de eliminación y el de posición; los movimientos originales permanecen inmutables. Solo afecta a realizado/total, no reescribe las valoraciones anteriores ni reconcilia el tramo pendiente. En cloud se utilizan únicamente las anotaciones confirmadas por la RPC existente, aisladas por cuenta. Deshacerlas devuelve el registro a revisión.

## API para agentes

Las dos RPC son `POST /rest/v1/rpc/<nombre>` y requieren una cuenta confirmada, sesión activa y MFA cuando esté configurado. Derivan el propietario de Auth: no aceptan un `user_id`. Las tablas no conceden acceso directo a `anon` ni a `authenticated`.

### Leer

`read_portfolio_history(known_updated_at)` devuelve `{ revision, updatedAt, archive }`. El argumento es opcional y puede ser `null`. Si `known_updated_at` coincide, devuelve `archive: null` y los metadatos; el cliente reutiliza su copia anterior. Si no existe histórico, ambos campos de histórico son `null`.

### Añadir o corregir observaciones

`upsert_portfolio_history(expected_revision, request_id, events)` admite las colecciones `valuations`, `cashFlows`, `benchmarkReturns` y `benchmarkNavs`. Las omitidas no cambian. Ejemplo ficticio de actualización de NAV con `supabase-js`, después de iniciar sesión:

```ts
const { data: state, error: readError } = await supabase.rpc('read_portfolio_history');
if (readError) throw readError;

// Guarda el UUID y el payload de esta petición hasta confirmar su resultado.
const request = {
  expected_revision: state.revision,
  request_id: crypto.randomUUID(),
  events: {
    benchmarkNavs: [{
      date: '2026-10-07', nav: 12.34, currency: 'EUR',
      isin: 'IE00BYX5NX33', source: 'agente:proveedor-verificado',
    }],
  },
};
const { data, error } = await supabase.rpc('upsert_portfolio_history', request);
if (error) throw error;
```

Una petición idéntica con el mismo UUID se aplica una vez. Reutilizarlo con otro contenido se rechaza. Una revisión obsoleta produce conflicto `40001`: hay que leer el estado actual, revisar el cambio y preparar otra petición; no sobrescribirlo silenciosamente. Una fecha identifica la observación, aunque se exprese con otra representación ISO o zona horaria. Para flujos, la identidad es su `id`: úsalo de forma estable para no contabilizar dos veces una misma aportación.

Formatos de eventos:

| Colección | Campos |
| --- | --- |
| `valuations` | `date`, `value`, `invested`, `cadence: 'daily' \| 'monthly'`; opcional `returnUnavailable`. `invested` representa capital aportado acumulado, no coste de posiciones abiertas. |
| `cashFlows` | `id`, `date: YYYY-MM-DD`, `amount` firmado, `precision: 'day' \| 'month'`, `source`. La precisión mensual requiere el último día del mes. |
| `benchmarkNavs` | `date`, `nav > 0`, `currency: 'EUR'`, `isin`, `source`. |
| `benchmarkReturns` | `date`, `portfolioAccumPct`, `benchmarkAccumPct`. Compatibilidad con retornos acumulados de la comparativa de Fidelity `IE00BYX5NX33`; se prefiere registrar NAV fechado cuando exista. |

Máximo 1 MiB y 1.000 eventos por colección en cada petición; 50.000 por colección almacenada, dentro del límite global del documento de 8 MiB. Importes no finitos, fechas futuras, fechas mensuales ambiguas e instrumentos/divisas inválidos se rechazan sin guardar cambios parciales. Los recibos se conservan 90 días. La API de histórico no registra compras o ventas: esas operaciones se introducen mediante los comandos de cartera.

Los agentes externos necesitan configurar estas llamadas con una sesión autorizada. Añadir las RPC no cambia sus tareas existentes de Google Sheets ni los conecta automáticamente. Nunca se facilita una clave `service_role` a un agente o al frontend para actualizar la cartera de un usuario.

## Precios y despliegue

El batch `daily-market-data` sigue consultando las posiciones de Supabase cada 30 minutos dentro de su horario, guarda precios/NAV y valoraciones completas. Las consultas de acciones y criptos del navegador conservan su frecuencia actual. El histórico estructurado complementa esos datos y permite que agentes añadan observaciones sin usar una hoja como base de datos. El cálculo de rentabilidad sigue en el motor TypeScript compartido; no hay un segundo cálculo financiero en SQL.

Aplicar `portfolio_structured_history` y `portfolio_history_event_dates` antes de publicar el frontend que las utiliza. Ambas están instaladas en el proyecto configurado; los nombres locales coinciden con el historial remoto. El despliegue de la web se realiza por separado. Los clientes anteriores que omiten el nuevo campo en un respaldo completo conservan el histórico nuevo.

## Verificación

- `npm run test:history-archive`: igualdad de periodos antes/después, precisión mensual, conversión única y continuidad tras eliminar todas las claves CSV.
- `npm run test:structured-history-backend`: PostgreSQL local, aislamiento, MFA, permisos, validación atómica, correcciones por fecha y reintentos.
- `npm run test:structured-history-ui`: lectura nativa con Auth simulado, caché condicional, actualización de ambos YTD tras corregir una valoración y añadir un cierre sin importar Excel, y aislamiento al cambiar de cuenta. Requiere Vite en `127.0.0.1:5228` con URL/clave publicables sintéticas y `VITE_PORTFOLIO_CLOUD_ENABLED=true`; intercepta todo el transporte externo. `FREEWALLET_TEST_URL` admite otro puerto local.
- `npm run test:portfolio-periods-ui`: Dashboard móvil tras eliminar el CSV y cartera nueva sin archivo.
- `npm run test:ytd-verification-ui`: conservación del YTD verificable en resumen y benchmark cuando hay operaciones recientes sin resolver.

Las fixtures del repositorio son sintéticas; no incluyen datos financieros ni sesiones de usuarios reales.
