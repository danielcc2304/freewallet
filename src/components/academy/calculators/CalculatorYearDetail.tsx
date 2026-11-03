import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { calculatorToolClass as part } from './calculatorToolStyles';

interface Props {
    expanded: boolean;
    onToggle: () => void;
    label: ReactNode;
    value: ReactNode;
    gain: ReactNode;
    gainLabel: ReactNode;
    children: ReactNode;
}

export function CalculatorYearDetail({ expanded, onToggle, label, value, gain, gainLabel, children }: Props) {
    return <article className={cn(part('compound__detail-item'), expanded && part('compound__detail-item--open'))}>
        <button type="button" className={part('compound__detail-summary')} onClick={onToggle}>
            <div className={part('compound__detail-summary-main')}><span className={part('compound__detail-year')}>{label}</span><strong className={part('compound__detail-total')}>{value}</strong></div>
            <div className={part('compound__detail-summary-side')}><span className={part('compound__detail-yield')}>{gain}</span><span className={part('compound__detail-yield-label')}>{gainLabel}</span></div>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded && <div className={part('compound__detail-body')}><div className={part('compound__detail-grid')}>{children}</div></div>}
    </article>;
}
