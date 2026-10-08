# Calculadora de IRPF y sueldo neto 2026

Ruta `/academy/salary-calculator`, accesible directamente desde **Herramientas → IRPF y sueldo neto** y desde Calculadoras.

El motor puro está en `src/services/irpf/salaryCalculator.ts`; las reglas, escalas, mínimos y fuentes versionadas están en `taxData2026.ts`. No necesita backend, no escribe en Supabase y no guarda respuestas ni escenarios. El usuario puede descargar voluntariamente su desglose CSV.

## Qué calcula

- Neto anual en nómina, 12 pagas prorrateadas y 14 pagas con dos extras. La Seguridad Social de las extras se prorratea en las doce cotizaciones ordinarias.
- Retención inicial según el algoritmo AEAT 2026 aplicable desde el 10 de septiembre: gastos, reducción por rendimientos, mínimos, situaciones del Modelo 145, límite del 43 %, contratos inferiores al año, vivienda anterior a 2013 y deducción territorial cuando todo el sueldo cumple sus requisitos.
- Seguridad Social del trabajador: contingencias comunes, desempleo según contrato, formación, MEI y tres tramos de solidaridad. Bases mensuales mínima por grupo y máxima, con estimación proporcional de la mínima por jornada.
- Estimación individual de renta para las quince comunidades de régimen común y Ceuta/Melilla: cuotas estatal/autonómica, mínimos propios, gastos laborales, plan individual, pensión compensatoria, anualidades judiciales y deducción por salarios bajos de 2026 (590,89 € hasta 17.094 €, decreciente hasta 20.048,45 €).
- Retención manual, diferencia estimada entre renta y retenciones, calendario de cobros, coste empresarial, hasta tres escenarios inmutables y exportación CSV.

La comunidad de residencia no modifica la retención general AEAT. El resultado de la declaración se calcula aparte: aportar a un plan individual o introducir deducciones de renta no aumenta artificialmente el ingreso de la nómina.

## Alcance explícito

Un asalariado, un pagador, un año completo, Régimen General con cotización mensual y pagas de igual bruto. No se reconstruyen regularizaciones, varios pagadores, altas/bajas parciales, rentas del ahorro o de alquiler, autónomos, pagos en especie, horas extra, regímenes especiales, cotización diaria, tributación conjunta ni deducciones reembolsables o sus anticipos. La tarifa empresarial de accidentes de trabajo es editable y no incluye bonificaciones ni recargos de contratos muy cortos.

Los familiares añadidos deben cumplir las condiciones del mínimo (rentas, convivencia/dependencia y declaración); el reparto se aplica individualmente, con descendientes ordenados del mayor al menor. Se rechaza la combinación simplificada de alimentos y mínimos por descendientes para evitar atribuir ambos beneficios a un mismo hijo.

Navarra y los tres territorios vascos se identifican expresamente: permiten calcular el neto con una retención indicada por el usuario y la Seguridad Social. **No se aplica el algoritmo AEAT automáticamente ni se inventa una declaración foral.** La autoridad que retiene puede depender del lugar de trabajo; la interfaz enlaza con la Hacienda correspondiente.

Los importes de las nóminas se redondean a céntimos; el tipo AEAT se trunca a dos decimales. El cálculo anual y la suma de nóminas redondeadas pueden diferir algunos céntimos.

## Fuentes y mantenimiento

Reglas revisadas el 8 de octubre de 2026:

- [AEAT: algoritmo de retenciones 2026 desde el 10 de septiembre](https://sede.agenciatributaria.gob.es/static_files/Sede/Programas_ayuda/Retenciones/2026/Algoritmo%20Retenciones-2026_10sept.pdf).
- [Ministerio de Hacienda: tributación autonómica 2026, capítulo IV](https://www.hacienda.gob.es/sgfal/financiacionterritorial/autonomica/capitulo-iv-tributacion-autonomica-2026.pdf). Se guardan bases de inicio, cuotas acumuladas publicadas y tipos, en vez de reconstruir cuotas con redondeos distintos. La escala valenciana usada es la de 2026 y Extremadura incluye su modificación de 2026.
- [AEAT: particularidad del mínimo balear de mayores de 65 años](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c14-adecuacion-impuesto-circunstancias-personales/minimo-autonomico-personal-familiar/comunidad-autonoma-illes-balears.html): el mínimo general también aumenta a 6.105 € cuando procede.
- [Orden PJC/297/2026: bases y tipos de cotización](https://www.boe.es/eli/es/o/2026/03/30/pjc297).
- [Ley 35/2006 consolidada: gastos, mínimos, escalas y deducción de rentas del trabajo](https://www.boe.es/eli/es/l/2006/11/28/35/con/20261002).

El ejercicio está fijado a 2026: no se cambia automáticamente al comenzar otro año. Antes de añadir ejercicios deben verificarse conjuntamente retenciones, Seguridad Social, escalas y mínimos autonómicos y deducciones.

## Validación

`npm run test:salary-calculator` verifica ejemplos calculados independientemente, cuotas publicadas, mínimos familiares y autonómicos, límites, reparto de pagas, conservación de importes, deducciones y errores de entrada. `npm run test:salary-calculator-ui` comprueba entradas vacías, cambios de pagas/comunidad, escenarios, navegación, descarga y diseño en móvil/escritorio, temas claro/oscuro y apariencia estándar/Liquid Glass.
