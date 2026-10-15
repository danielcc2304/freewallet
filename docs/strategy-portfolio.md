# Estrategia y cartera

La sección de Academia es una herramienta educativa independiente del Dashboard. No importa, compra ni modifica posiciones reales. Las preferencias se guardan en `freewallet_strategy_preferences_v1` en el navegador y en los parámetros de la URL; no requieren Supabase.

Los modelos son ejemplos, no recomendaciones personalizadas ni réplicas de fondos. Sus filtros describen el conjunto de la cartera. Permanente, All-Weather y Cubos no se clasifican como conservadoras a 0–3 años. Los pesos Risk Parity son ilustrativos y no se presentan como contribuciones de riesgo calculadas. Los ejemplos con 80–100% de renta variable se clasifican como agresivos.

El catálogo muestra seis modelos inicialmente, permite comparar tres modelos originales y personalizar los siete bloques. Las cantidades son peso × capital. La normalización al 100% solo se realiza mediante una acción explícita, usando reparto de centésimas por restos mayores. No se permite simular hasta que todos los campos son válidos y los pesos suman 100% (tolerancia numérica 1e-8).

## Simulador por hipótesis

No usa series históricas ni pretende estimar una rentabilidad futura. Todos los rendimientos, volatilidades y choques son hipótesis editables. No incluye comisiones, fiscalidad, inflación ni apalancamiento. Cripto parte de una variación anual de ejemplo del 0%, no de una promesa de rentabilidad elevada.

- Variación anual: `Σ wᵢ × rᵢ`.
- Volatilidad: `√[(1−ρ) Σ(wᵢσᵢ)² + ρ(Σ wᵢσᵢ)²]`.
- Choque de cartera: `Σ wᵢ × choqueᵢ`.
- Valor después del choque: `capital × (1 + choqueCartera/100)`.

Pesos `w` en fracciones; hipótesis en porcentajes. La matriz de correlación común es semidefinida positiva para el intervalo admitido `ρ ∈ [0,1]`. No representa correlaciones estimadas ni coberturas negativas. La desviación típica no es una pérdida máxima ni un VaR. Los choques no son episodios históricos ni peores casos garantizados.

El traslado de modelos agrega subtipos por bloque: por ejemplo, All-Weather conserva 30% bolsa, 55% bonos, 7,5% oro y 7,5% materias primas. No conserva duración, regiones, divisas ni vehículos; esta limitación se muestra antes de los resultados. Oro, materias primas e inmobiliario tienen bloques propios, sin reasignación a bolsa o liquidez.

## Validación

- `npm run test:strategy-portfolio`: pesos de todos los modelos, filtros conservadores a corto plazo, covarianza contrastada mediante expansión independiente, extremos de correlación, choques, campos inválidos, normalización y traslado completo de pesos en URL.
- `npm run test:strategy-portfolio-ui`: navegación, filtros y persistencia, comparación, edición, normalización explícita, traslado de siete bloques, hipótesis y errores; tamaños móvil/escritorio y apariencias estándar/Liquid Glass.
