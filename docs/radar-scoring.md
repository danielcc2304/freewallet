# Puntuación del radar por estrategia

La antigua división rentabilidad/volatilidad no se utiliza como sustituto de métricas que necesitan series históricas. No se migra automáticamente una nota antigua ni se elige un benchmark por marca o por el nombre del fondo.

## Configuración editorial

En «Editar fondo → Método y referencia de comparación» se selecciona un método:

- Monetario: exceso de CAGR neto frente a una referencia monetaria adecuada.
- Indexado: menor error total de seguimiento frente al índice o vehículo de réplica adecuado.
- RV activa: ratio de información frente a una referencia representativa.
- Renta fija/mixtos: Sortino frente a un objetivo anual explícito y constante durante el periodo. No se supone un objetivo cero ni se lo presenta como un tipo libre de riesgo histórico.

Se debe verificar la divisa y confirmar que el fondo y su referencia son clases de acumulación. Una clase de reparto requiere un histórico de rentabilidad total que este flujo de NAV no suministra; no debe marcarse como acumulación. Los ISIN de referencia corresponden a vehículos: sus costes y tracking difference afectan a los resultados; no se afirma que sean el índice puro.

La configuración se guarda en `fund_radar_catalog.extra.comparison` con los permisos editoriales existentes. No requiere migrar la base de datos. Los históricos se consultan con el servicio de gráficos existente, con dos trabajadores y una consulta compartida por identificador; los resultados del servicio aprovechan su caché. No se añaden batches ni se ejecuta una actualización masiva del catálogo. Finect sigue suministrando métricas y la subcategoría.

## Periodo y fórmulas

Se exigen 37 cierres mensuales consecutivos para obtener 36 retornos. El último es el del mes anterior, no el mes en curso. Fondo y referencia deben coincidir en fecha. Se admite hasta siete días naturales entre el último dato y el fin de mes para festivos y fines de semana. No se interpola ni se rellenan huecos. Una divisa explícita distinta se rechaza; para series sin etiqueta de divisa se exige la verificación editorial y la divisa de la clase publicada en sus métricas.

Con retornos mensuales decimales `r`, referencia `b`, exceso `a=r−b`, `n=36`, desviación típica muestral `s`:

- Monetario: `100 × [(NAV_final/NAV_inicial)^(12/n) − (REF_final/REF_inicial)^(12/n)]`, en puntos porcentuales anuales.
- Indexado: `−100 × sqrt(12 × media(a²))`. El cero es óptimo. Este error incorpora sesgo y variabilidad; no es solo tracking error.
- RV activa: `sqrt(12) × media(a) / s(a)`.
- Sortino: objetivo mensual `t=(1+objetivo_anual/100)^(1/12)−1`; `sqrt(12) × media(r−t) / sqrt(media(min(r−t,0)²))`. El denominador usa todos los meses, incluidos los que no tienen déficit.
- Tracking error informativo: `100 × sqrt(12) × s(a)`.
- Volatilidad informativa: `100 × sqrt(12) × s(r)`.
- Caída máxima informativa: mayor caída del NAV respecto a su máximo previo, observada entre cierres mensuales; no equivale a una caída máxima diaria.

No se redondea antes de presentar. Los denominadores nulos o numéricamente insignificantes no generan ratios infinitos. No se calcula Treynor universalmente ni se deduce beta a partir de volatilidad agregada. El TER ya está en el NAV y no se resta otra vez.

## Nota relativa

Se comparan exclusivamente fondos con igual categoría general, subcategoría Finect, método, divisa, referencia (o meta de Sortino), fechas inicial/final. Si falta una subcategoría verificable se puede mostrar la métrica medida, pero no su nota.

Se mantiene la transformación continua por mediana y MAD (`categoryScores`): 50 es el centro del grupo, no un aprobado. El suelo de dispersión de 0,5 se expresa en unidades del indicador: puntos porcentuales para monetarios/indexados y unidades de ratio para IR/Sortino. Su objetivo es evitar exagerar diferencias mínimas. Dos a cuatro fondos producen nota provisional; uno no tiene nota. No comparar notas entre grupos. Los filtros no cambian los grupos ni los cálculos.

Una nota no mide todos los riesgos: crédito, liquidez y duración deben revisarse por separado. Hasta configurar las referencias y disponer de histórico suficiente, las fichas existentes muestran la razón de no disponibilidad en vez de conservar una puntuación aparente.

## Verificación

`test-radar-performance.ts` contrasta las fórmulas con cálculos independientes y verifica cobertura, fechas, divisas, históricos antiguos, denominadores nulos, comparabilidad y validación editorial. `test-fund-radar.ts` conserva las comprobaciones de clases, parsing y actualización autenticada. `test-fund-radar-ui.ts` verifica permisos, ausencia de notas inventadas, guardado de configuración y layouts.
