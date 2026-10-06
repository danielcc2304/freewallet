# Histórico importado, gráficos y exposición consolidada

El aviso de vinculación aparece cuando hay histórico importado pero todavía no consta que pertenezca a las posiciones actuales. La confirmación evita unir el histórico de otra cartera. Ahora usa una tarjeta con texto breve y un botón adaptado a móvil; al confirmar guarda el vínculo y desaparece.

Para Nextil, la posición directa `NXTE.XD` puede no tener ISIN, mientras que Evercapital comunica Nueva Expresión Textil con `ES0126962069`. Se reconocen los alias verificados de esta acción y se suman las fuentes en una única exposición: valor directo + valor de cada fondo × peso comunicado. Los valores consolidados muestran céntimos. Los porcentajes no publicados permanecen en el resto sin desglosar.

Para otros activos, una fuente sin ISIN puede vincularse a un único ISIN comunicado para el mismo nombre normalizado. Si hay ISINs distintos, no se fusionan; las coincidencias basadas solo en nombre siguen etiquetadas como aproximadas.

Yahoo devuelve un único punto para `NXTE.XD` en el histórico anual consultado. `B02.F` corresponde a Nueva Expresión Textil en Frankfurt y dispone de histórico en EUR. El gráfico puede usar esta cotización alternativa, conservando el símbolo y el precio de la posición original y mostrando la procedencia. La búsqueda de alternativas exige la identidad de la compañía; no sigue el ETF NXTE por compartir parte del símbolo. El eje vertical limita los decimales y dispone de espacio suficiente en móvil.

Verificación: `test:portfolio-composition` comprueba la suma exacta de Nextil y Evercapital, reconciliación del total y conflictos de ISIN. `test:dashboard-review` comprueba en Chromium la confirmación del Excel, una única fila consolidada, la cotización alternativa y el gráfico móvil con transporte simulado. Puede ejecutarse con `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` y Vite en `127.0.0.1:5177`; no lee ni modifica una cartera real.

Los cambios permanecen en `feature/daily-market-data`, basada en `dev`, sin PR abierta.
