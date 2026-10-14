# Calculadora de bonos: auditoría financiera

## Modelo y alcance

Precio cotizado en porcentaje del nominal; bono de cupón fijo con reembolso del nominal al vencimiento. Los cupones ordinarios se construyen hacia atrás desde el vencimiento, con la frecuencia elegida y conservación de fin de mes. La liquidación excluye los pagos de ese día y los anteriores.

Los importes se expresan en unidades de la divisa del nominal; no hay conversión de moneda. La referencia independiente requiere Python 3 (biblioteca estándar); el motor de la aplicación no depende de Python.

La emisión no ancla el calendario. Es opcional para un bono regular ya emitido; cuando se necesita valorar el primer cupón irregular, el campo representa el **inicio contractual del devengo**, que puede diferir de la emisión. Las fechas opcionales de primer cupón y último cupón anterior al vencimiento permiten definir devengos cortos y largos. El primer cupón debe pertenecer al calendario ordinario; para un último cupón irregular, el último cupón ordinario se convierte en el ancla del calendario. Los stubs se prorratean mediante periodos de cupón de referencia.

No modela amortización intermedia, cupones variables, indexación, defaults, opciones call/put, periodos ex cupón ni desplazamientos por días hábiles. Un calendario contractual que no siga estas reglas requiere sus flujos explícitos. El resultado es YTM, no yield to worst, ni una promesa de rentabilidad realizada o ajustada por inflación.

## Errores anteriores

- El calendario se anclaba a la emisión. Podía desplazar todos los pagos y añadir un cupón completo en un vencimiento que solo estaba unos días después del último pago generado.
- Los exponentes eran `yearFraction(settlement, payment) * frequency`, en vez de la fracción hasta el próximo cupón más los periodos ordinarios restantes. Esto distorsionaba el descuento entre cupones y alrededor de años bisiestos.
- La entrada estaba rotulada `% s/ par` pero se usaba directamente como importe. La TIR cambiaba artificialmente al modificar el nominal.
- No se ofrecía 30/360 US; tampoco se distinguía la TIR nominal de la efectiva.
- El solver podía devolver su último intento sin comprobar convergencia. Los periodos irregulares recibían un cupón completo.

La conversión `dirty = clean + accrued` del modo avanzado **ya existía** y utilizaba precio sucio para resolver. No se atribuye el fallo a una doble suma del cupón corrido.

## Fórmulas

Para nominal `F`, cupón anual decimal `c`, frecuencia `m` y cotización porcentual `q`:

```text
Importe cotizado = F × q / 100
Cupón periódico C = F × c / m
E = dayCount(último cupón, próximo cupón)
A = dayCount(último cupón, liquidación)
D = dayCount(liquidación, próximo cupón)
Cupón corrido = C × A/E
w = D/E
Precio sucio = precio limpio + cupón corrido
Precio sucio = Σ CF_i / (1 + y_nominal/m)^(w+i)
y_nominal = m × periodicYield
y_effective = (1 + periodicYield)^m − 1
```

Si se introduce precio sucio, se conserva ese importe sin sumarle de nuevo el cupón corrido; el limpio se deriva restándolo. Para cupones regulares, todos los pagos son `C` salvo el último, `F+C`. Para stubs, los importes y exponentes se calculan sobre los periodos ordinarios de referencia; un cupón corto o largo no recibe automáticamente `C`.

Actual/365 fijo y Actual/360 cuentan días reales y dividen por 365 y 360 al informar fracciones de año. Al normalizarlos por la duración del **mismo periodo de cupón**, ese divisor se cancela en `A/E` y `D/E`: ambas convenciones dan el mismo resultado en este modelo periódico. No se está empleando una TIR XIRR con descuento anual efectivo por días.

30E/360 Eurobond limita ambos días 31 a 30, sin convertir automáticamente finales de febrero. 30/360 US NASD/SIFMA ajusta el día inicial 31 o final de febrero a 30; ajusta el día final 31 cuando el inicial ajustado es 30, y ambos finales de febrero a 30. No se confunde con 30E/360 ISDA.

El solver usa Newton y bisección en `x = log(1 + y/m)`, evaluando el valor presente mediante log-sum-exp. Esto mantiene el dominio `y > -m` y evita overflow al buscar yields negativas. Solo publica una raíz cuyo error relativo de precio está dentro de la tolerancia de convergencia; no redondea los flujos ni los periodos. Los redondeos se realizan en la interfaz.

## CoreWeave USU2069EAB66: regresión, no calibración

Entradas: limpio 84,30%, nominal 100, cupón anual 9%, semestral; liquidación 2026-10-14, emisión 2025-07-25, vencimiento 2031-02-01, 30/360 US.

| Magnitud | Anterior | Corregido |
|---|---:|---:|
| Último cupón | 2026-07-25 | 2026-08-01 |
| Próximo cupón | 2027-01-25 | 2027-02-01 |
| Cupón corrido | 1,975 | 1,825 |
| Precio sucio | 86,275 | 86,125 |
| Pagos futuros | 10 | 9 |
| YTM nominal anual | 14,816662% | 13,97022952976916% |
| YTM efectiva anual | No mostrada | 14,45814781255525% |

El cálculo anterior se reprodujo con 30E/360, ya que no existía US; para las fechas utilizadas por ese calendario sus diferencias de fin de mes no afectan a esa reproducción.

Periodo de cupón: 180 días. Devengo: 73 días. Restante: 107 días. Cupón por pago: 4,5. Fracción inicial: `107/180 = 0,594444444444…`.

| Pago | Exponente | Flujo |
|---|---:|---:|
| 2027-02-01 | w | 4,5 |
| 2027-08-01 | w+1 | 4,5 |
| 2028-02-01 | w+2 | 4,5 |
| 2028-08-01 | w+3 | 4,5 |
| 2029-02-01 | w+4 | 4,5 |
| 2029-08-01 | w+5 | 4,5 |
| 2030-02-01 | w+6 | 4,5 |
| 2030-08-01 | w+7 | 4,5 |
| 2031-02-01 | w+8 | 104,5 |

La implementación independiente utiliza Python Decimal con 50 dígitos y bisección pura sobre la rentabilidad periódica, sin importar código de la aplicación. Da `r = 0,06985114764884580111464177599458848543218850781675`. El JSON de referencia conserva calendario, flujos, exponentes y yields; no interviene en el código de producción.

Si una fuente externa discrepa, deben coincidir cotización bid/ask/mid, fecha de liquidación, limpio/sucio, nominal/efectiva, day-count y vencimiento/call. No se han ajustado constantes para igualar una cotización externa.

## Validación y archivos

- `src/services/bondCalculator.ts`: motor financiero independiente de la interfaz.
- `src/components/academy/calculators/BondCalculator.tsx` y `.css`: opciones US y stubs, resultados nominal/efectivo y detalles cerrados por defecto.
- `scripts/test-bond-calculator.ts`: regresiones numéricas y casos límite.
- `scripts/verify-coreweave-bond.py` y `scripts/fixtures/coreweave-bond-reference.json`: referencia independiente.
- `scripts/test-bond-calculator-ui.ts`: comprobaciones en navegador, precio sucio, escala del nominal, persistencia y móvil.
- `package.json`: comandos de pruebas.

Ejecutar `npm run test:bond-calculator`, `npm run test:bond-calculator-ui` con un servidor Vite local, `npx tsc -b`, ESLint sobre los archivos modificados y `npm run build`.
