# Radar de fondos

El radar (`/academy/fund-radar`) lee su catálogo de Supabase. `BEST_FUNDS` queda para otros módulos; el radar no lo usa como respaldo silencioso. La migración importa una sola vez los 20 registros existentes sin asignarles fechas de valoración inventadas.

## Datos y permisos

- `fund_radar_catalog`: ISIN único e inmutable por ficha, nombre, categoría y gestora editoriales, notas, enlace, métricas manuales, otros datos de referencia, modo automático/manual, estado y versión.
- `fund_radar_data`: observaciones Finect, fecha de cada métrica, ficha de origen, categoría y perfil del proveedor, fechas de consulta y éxito. El público no puede consultar los errores internos ni los identificadores de ejecución.
- `fund_radar_audit`: historial de altas, cambios, retiradas y restauraciones. Solo lo pueden consultar los editores; ningún cliente puede modificarlo directamente.

RLS permite consultar los fondos publicados sin iniciar sesión. `is_news_admin()` autoriza INSERT/UPDATE a los mismos editores y propietario de Noticias. Reutiliza la comprobación de cuenta confirmada, sesión vigente, revocación y MFA; no confía en `user_metadata`. Los visitantes tienen una política de lectura separada, sin ejecutar una función editorial a la que no tienen acceso.

Retirar cambia el estado, no borra el fondo. Los editores pueden restaurarlo desde el filtro Retirados. La escritura incluye la versión que el editor abrió: si otro cambió la ficha, la operación no sobrescribe sus datos y el formulario conserva el borrador. El servidor fija versión, fecha y autor; los clientes no pueden modificarlos ni borrar físicamente registros. Cambiar de ISIN exige otra ficha para no atribuir métricas a una clase diferente.

## Consulta diaria a Finect

`fund-radar-refresh` es una Edge Function independiente de `daily-market-data`. El cron `freewallet-fund-radar` se dispara a las 07:15/08:15 UTC; una comprobación `Europe/Madrid` deja pasar únicamente las **09:15 locales**, tanto en CET como en CEST. Reutiliza en servidor los secretos de Vault del dispatcher existente. La función HTTP usa autenticación propia: credencial del job comprobada en SQL o sesión de un editor activo; no basta con enviar cualquier cabecera.

Los editores también pueden solicitar la actualización de un fondo o del catálogo desde el radar. SQL concede una reserva de tres minutos, impide solapamientos y limita las consultas editoriales a una cada 15 minutos por ficha. El batch diario evita repetir consultas realizadas en las últimas 20 horas.

El proceso identifica la clase por ISIN exacto, consulta la ficha estructurada de Finect y usa su API como alternativa. No toma estadísticas de otra clase solo porque figure en una lista de clases disponibles. Lee YTD/1Y acumulados y 3Y/5Y anualizados, volatilidad/caída/Sharpe M36, TER, riesgo, NAV, divisa y perfil disponibles. Ejecuta hasta cuatro consultas concurrentes y reserva tiempo para publicar resultados. Una consulta incompleta conserva las métricas anteriores que no se hayan devuelto. No sustituye observaciones fechadas por otras anteriores o sin fecha y nunca interpreta un campo ausente como cero.

Cada métrica conserva la fecha del proveedor, que puede ser distinta a la consulta y a la de otros campos. Las comisiones sin fecha publicada se indican como tales. Los fallos conservan la última observación y se registran en servidor. La interfaz distingue la última consulta de la fecha de los valores. Finect puede retrasar o no publicar una estadística: el refresco diario no convierte por ello un dato antiguo en actual.

El actualizador solo modifica las observaciones del proveedor: no cambia nombre, categoría, notas, datos manuales ni preferencias de un editor. Con modo automático desactivado se excluye del batch y se usan exclusivamente los datos manuales. En automático, un dato no proporcionado puede seguir mostrando la referencia manual, con su fecha original o sin verificar.

## Clasificación

La base orientativa es:

```
retorno 3Y anualizado − 0,50 × volatilidad 3Y − 0,25 × |caída máxima 3Y|
```

Se transforma en percentil relativo, no en una rentabilidad prevista ni una valoración absoluta. El TER se muestra y permite ordenar, pero no se resta otra vez de retornos ya netos. El grupo exige misma categoría editorial, divisa y mes de rentabilidad; retornos y riesgo de 3 años, fechas verificadas, antigüedad máxima de 90 días y desfase máximo de 45 días entre métricas. La categoría del proveedor se muestra como información adicional: la agrupación editorial se puede adaptar desde la ficha.

Solo se puntúa con al menos cinco fondos elegibles en el grupo. Los empates comparten puesto y el percentil medio; un grupo uniforme obtiene 50, no un 90 arbitrario. Si no hay comparables suficientes se explica el motivo al abrir la ficha. No se comparan percentiles de distintas categorías. Un percentil cero no significa pérdida del capital: es la posición relativa dentro del grupo.

## Verificación y despliegue

```
node --import tsx scripts/test-fund-radar.ts
node --import tsx scripts/test-fund-radar-db.ts
FREEWALLET_TEST_URL=http://127.0.0.1:5191 node --import tsx scripts/test-fund-radar-ui.ts
```

Las pruebas SQL usan PGlite con el guard real de sesión/MFA; cubren visitantes, lectores, metadatos manipulados, editores revocados, bloqueo de versiones, retirada/restauración, columnas protegidas, reservas y conservación de datos. Las pruebas UI interceptan toda llamada externa y simulan las cuentas y las escrituras: no editan el catálogo real.

Las migraciones del radar y la Edge Function deben desplegarse antes del frontend. Las claves `service_role` permanecen exclusivamente en servidor. La comprobación real del 16/10/2026 actualizó los 20 fondos sin fallos y verificó lectura REST anónima y rechazo HTTP 401 de una petición al worker sin credenciales. Esto documenta esa ejecución, no garantiza la disponibilidad futura de Finect.
