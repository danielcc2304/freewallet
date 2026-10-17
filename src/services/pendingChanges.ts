import { portfolioStorage } from './portfolioCloudStorage';
import { expenseStore } from './expenseStore';

/** Kept outside route components: leaving a screen does not acknowledge data. */
export function hasPendingFinancialChanges() {
    return expenseStore.hasPending || expenseStore.getSnapshot().status === 'saving'
        || portfolioStorage.cloud && (portfolioStorage.busy || ['error', 'conflict'].includes(portfolioStorage.getSnapshot().status));
}
export function assertSafeToSignOut() {
    if (expenseStore.hasPending || expenseStore.getSnapshot().status === 'saving')
        throw new Error('Tienes gastos sin guardar. Abre Gastos y presupuesto para reintentar o exportar la copia antes de salir.');
    if (portfolioStorage.busy || portfolioStorage.currentRevision >= 0 && ['error', 'conflict'].includes(portfolioStorage.getSnapshot().status))
        throw new Error('Exporta tus cambios pendientes y recupera la cartera antes de salir.');
}
