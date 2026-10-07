# Actualización diaria de la cartera

El Dashboard consulta los precios guardados en Supabase para las posiciones de la cuenta autenticada. La actualización en segundo plano utiliza las posiciones de `portfolio_positions`; no depende de Google Sheets ni requiere volver a importar el Excel.

El benchmark es Fidelity MSCI World ACC EUR, ISIN **IE00BYX5NX33**, con NAV de Finect. Se ha eliminado la sustitución automática por URTH del Dashboard. La comparativa importada sigue disponible para periodos anteriores; cuando tiene más cobertura puede conservar prioridad. No se fabrican datos históricos del Fidelity: su serie diaria comienza al activar este proceso y necesita dos fechas comparables para mostrar rentabilidad.

## Proceso

- Edge Function `daily-market-data`: Finect por ISIN; Yahoo Finance por símbolo. Identidad de clase, divisa, precio y fecha deben ser válidos.
- Cron a las **06:00, 20:00 y 22:00 UTC**, todos los días. Las ejecuciones posteriores recogen publicaciones tardías; cada fecha de NAV se guarda una sola vez por instrumento y puede corregirse con un dato posterior del proveedor.
- Las conversiones a EUR utilizan observaciones de cambio correspondientes al día del precio, con un máximo de cuatro días de desfase. Si no hay una fecha fiable para el cierre anterior en otra divisa, la variación diaria permanece sin dato.
- Cada precio conserva proveedor, fecha de cotización, precio y divisa originales, cambio utilizado y fecha de consulta. No se convierte la fecha de consulta en fecha del precio.
- Valoraciones diarias privadas por fecha contable Europe/Madrid: cantidades y costes capturados bajo bloqueo de la revisión de la cartera, junto a las operaciones necesarias para validar el histórico. Una operación retroactiva invalida los puntos afectados mediante la huella de su libro; no se sobrescribe el libro de operaciones.
- Una valoración total solo se publica si todos los activos están cubiertos por consultas recientes y precios dentro de los márgenes de antigüedad del Dashboard. Un fallo parcial conserva los precios disponibles y registra los errores; no publica un total incompleto.
- El Dashboard consulta directamente acciones y ETF durante su sesión, cada cinco minutos con la pestaña visible, y criptoactivos las 24 horas. Estas consultas evitan la caché del batch y la caché de cotizaciones del navegador. Los horarios usan la zona del mercado, con un margen de treinta minutos para recoger cierres retrasados; los festivos y los retrasos de cotización dependen del proveedor. Un símbolo con mercado desconocido mantiene la consulta directa.
- Fondos y activos fuera de sesión priorizan los precios disponibles del batch. El botón de refresco manual consulta directamente los proveedores. Si una consulta falla, solo se usa el batch cuando no sea anterior al precio ya mostrado; las respuestas tardías tampoco pueden sustituir una cotización más reciente. Sin cuenta cloud se mantiene la cartera local y la comparativa importada.
- Yahoo se consulta en sus dos rutas alternativas. Las cotizaciones directas usan metadatos de una sesión para el cierre anterior: una vela de hace un minuto o el inicio de un rango de cinco días no equivalen al cierre previo. El batch también recupera esos metadatos para instrumentos EUR con una única vela mensual, como Nextil. Si no hay cierre anterior válido, la variación queda sin dato; nunca se sustituye por el precio actual para obtener un 0% artificial.

El histórico diario se añade al histórico importado mediante las reglas existentes de continuidad y flujos. Las cotizaciones no modifican revisiones, cantidades, costes, transacciones ni el documento importado. El cliente consulta hasta 800 días de precios/valoraciones. No hay backfill ficticio de periodos anteriores a la activación.

## Despliegue y acceso

1. Aplicar `daily_market_data`, `daily_market_schedule` y `daily_market_accounting_calendar`, junto a las migraciones anteriores de cartera.
2. Desplegar `supabase/functions/daily-market-data/index.ts` con sus dependencias. `verify_jwt=false` es intencionado: el endpoint verifica un secreto aleatorio de Vault mediante una RPC disponible únicamente para `service_role`; rechaza una petición sin secreto válido. No acepta una clave pública ni un JWT de usuario como permiso para ejecutar el proceso.
3. Como propietario de la base, ejecutar `select portfolio_private.configure_daily_market_job('https://PROJECT_REF.supabase.co');`. El secreto se genera dentro de la base y nunca pasa al repositorio ni al navegador.
4. Configurar la web como indica `portfolio-supabase.md`. Las RPC de lectura requieren una cuenta confirmada, sesión activa y MFA cuando corresponda. Derivan el propietario de Auth; no aceptan un `user_id` del cliente.

Las tablas están en el esquema privado, con RLS y sin permisos de lectura/escritura directa para `anon` o `authenticated`. Las advertencias informativas de RLS sin políticas en estas tablas son intencionadas: se accede mediante helpers privados con comprobación de identidad. Las ejecuciones tienen una exclusión de cinco minutos para impedir batches simultáneos.

## Verificación y diagnóstico

- `npm run test:daily-market`: PostgreSQL real local (PGlite), proveedores, fechas, cambio de divisa, permisos, sesiones revocadas, aislamiento entre cuentas, publicación atómica y fallos parciales.
- `npm run test:daily-market-ui`: Chromium con Auth y transporte simulados, sin llamadas reales; requiere Vite en `127.0.0.1:5178` con URL/clave publicables de fixture y sincronización cloud activada. Comprueba precios guardados, histórico, Fidelity y diseño móvil.
- `portfolio_private.market_runs`: resultado, recuentos y errores de cada ejecución. `net._http_response` y `cron.job_run_details`: transporte y programación.
- Para consultar el endpoint desde Cron, reutilizar los secretos dentro de SQL como hace `configure_daily_market_job`; no copiar credenciales a scripts públicos.

Activado en `hocuefrnotspaejtmpsw` el 6 de octubre de 2026. Primera ejecución completa: 22 instrumentos, cero fallos y dos valoraciones privadas. NAV del benchmark disponible: 14,6592 EUR, fechado el 5 de octubre de 2026. Los cambios del frontend se integran mediante la rama `feature/daily-market-data` basada en `dev`.
