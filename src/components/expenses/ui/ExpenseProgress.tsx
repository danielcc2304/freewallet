import { cn } from '../../../utils/cn';
import { money } from '../../../services/expensePlanner';

export function ExpenseProgress({
    value,
    limit,
    color,
}: {
    value: number;
    limit: number;
    color?: string;
}) {
    return (
        <div
            className={cn("tw:h-[8px] tw:rounded-[8px] tw:ui-fill-muted tw:overflow-hidden tw:m-[.8rem_0]", `expense-progress${value > limit && limit > 0 ? ' expense-progress--over' : ''}`)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
                limit > 0
                    ? Math.round(
                          Math.max(0, Math.min(100, (value / limit) * 100)),
                      )
                    : 0
            }
            aria-label={
                limit > 0 ? `${money(value)} de ${money(limit)}` : 'Sin límite'
            }
        >
            <span className={cn("tw:block tw:h-full tw:rounded-[inherit] tw:[background:var(--accent-primary)] tw:[transition:width_.2s]", value > limit && limit > 0 && "tw:[background:#fb7185]!")}
                style={{
                    width: `${limit > 0 ? Math.max(0, Math.min(100, (value / limit) * 100)) : 0}%`,
                    backgroundColor: color,
                }}
            />
        </div>
    );
}
