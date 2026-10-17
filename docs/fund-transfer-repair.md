# Reparación administrativa de un traspaso confirmado

`portfolio_private.support_repairs` guarda el estado previo necesario para revisar o revertir una reparación autorizada por el titular. Está en un esquema privado, con RLS y sin permisos para visitantes, cuentas autenticadas ni el worker. No existe un endpoint ni una función privilegiada accesible desde la aplicación. El respaldo se elimina junto con la cuenta del usuario.

El script `scripts/ops/repair-confirmed-fund-transfer.sql` cubre un caso deliberadamente limitado: traspaso completo desde una posición cerrada, fondo de destino nuevo y una edición manual posterior incorrecta. Rechaza operaciones posteriores, otras ventas o correcciones en el origen, diferencias entre coste y compras registradas, fechas/importes incoherentes y revisiones concurrentes. No reconstruye lotes fiscales ni fechas desconocidas.

Se proporciona JSON en `freewallet.transfer_repair` con `set_config(..., true)` dentro de una transacción administrativa. Campos: `repairId`, `userId`, `expectedRevision`, `transferId`, `correctionId`, `sourceIsin`, `destinationIsin`, `sourceUnits`, `sourcePrice`, `destinationUnits`, `destinationPrice`, `gross`, `sourceDate`, `destinationDate`, `sourceOrder`, `destinationOrder`, `expectedCurrentCost`. Los identificadores y documentos reales nunca se incluyen en los archivos del repositorio.

Antes de modificar datos:

1. Contrastar justificantes, documento canónico, tablas de posiciones/operaciones y cierres diarios.
2. Conservar el coste y fecha de adquisición originales. El precio ejecutado de suscripción no sustituye al coste heredado. Las participaciones deben ser las confirmadas por la entidad; el efectivo puede incluir redondeos de céntimos por cada lote. El script limita el descuadre de comprobación a dos céntimos y no inventa comisiones.
3. Ejecutar primero el bloque dentro de `BEGIN` / `ROLLBACK`. Ante un rechazo se investiga la causa; no se eliminan sus controles para forzar una reparación.
4. Aplicar mediante `BEGIN` / `COMMIT` únicamente después de comprobar la simulación. Guardar el identificador de reparación en el registro de soporte privado.

La transacción archiva el documento completo, las posiciones/operaciones afectadas y los cierres/entradas de ledger anteriores. Rectifica participaciones y efectivo del traspaso, retira la edición errónea del ledger operativo y conserva su original en el respaldo. Calcula el nuevo coste unitario como coste heredado / participaciones confirmadas, sin reconocer una venta ni una aportación externa. El traspaso consolidado queda fechado al completarse la suscripción; ambas fechas de ejecución y referencias se conservan en el documento y las notas.

También reexpresa los cierres que contenían el destino y elimina la edición descartada de su pertenencia al ledger. Mantiene sus precios observados y fechas de consulta. Corrige `snapshot_ledger` para que el siguiente batch no rechace el documento por diferencias con su copia inmutable. Conserva los cierres anteriores al traspaso, Excel, preferencias y otros activos/cuentas. Incrementa una sola vez la revisión de cartera para impedir que un navegador con una copia anterior sobrescriba la reparación.

Después de aplicar, verificar documento/tablas, participaciones, coste total, fechas, ausencia de la edición operativa, cierres y coincidencia de payloads del snapshot ledger. Repetir el mismo `repairId` no aplica el cambio dos veces. La cuenta debe recargar su cartera para obtener la nueva revisión.

Verificación aislada (sin escrituras en cuentas reales):

```
node --import tsx scripts/test-transfer-repair.ts
```

Cubre guardas, rollback, idempotencia, restricciones de lectura, precisión de unidades/efectivo, conservación del coste y fecha, ausencia de ganancia realizada, consistencia de cierres y aislamiento de otros activos/cuentas.
