# Gastos y presupuesto

Ruta `/academy/expenses`, acceso directo en Herramientas. Implementación cargada de forma diferida para no añadir el módulo a la carga inicial del Dashboard.

## Cómo usarlo

1. En Cuentas y objetivos, indica el saldo inicial de tu cuenta antes del primer movimiento que vas a registrar. La cuenta inicial sin saldo permite empezar con un extracto histórico.
2. Añade gastos e ingresos o importa el CSV del banco. El asistente permite asociar columnas; acepta fechas ISO o DD/MM/AAAA, euros con coma o punto decimal, CSV con coma o punto y coma y campos entrecomillados. Revisa filas inválidas y coincidencias antes de confirmar.
3. Define un presupuesto mensual y límites opcionales por categoría. Puedes usar una base para meses sin presupuesto propio. Los grupos Necesidades, Deseos y Ahorro e inversión son editables.
4. Añade recurrentes para tus cobros y pagos habituales. Registra cada vencimiento cuando ocurra y corrige fecha e importe en el formulario. Pausar no borra movimientos anteriores; omitir descarta solo ese vencimiento. Borrar un pago registrado vuelve a dejar su vencimiento pendiente.
5. Exporta una copia JSON para conservar cuentas, categorías, movimientos, reglas, presupuestos y objetivos. El CSV contiene movimientos y se importa sobre las cuentas y categorías existentes. Restaurar JSON reemplaza el libro completo y exige confirmación.

## Cálculos

- Los importes son céntimos enteros, positivos en movimientos. Los saldos iniciales pueden ser negativos para representar deuda. No hay conversión de divisas ni conexión bancaria.
- Ingresos: únicamente los movimientos `income`. Gasto neto: `expense` menos `refund`. Balance del mes: ingresos menos gasto neto. Ahorro: balance dividido por ingresos, cuando hay ingresos; puede ser negativo.
- `transfer` resta saldo en origen y suma en destino sin afectar gasto, ingreso o ahorro. Una devolución aumenta el saldo y reduce el gasto de su categoría, en su fecha real de abono.
- El saldo incluye el saldo inicial y movimientos hasta hoy. Ningún movimiento puede ser anterior al saldo inicial de las cuentas afectadas. Los movimientos futuros no se incluyen en los resultados actuales.
- El presupuesto disponible es el límite menos gasto neto. El margen diario divide el margen no negativo entre los días restantes, incluido hoy. No se calcula para periodos cerrados.
- Los previstos combinan vencimientos sin registrar y movimientos futuros registrados del mes. Son un escenario de cumplimiento, no operaciones reales; una regla no confirmada manualmente puede coincidir con un gasto registrado de otra forma. Revisa y omite esos vencimientos para evitar contarlos dos veces en el escenario.
- Los vencimientos mantienen el día original: 31 de enero, 28/29 de febrero, 31 de marzo. Las reglas anuales del 29 de febrero usan el último día de febrero cuando es necesario. La clave regla + fecha prevista impide confirmar dos veces el mismo vencimiento.
- El coste mensual equivalente usa semanales × 52 / 12 y anuales ÷ 12. Es una normalización orientativa de reglas activas hoy (sin pausadas, finalizadas o aún no iniciadas), no gasto efectivo del mes.
- Los objetivos son reservas de planificación independientes del saldo. La aportación orientativa divide lo que falta entre los meses naturales restantes, incluido el actual; no registra aportaciones automáticas.
- En 50/30/20, los gastos de ahorro/inversión se muestran junto al balance disponible para contrastar el 20 %. Las transferencias internas no generan ahorro nuevo.

## Guardado y API

En modo local se usa `freewallet_expenses_v1`; los datos malformados no se sustituyen por un libro vacío. El límite es 2 MB, 10.000 movimientos, 30 cuentas, 100 categorías, 240 presupuestos, 200 reglas y 100 objetivos. El CSV admite hasta 100 columnas para mantener acotada la vista previa.

El modo de cuenta sigue `VITE_PORTFOLIO_CLOUD_ENABLED` y la sesión compartida de FreeWallet, pero **no usa la cartera, el CSV ni sus revisiones**. El libro privado se guarda en `expense_private.books`, referenciado a Auth, y sus recibos de idempotencia en `expense_private.receipts`. Las tablas tienen RLS y ningún acceso directo para `anon` o `authenticated`. Las funciones privadas verifican cuenta confirmada, sesión activa y MFA mediante la guardia de identidad ya existente; no dependen de tener posiciones de inversión.

| RPC autenticada | Argumentos | Respuesta |
| --- | --- | --- |
| `expense_read_book` | Ninguno | `{ revision, book }` o `null` |
| `expense_save_book` | `expected_revision`, `request_id`, `payload` | `{ revision, book }` |

La primera creación usa revisión `-1`; los guardados posteriores comparan revisión bajo un bloqueo por usuario. Un conflicto devuelve `40001`. Se conservan recibos compactos 90 días, con límite de 60 guardados/minuto. Repetir la petición original no repite la escritura y devuelve la versión actual si otro dispositivo avanzó después. Reutilizar un UUID con otro contenido se rechaza.

El transporte fija el token del propietario antes de enviar el libro; cambia de usuario o aborta sin enviar si la sesión cambió. Las respuestas tardías no entran en otra cuenta. El libro conectado permanece en memoria, sin guardar saldos en localStorage. Un guardado fallido conserva el contenido pendiente para reintentar con el mismo UUID o exportarlo. Resolver un conflicto cargando la versión del servidor requiere confirmación y descarta solo los cambios pendientes de esa pestaña. Sin conexión no se admiten nuevas escrituras cloud. En local se detecta si otra pestaña cambió el libro antes del guardado y se conserva el contenido pendiente ante conflictos o falta de espacio. Una copia JSON válida permite recuperar un registro local ilegible con confirmación. Los datos locales no se importan silenciosamente al iniciar sesión; usa una copia JSON si quieres trasladarlos.

Migración: `supabase/migrations/20261009000900_expense_books.sql`. En un proyecto nuevo, aplicar primero las migraciones existentes de Auth/cartera que definen `portfolio_private.require_user()`.

## Verificación

- `test:expense-planner`: cálculos en céntimos, presupuestos, transferencias, reembolsos, fechas, vencimientos y CSV, incluidas comillas, duplicados y neutralización de fórmulas.
- `test:expense-backend`: PostgreSQL local ejecuta la migración real; pruebas de aislamiento, permisos, sesión, MFA, revisiones, idempotencia y cascada. No utiliza cuentas ni sesiones reales.
- `test:expense-sync`: almacenamiento local/cloud, recuperación de errores, conflictos, cambio de cuenta y respuestas tardías con transporte simulado.
- `test:expense-ui`: navegador Chromium, recorridos de creación/edición/cancelación/borrado, recurrentes, presupuesto, cuentas, objetivos, importación y adaptación a 320/390/768 px. Capturas con datos sintéticos en `artifacts/expenses`.

Para las pruebas de interfaz arranca Vite con backend desactivado en `127.0.0.1:5255`, o indica otro servidor local mediante `FREEWALLET_TEST_URL`; configura `PUPPETEER_EXECUTABLE_PATH` si Chromium está instalado fuera de Puppeteer.
