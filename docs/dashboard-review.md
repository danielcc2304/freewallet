# Histórico importado, gráficos y exposición consolidada

El aviso de vinculación aparece cuando hay histórico importado pero todavía no consta que pertenezca a las posiciones actuales. La confirmación evita unir el histórico de otra cartera. Ahora usa una tarjeta con texto breve y un botón adaptado a móvil; al confirmar guarda el vínculo y desaparece.

Para Nextil, la posición directa `NXTE.XD` puede no tener ISIN, mientras que Evercapital comunica Nueva Expresión Textil con `ES0126962069`. Se reconocen los alias verificados de esta acción y se suman las fuentes en una única exposición: valor directo + valor de cada fondo × peso comunicado. Los valores consolidados muestran céntimos. Los porcentajes no publicados permanecen en el resto sin desglosar.

Para otros activos, una fuente sin ISIN puede vincularse a un único ISIN comunicado para el mismo nombre normalizado. Si hay ISINs distintos, no se fusionan; las coincidencias basadas solo en nombre siguen etiquetadas como aproximadas.

Yahoo devuelve un único punto para `NXTE.XD` en el histórico anual consultado. `B02.F` corresponde a Nueva Expresión Textil en Frankfurt y dispone de histórico en EUR. El gráfico puede usar esta cotización alternativa, conservando el símbolo y el precio de la posición original y mostrando la procedencia. La búsqueda de alternativas exige la identidad de la compañía; no sigue el ETF NXTE por compartir parte del símbolo. El eje vertical limita los decimales y dispone de espacio suficiente en móvil.

Verificación: `test:portfolio-composition` comprueba la suma exacta de Nextil y Evercapital, reconciliación del total y conflictos de ISIN. `test:dashboard-review` comprueba en Chromium la confirmación del Excel, una única fila consolidada, la cotización alternativa y el gráfico móvil con transporte simulado. Puede ejecutarse con `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` y Vite en `127.0.0.1:5177`; no lee ni modifica una cartera real.

Los cambios permanecen en `feature/daily-market-data`, basada en `dev`, sin PR abierta.

## Validez de valoraciones y resultados

Una consulta reciente ya no permite guardar una valoración verificada con un precio sin fecha, futuro o caducado. Se aplican los mismos márgenes del batch: siete días para fondos, cuatro para acciones y ETF y dos para criptoactivos. La consulta al proveedor se exige por separado; la fecha del precio no la sustituye.

Las cotizaciones conservan `checkedAt` cuando se obtienen del proveedor, también al usar las cachés de Finect o de mercado. La app registra aparte `lastReadAt`, mantiene la procedencia y muestra ambos tiempos en el detalle. Leer la actualización diaria no genera nuevos puntos verificados, ni persistidos ni en el cálculo del gráfico. Se incorporan las valoraciones que ya guardó el batch en su fecha original. La consulta automática cada cinco minutos no se presenta como una cotización en tiempo real. Los precios del batch pueden usarse durante 36 horas desde su consulta real, además del límite de antigüedad de cada tipo de activo.

El resumen distingue coste de posiciones abiertas, resultado no realizado, realizado y total. El realizado se calcula con coste medio por posición y conserva las ventas de activos cerrados; el total suma ambos resultados. El porcentaje mostrado corresponde únicamente al coste abierto. La rentabilidad por periodo continúa calculándose aparte con sus controles de flujos e histórico.

Antes de modificar por primera vez una posición importada sin operaciones, se conserva su cantidad y coste inicial en el registro. No se reconstruyen compras inexistentes para ventas antiguas: si faltan costes, hay duplicados, retiradas sin venta, una corrección previa a la venta o diferencias con las posiciones actuales, realizado y total aparecen como no disponibles. El no realizado sigue correspondiendo a las posiciones abiertas. El alcance son las operaciones registradas; no se inventan ganancias anteriores a una importación ni gastos o impuestos ausentes de sus importes. El resumen sigue visible después de cerrar todas las posiciones.

`test:dashboard-results` verifica ventas parciales y totales, coste medio con compras sucesivas, pérdidas, gastos registrados, flujos futuros, registros incompletos y límites de fechas. `test:dashboard-results-ui` registra ventas sobre una posición importada, comprueba la conservación de su coste, el resultado después del cierre completo y el diseño a 320/390 px. `test:daily-market-ui` comprueba los tiempos originales del proveedor y la ausencia de nuevas valoraciones al leer el batch. Todo usa datos sintéticos y transporte simulado.

La migración `portfolio_opening_basis` está aplicada en Supabase. Permite añadir el coste inicial junto con una sola operación real únicamente si identidad, cantidad, precio y fecha coinciden con la posición bloqueada del servidor y no existían operaciones previas. Mantiene el registro inmutable, las revisiones, el aislamiento entre cuentas y la denegación de acceso directo. No modifica posiciones ni operaciones existentes. `test:portfolio-backend` ejecuta la migración real y comprueba la primera venta, reintentos y rechazos de costes falsificados o compras adicionales.
