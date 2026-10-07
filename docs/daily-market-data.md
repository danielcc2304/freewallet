# Actualización automática de la cartera

El Dashboard combina consultas directas de mercado con los precios guardados en Supabase para las posiciones de la cuenta autenticada. La actualización en segundo plano utiliza las posiciones de `portfolio_positions`; no depende de Google Sheets ni requiere volver a importar el Excel.

El benchmark es Fidelity MSCI World ACC EUR, ISIN **IE00BYX5NX33**, con NAV de Finect. Se ha eliminado la sustitución automática por URTH del Dashboard. La comparativa importada sigue disponible para periodos anteriores; cuando tiene más cobertura puede conservar prioridad. No se fabrican datos históricos del Fidelity: su serie diaria comienza al activar este proceso y necesita dos fechas comparables para mostrar rentabilidad.

## Proceso

- Edge Function `daily-market-data`: Finect para instrumentos de tipo `fund` por ISIN; Yahoo Finance para acciones, ETF y criptoactivos por símbolo. Un ISIN de una acción no cambia su proveedor. Identidad de clase, divisa, precio y fecha deben ser válidos.
- Batch cada dos horas, a las **08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 y 22:00 de España peninsular**, todos los días. No se consulta al proveedor entre las 23:00 y las 08:00. Se utiliza `Europe/Madrid`, con cambio automático entre invierno y verano. Las ejecuciones posteriores recogen publicaciones tardías; cada fecha de NAV se guarda una sola vez por instrumento y puede corregirse con un dato posterior del proveedor.
- Las conversiones a EUR utilizan observaciones de cambio correspondientes al día del precio, con un máximo de cuatro días de desfase. Si no hay una fecha fiable para el cierre anterior en otra divisa, la variación diaria permanece sin dato.
- Cada precio conserva proveedor, fecha de cotización, precio, divisa y unidad originales (`GBp` se convierte con escala `0.01` a `GBP`), cambio utilizado y su fecha, y fecha de consulta. El navegador utiliza la misma política de cambio fechado que el worker. No se convierte la fecha de consulta en fecha del precio.
- Valoraciones diarias privadas por fecha contable Europe/Madrid: cantidades y costes capturados bajo bloqueo de la revisión de la cartera, sin bloquear las demás carteras. Cada operación se guarda una sola vez en `snapshot_ledger`; la valoración referencia el máximo identificador ya capturado. Las valoraciones antiguas conservan su conjunto exacto de operaciones mediante identificadores. No son cierres oficiales: se identifican como `mixed-observations` y conservan las fechas mínima y máxima de cotización. Una operación retroactiva invalida los puntos afectados mediante la huella de su libro; no se sobrescribe el libro de operaciones.
- Una valoración total solo se publica si todos los activos están cubiertos por consultas recientes y precios dentro de los márgenes de antigüedad del Dashboard. Un fallo parcial conserva los precios disponibles y registra los errores; no publica un total incompleto.
- El Dashboard consulta directamente acciones y ETF durante su sesión, cada cinco minutos con la pestaña visible, y criptoactivos las 24 horas. Estas consultas evitan la caché del batch y la caché de cotizaciones del navegador. Los horarios usan la zona del mercado, con un margen de treinta minutos para recoger cierres retrasados; los festivos y los retrasos de cotización dependen del proveedor. Un símbolo con mercado desconocido mantiene la consulta directa.
- Fondos y activos fuera de sesión priorizan los precios disponibles del batch. El botón de refresco manual consulta directamente los proveedores. Si una consulta falla, solo se usa el batch cuando no sea anterior al precio ya mostrado; las respuestas tardías tampoco pueden sustituir una cotización más reciente. Sin cuenta cloud se mantiene la cartera local y la comparativa importada.
- Yahoo se consulta en sus dos rutas alternativas. Las cotizaciones directas usan metadatos de una sesión para el cierre anterior: una vela de hace un minuto o el inicio de un rango de cinco días no equivalen al cierre previo. El batch utiliza esos metadatos cuando están disponibles, incluyendo Nextil. Para otras divisas solo calcula el cierre anterior en EUR cuando su fecha se puede contrastar con una vela previa real. Si no hay cierre anterior válido, la variación queda sin dato; nunca se sustituye por el precio actual para obtener un 0% artificial.

El histórico diario se añade al histórico importado mediante las reglas existentes de continuidad y flujos. Las cotizaciones no modifican revisiones, cantidades, costes, transacciones ni el documento importado. El cliente consulta hasta 800 días de precios/valoraciones. No hay backfill ficticio de periodos anteriores a la activación.

## Despliegue y acceso

