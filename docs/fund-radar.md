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

## Rentabilidad frente a riesgo

Las tarjetas destacan la rentabilidad anualizada a 3 años y muestran retornos YTD/1Y, TER, fechas y riesgo. «Retorno / volatilidad» es una medida continua, no una nota de calidad:

```
ratio = retorno 3Y anualizado (%) / volatilidad 3Y anualizada (%)
```

El cociente indica retorno anual por unidad de volatilidad. No es Sharpe: no se descuenta un tipo libre de riesgo supuesto. El TER no se resta de nuevo a retornos ya netos. La caída máxima y el Sharpe publicado se consultan por separado; no se mezclan mediante penalizaciones con pesos arbitrarios. Los ratios negativos conservan su signo y la volatilidad cero no genera un infinito ni una nota máxima.

El cálculo exige ventana de 3 años, divisa, fechas válidas y verificadas, antigüedad máxima de 90 días y desfase máximo de 45 días entre retorno y volatilidad. No exige compañeros en el catálogo: añadir, retirar o filtrar fondos no modifica el valor medido. Se conserva la precisión hasta la presentación.

El puesto opcional exige al menos cinco fondos elegibles con igual categoría **del proveedor**, divisa y mes de rentabilidad; en fichas manuales se usa la categoría editorial y se mantiene su grupo separado del automático. Una categoría del proveedor desconocida no se sustituye por una categoría editorial amplia. Los empates comparten puesto. El ratio sirve para estudiar estrategias y exposiciones similares, no para calificar la calidad de fondos con objetivos distintos.

La antigua escala de percentiles forzaba saltos 0/25/50/75/100 con cinco fondos. Azvalor aparecía en 25 por ocupar el cuarto lugar de una categoría editorial que mezclaba tecnología, value y capitalizaciones distintas. Con la observación del 14/10/2026, sus cifras de 17,40317 % anualizado y 15,45808 % de volatilidad producen 1,1258299866× (1,13× en pantalla). Es un ejemplo de regresión, no una excepción por marca ni un dato fijado en el catálogo.

## Verificación y despliegue

```
node --import tsx scripts/test-fund-radar.ts
node --import tsx scripts/test-fund-radar-db.ts
FREEWALLET_TEST_URL=http://127.0.0.1:5191 node --import tsx scripts/test-fund-radar-ui.ts
```

Las pruebas SQL usan PGlite con el guard real de sesión/MFA; cubren visitantes, lectores, metadatos manipulados, editores revocados, bloqueo de versiones, retirada/restauración, columnas protegidas, reservas y conservación de datos. Las pruebas UI interceptan toda llamada externa y simulan las cuentas y las escrituras: no editan el catálogo real.

Las migraciones del radar y la Edge Function deben desplegarse antes del frontend. Las claves `service_role` permanecen exclusivamente en servidor. La comprobación real del 16/10/2026 actualizó los 20 fondos sin fallos y verificó lectura REST anónima y rechazo HTTP 401 de una petición al worker sin credenciales. Esto documenta esa ejecución, no garantiza la disponibilidad futura de Finect.
