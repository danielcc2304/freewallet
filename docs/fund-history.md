# Históricos de fondos

`getAssetChartData` consulta dos fuentes independientes para ISIN de fondos: Yahoo (búsqueda por ISIN y, si hace falta, por la clase verificada de Finect) y Financial Times. Se usa la primera serie válida de al menos dos observaciones y se cancela la otra consulta. Un error, una respuesta vacía o una cotización aislada no ganan la carrera. El plazo total está limitado a 15 segundos; cerrar el modal o cambiar de período cancela ambas fuentes.

FT se consulta por las rutas same-origin `/__market/ft/funds/tearsheet/summary` y `/__market/ft/chartapi/series`, configuradas tanto en Vite como en Vercel. La ficha debe vincular inequívocamente el ISIN exacto, la clase, el identificador numérico y su divisa nativa. La serie debe corresponder al mismo identificador/clase/divisa, ser un fondo abierto (`OF`) y devolver cierres positivos finitos con días contables válidos, únicos y no futuros. No se sustituyen clases ni se toma una cotización bursátil de otro instrumento. Se conservan todos los decimales; no se reconstruye un gráfico desde rentabilidades ni se interpolan precios ausentes.

**Redirección de la ficha:** al consultar solo el ISIN, FT puede responder con un 302 relativo a `/data/funds/tearsheet/summary?s=ISIN:DIVISA`. Ese endpoint exacto también está configurado en Vite y Vercel, antes del fallback de la aplicación. Se conserva la divisa resuelta por FT, sin forzar EUR ni abrir un proxy genérico `/data/*`. El 18/10/2026 se comprobó que, sin esta ruta, el navegador acababa recibiendo el HTML de FreeWallet y rechazaba la identidad del Robeco, aunque el proveedor sí tuviera histórico. El arreglo de Vercel requiere desplegar la configuración; no depende del batch ni de una migración de base de datos.

La validación de FT es compartida con la lectura diaria de NAV del backend; esta última sigue exigiendo EUR. El cliente puede mostrar históricos de una clase en otra divisa, identificada expresamente en la ficha y en la serie. El pie del gráfico indica Financial Times o Yahoo según los datos recibidos.

La petición mantiene el período seleccionado e incluye un cierre anterior como base cuando existe. En 1D se muestran los últimos dos NAV disponibles, no datos intradía inventados. YTD empieza el 1 de enero; los desplazamientos mensuales respetan finales de mes y bisiestos. «Máx» solicita cobertura desde 1900, limitada a 50.000 días. La fecha visible corresponde al NAV, no al timestamp de consulta ni a un ajuste de zona horaria.

Yahoo también reintenta en su segundo host cuando el primero falla o no devuelve timestamps. Las búsquedas por nombre siguen requiriendo coincidencia de clase; no se han relajado para hacer encajar un fondo. La caché guarda series válidas, y «Reintentar consulta» renueva la resolución de ambas fuentes.

## Caso Robeco y verificación

El 17/10/2026, Yahoo devolvía para `LU0329355670` una respuesta `MUTUALFUND` de Stuttgart con precio actual pero sin timestamps ni cierres. FT confirmó la clase Robeco QI Emerging Markets Active Equities D EUR, 29 cierres diarios en la petición de 45 días y cobertura desde enero de 2008 en «Máx». Las respuestas públicas de regresión están en `scripts/fixtures/fund-history`; no contienen datos de carteras personales.

La verificación pública del 18/10/2026 reprodujo el 302 tanto en FT como en producción: sin divisa, la ficha terminaba en el HTML de la SPA; con la URL canónica, FT devolvía la identidad correcta. La serie de 110 días devolvió 75 cierres entre el 01/07/2026 y el 15/10/2026, el último a 399,92 EUR, aceptados por el parser compartido. La prueba del proxy usa las definiciones reales de Vite y un proveedor local que devuelve el mismo 302, comprueba clases EUR/USD/GBP y valida la ruta de Vercel antes del fallback. El recorrido de navegador también sigue la redirección y comprueba reintentos y períodos con Yahoo sin histórico.

La comprobación en vivo de otros diez ISIN obtuvo históricos verificados de FT en nueve. Para Carmignac Portfolio Credit, FT no devolvió una identidad verificable y se rechazó; Yahoo sí ofreció la serie EUR de su clase NAV. La disponibilidad de las fuentes puede cambiar: si ninguna aporta dos datos válidos se conserva el estado de no disponible, sin fabricar precios.

```
node --import tsx scripts/test-fund-history.ts
node --import tsx scripts/test-fund-history-proxy.ts
node --import tsx scripts/test-financial-times-funds.ts
node --import tsx scripts/test-fund-chart-resolution.ts
FREEWALLET_TEST_URL=http://127.0.0.1:5192 PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium node --import tsx scripts/test-fund-chart-ui.ts
npm run test:smoke -- --only=test-fund-chart-ui.ts
```

Las pruebas cubren respuestas reales del Robeco, clase/divisa/identificador incorrectos, fechas y períodos, errores/cotizaciones aisladas/proveedores lentos, cancelaciones, once fondos en el modal y el botón de reintento en móvil y escritorio.
