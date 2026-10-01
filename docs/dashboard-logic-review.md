# Revisión de lógica del Dashboard — 2026-10-01

## Alcance

Revisión del código de resumen, tabla y detalle de activos, evolución, benchmark,
asignación, riesgo, controles, plan, resumen mensual, movimientos, rankings,
composición, persistencia y actualización de cotizaciones. Las métricas de
Portfolio relacionadas con el riesgo se revisaron para compartir las fórmulas.

## Correcciones

- **Resumen y evolución:** el porcentaje sin coste de referencia no se presenta
  como 0%; los indicadores no renderizan NaN. Se mantienen los periodos y las
  bases verificables compartidos, sin concatenar retornos a través de huecos.
- **Benchmark:** solicita cotizaciones y FX desde antes de la base efectiva,
  incluidas las necesarias de diciembre para YTD. Distingue el retorno completo
  de la cartera del retorno del tramo comparable; la diferencia solo usa fechas
  comunes. Prefiere cobertura completa frente a la prioridad del proveedor.
  Los cierres del Excel se alinean por día contable, no por su hora artificial;
  las valoraciones intradía reales conservan la restricción temporal.
- **Riesgo:** volatilidad muestral, Sharpe, Sortino, anualización y máximo drawdown
  comparten un servicio. Sortino usa todos los periodos para la desviación bajista.
  La tasa libre de riesgo procede del Excel, con fallback explícito de 2,75%.
  Los ratios propios no se recortan al histórico del benchmark: únicamente las
  métricas relativas emparejan meses. El drawdown del mapa se calcula sobre la
  rentabilidad ajustada por flujos, no sobre un saldo inflado por aportaciones.
- **Plan:** admite entrada decimal con punto o coma y conserva el texto durante
  la edición. Guarda objetivos por instrumento, migra los IDs anteriores que
  todavía pueden vincularse y agrupa lotes del mismo instrumento. Valida pesos,
  presupuesto y rangos; el reparto conserva exactamente los céntimos. La acción
  opcional «Usar pesos actuales» produce objetivos no negativos que suman 100%.
  No presupone objetivos personales ni registra compras al calcular la propuesta.
- **Histórico y resumen mensual:** correcciones duplicadas de una fecha no duplican
  aportaciones. Se reconocen meses completos y «Sept». El cierre de mes y la
  invalidación de caché siguen Europe/Madrid. Se distingue la cadencia mensual de
  la diaria, sin fabricar observaciones intermedias.
- **Tabla, detalle y rankings:** las rentabilidades sin cotización válida o base
  de coste no se presentan como 0%. El ranking excluye esas posiciones. Una
  cotización en divisa extranjera no se suma como euros: la valoración al coste
  queda identificada como estimación hasta disponer de conversión válida.
- **Composición:** conserva incluso residuos pequeños para reconciliar el 100%
  del valor, y separa la parte residual del fondo de las exposiciones identificadas.
  Los subyacentes no heredan la rentabilidad del fondo. Se mantienen identidad
  por ISIN, identificación de coincidencias aproximadas y consultas limitadas.
- **Controles, movimientos y refresco:** comprobados los errores de persistencia,
  sincronización entre pestañas, consultas externas desactivadas, reintentos,
  aborto y respuestas de periodos anteriores. Se conserva el refresco de cinco
  minutos, la vinculación local explícita del Excel y el ledger original.

## Fórmulas y criterios

El retorno mensual del libro sigue `(cierre − flujos − cierre anterior) /
cierre anterior`, que supone los flujos al final del mes. No es un TWR exacto
cuando los flujos ocurren durante el mes y faltan valoraciones en esas fechas.
Los retornos de los intervalos disponibles se encadenan geométricamente.
El drawdown es `índice / máximo anterior del índice − 1`.
Los ratios emplean meses cerrados válidos del último tramo consecutivo; mejor,
peor mes y porcentaje de meses positivos identifican el conjunto cerrado válido.
No se rellena un benchmark ni una valoración ausente con datos inventados.

## Verificación

- `scripts/test-dashboard-logic.ts`: regresiones nuevas de YTD 8,62%/6,04%,
  cobertura, cierres, paridad de riesgo, DCA, objetivos, lotes, redondeo,
  duplicados, calendario y reconciliación.
- Regresiones existentes: dashboard-audit, dashboard-integrity,
  portfolio-performance, workbook-continuity, import-benchmark-coverage,
  portfolio-composition, version-notice, compound-interest y Finect.
- Comprobación privada local de las 15 posiciones facilitadas: cantidades y
  costes exactos, totales, ponderaciones, conservación de datos y aportación.
  El fichero de comprobación está fuera de Git. Usa un escenario de precios al
  coste: no demuestra los precios actuales ni el histórico del móvil.
- TypeScript, ESLint y build de producción; prerender de las rutas configuradas.

## Límites comprobables

La revisión no certifica el histórico actual del móvil, su estado de localStorage
ni las cotizaciones servidas por terceros. No había una superficie de navegador
habilitada para la comprobación interactiva en esta ejecución. La recuperación
de objetivos cuyos IDs antiguos ya no tienen correspondencia requiere datos del
usuario; no se adivina. La cartera con efectivo necesita distinguir operaciones
internas de aportaciones externas para una contabilidad de flujos completa;
el ledger actual de compras/ventas no contiene esa distinción. Los intervalos
locales afectados muestran N/D en lugar de inventar una rentabilidad. Las compras
y ventas registradas no deben interpretarse automáticamente como depósitos y
retiradas de una cuenta de efectivo. El plan no incluye ventas, comisiones,
fiscalidad ni restricciones de compra del intermediario.