1. Aplicar todas las migraciones versionadas, incluidas `architecture_hardening`, `market_publication_hardening` y `portfolio_delta_commands`, después del bootstrap editorial en instalaciones nuevas. La última migración actualiza también el job existente. Su expresión Cron es `0 6-21 * * *` en UTC, con un filtro SQL que solo envía la petición en las ocho horas locales indicadas; las comprobaciones intermedias no ejecutan el batch.
2. Desplegar `supabase/functions/daily-market-data/index.ts` con sus dependencias. `verify_jwt=false` es intencionado: el endpoint verifica un secreto aleatorio de Vault mediante una RPC disponible únicamente para `service_role`; rechaza una petición sin secreto válido. No acepta una clave pública ni un JWT de usuario como permiso para ejecutar el proceso.
3. Como propietario de la base, ejecutar `select portfolio_private.configure_daily_market_job('https://PROJECT_REF.supabase.co');`. El secreto se genera dentro de la base y nunca pasa al repositorio ni al navegador.
4. Configurar la web como indica `portfolio-supabase.md`. Las RPC de lectura requieren una cuenta confirmada, sesión activa y MFA cuando corresponda. Derivan el propietario de Auth; no aceptan un `user_id` del cliente.

Las tablas están en el esquema privado, con RLS y sin permisos de lectura/escritura directa para `anon` o `authenticated`. Las advertencias informativas de RLS sin políticas en estas tablas son intencionadas: se accede mediante helpers privados con comprobación de identidad. Las ejecuciones tienen una exclusión de cinco minutos para impedir batches simultáneos.

## Verificación y diagnóstico

- `npm run test:daily-market`: PostgreSQL real local (PGlite), proveedores, fechas, cambio de divisa, permisos, sesiones revocadas, aislamiento entre cuentas, publicación atómica y fallos parciales.
- `npm run test:daily-market-ui`: Chromium con Auth y transporte simulados, sin llamadas reales; requiere Vite en `127.0.0.1:5178` con URL/clave publicables de fixture y sincronización cloud activada. Comprueba precios guardados, histórico, Fidelity y diseño móvil.
- `npm run test:architecture`: conversiones de unidades y FX, reintentos/cancelación, permisos editoriales y MFA, recuperación de invitaciones, patches idempotentes, snapshots y salud del worker.
- `portfolio_private.market_runs`: resultado, recuentos y errores de cada ejecución. Si todos los instrumentos fallan, el worker devuelve `failed` y HTTP 503.
- `market_snapshot_results`: resultado de captura por ejecución y cuenta. `market_dispatches` enlaza cada envío HTTP con `net._http_response`; un Cron correcto solo confirma el envío.
- `freewallet-market-watchdog` se ejecuta cada cinco minutos. Marca leases vencidos y registra en `market_alerts` ejecuciones ausentes, batches parciales y errores de transporte. El Dashboard consulta un resumen seguro de salud y el estado de captura de su cuenta. Los avisos son internos; no envían correo ni requieren servicios de pago.
- Los proveedores reintentan hasta tres veces los fallos transitorios (429, 5xx y red), con espera y señal de cancelación compartida. El plazo de proveedores es 95 segundos; se reservan 12 para publicación y 25 para capturas.
- Para consultar el endpoint desde Cron, reutilizar los secretos dentro de SQL como hace `configure_daily_market_job`; no copiar credenciales a scripts públicos.

Activado en `hocuefrnotspaejtmpsw` el 6 de octubre de 2026. Primera ejecución completa: 22 instrumentos, cero fallos y dos valoraciones privadas. NAV del benchmark disponible: 14,6592 EUR, fechado el 5 de octubre de 2026. Los cambios del frontend se integran mediante la rama `feature/daily-market-data` basada en `dev`.

## RPC compatibles y guardados

`read_daily_market_data` sigue reconstruyendo el formato antiguo. La web de esta rama utiliza `read_daily_market_data_v2`, que transmite el diccionario de operaciones una sola vez y las referencias de cada valoración. Ambas lecturas derivan la cuenta de Auth. `capture_market_snapshot` está reservada a `service_role`.

`commit_portfolio` se conserva para importaciones y clientes anteriores. `patch_portfolio(expected_revision, request_id, changes, removed)` envía solo los campos modificados; las preferencias no ejecutan la validación financiera. Si cambian posiciones o transacciones se conserva la validación atómica original. Una respuesta perdida se reintenta con el mismo identificador y payload; un conflicto de revisión no se sobrescribe.

La protección contra contraseñas filtradas de Supabase Auth se configura en [Password security](https://supabase.com/docs/guides/auth/password-security) y requiere Pro o superior. No se sustituye por una comprobación únicamente en el navegador ni se activa contratando un plan automáticamente.
