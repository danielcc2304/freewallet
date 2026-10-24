import { guidePartStyle } from './AcademyGuideParts.styles';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPanel } from './AcademyPanel';
import { riskParts } from './RiskManagementParts.styles';
import { strategyParts } from './StrategiesParts.styles';
import { scenarioParts } from './ScenariosParts.styles';
import { errorParts } from './CommonErrorsParts.styles';
import { valuationParts } from './ValuationGuideParts.styles';

type CopyProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title: ReactNode; description?: ReactNode };
/** Number, accessible section title and supporting copy shared by the long-form guides. */
export function AcademyNumberedHeading({
    variant,
    number,
    title,
    description,
    headingId,
    decorative,
    className,
    ...props
}: CopyProps & { variant: 'risk' | 'strategy'; number: ReactNode; headingId?: string; decorative?: boolean }) {
    const risk = variant === 'risk';
    return (
        <div
            {...props}
            className={cn(
                guidePartStyle('heading', risk ? 'risk-mgmt__section-heading' : 'strategies__section-heading'),
                className,
            )}
        >
            <span
                className={guidePartStyle('number', risk ? 'risk-mgmt__number' : 'strategies__number')}
                aria-hidden={decorative || undefined}
            >
                {number}
            </span>
            <div>
                <h2 id={headingId}>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
    );
}
export function AcademyRoadmap({
    variant,
    items,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & {
    variant: 'risk' | 'strategy';
    items: readonly { href: string; content: ReactNode }[];
}) {
    return (
        <nav
            {...props}
            className={cn(
                cn(
                    guidePartStyle('roadmap', variant === 'risk' ? 'risk-mgmt__roadmap' : 'strategies__roadmap'),
                    variant === 'risk' && 'tw:[&_svg]:shrink-[0] tw:[&_svg]:text-accent',
                ),
                className,
            )}
        >
            {items.map((item) => (
                <a key={item.href} href={item.href}>
                    {item.content}
                </a>
            ))}
        </nav>
    );
}
export function AcademyInsight({
    variant,
    icon,
    children,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & { variant: 'risk' | 'strategy'; icon: ReactNode }) {
    return (
        <aside
            {...props}
            className={cn(
                guidePartStyle('insight', variant === 'risk' ? 'risk-mgmt__insight' : 'strategies__insight'),
                className,
            )}
        >
            {icon}
            <p>{children}</p>
        </aside>
    );
}
/** Label and explanatory text, keeping the guides' distinct takeaway treatments. */
export function AcademyCopyDetail({
    variant,
    label,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement> & { variant: 'riskTakeaway' | 'riskAction' | 'strategyEntry'; label: ReactNode }) {
    const takeaway = variant === 'riskTakeaway';
    return (
        <div
            {...props}
            className={
                variant === 'strategyEntry'
                    ? strategyParts('strategies__entry-detail')
                    : riskParts(takeaway ? 'risk-mgmt__takeaway' : 'risk-mgmt__action')
            }
        >
            <strong>{label}</strong>
            {takeaway ? children : <p>{children}</p>}
        </div>
    );
}
export function AcademyGuideFacts({
    items,
    ...props
}: HTMLAttributes<HTMLDListElement> & { items: readonly { label: ReactNode; value: ReactNode }[] }) {
    return (
        <dl {...props} className={strategyParts('strategies__facts')}>
            {items.map((item, i) => (
                <div key={i}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}
export function AcademyIdentityHeading({
    variant,
    emoji,
    title,
    ...props
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & { variant: 'scenario' | 'error'; emoji: ReactNode; title: ReactNode }) {
    return variant === 'scenario' ? (
        <header {...props} className={scenarioParts('scenario-card__header')}>
            <div className={scenarioParts('scenario-card__emoji')}>{emoji}</div>
            <h2 className={scenarioParts('scenario-card__title')}>{title}</h2>
        </header>
    ) : (
        <header {...props} className={errorParts('error-detail-card__header')}>
            <div className={errorParts('error-detail-card__emoji')}>{emoji}</div>
            <h2 className={errorParts('error-detail-card__title')}>{title}</h2>
        </header>
    );
}
export function AcademyScenarioSection({ title, children, ...props }: CopyProps) {
    return (
        <section {...props} className={scenarioParts('scenario-section')}>
            <h3>{title}</h3>
            <div className={scenarioParts('scenario-section__content')}>{children}</div>
        </section>
    );
}
export function AcademyActionCard({
    tone,
    icon,
    title,
    children,
    ...props
}: CopyProps & { tone: 'do' | 'dont'; icon: ReactNode }) {
    return (
        <div {...props} className={cn(scenarioParts('action-card'), tone)}>
            <div className={scenarioParts('action-card__icon')}>{icon}</div>
            <div className={scenarioParts('action-card__text')}>
                <h4>{title}</h4>
                <p>{children}</p>
            </div>
        </div>
    );
}
export function AcademyErrorDetail({
    tone,
    title,
    children,
    ...props
}: CopyProps & { tone: 'consequence' | 'solution' }) {
    return (
        <AcademyPanel {...props} variant="errorDetail" className={cn(errorParts('error-sub-box'), tone)}>
            <h5>{title}</h5>
            <p>{children}</p>
        </AcademyPanel>
    );
}
export function AcademyValuationFormula({
    title,
    formula,
    description,
    benchmarks,
}: {
    title: ReactNode;
    formula: ReactNode;
    description: ReactNode;
    benchmarks: readonly { label: ReactNode; value: ReactNode; type: 'good' | 'neutral' | 'bad' }[];
}) {
    return (
        <AcademyPanel variant="valuation" className="metric-card">
            <div className={valuationParts('metric-card__header')}>
                <h3 className={valuationParts('metric-card__title')}>{title}</h3>
            </div>
            <div className={valuationParts('metric-card__formula')}>{formula}</div>
            <p className={valuationParts('metric-card__desc')}>{description}</p>
            <div className={valuationParts('metric-card__benchmarks')}>
                {benchmarks.map((b, i) => (
                    <div key={i} className={cn(valuationParts('benchmark'), valuationParts(`benchmark--${b.type}`))}>
                        <span>{b.label}</span>
                        <strong>{b.value}</strong>
                    </div>
                ))}
            </div>
        </AcademyPanel>
    );
}
export function AcademyWorkedExample({
    tone,
    icon,
    title,
    children,
    conclusion,
    ...props
}: CopyProps & { tone: 'good' | 'bad'; icon: ReactNode; conclusion: ReactNode }) {
    return (
        <div {...props} className={cn(valuationParts('example-box'), valuationParts(`example-box--${tone}`))}>
            <div className={valuationParts('example-box__header')}>
                {icon}
                <h3 className={valuationParts('example-box__title')}>{title}</h3>
            </div>
            <div className={valuationParts('example-box__grid')}>{children}</div>
            <div className={valuationParts('example-box__conclusion')}>{conclusion}</div>
        </div>
    );
}
export function AcademyExampleMetric({
    label,
    value,
    ...props
}: HTMLAttributes<HTMLDivElement> & { label: ReactNode; value: ReactNode }) {
    return (
        <div {...props} className={valuationParts('example-metric')}>
            <span className={valuationParts('example-metric__label')}>{label}</span>
            <span className={valuationParts('example-metric__value')}>{value}</span>
        </div>
    );
}
export function AcademyCheckItem({ icon, children, ...props }: HTMLAttributes<HTMLDivElement> & { icon: ReactNode }) {
    return (
        <div {...props} className={valuationParts('checklist-item')}>
            {icon}
            {children}
        </div>
    );
}

export function AcademyBalanceStage({
    title,
    barLabel,
    segments,
    children,
    ...props
}: CopyProps & { barLabel: string; segments: readonly { width: number; label: ReactNode }[] }) {
    return (
        <div {...props} className={strategyParts('strategies__balance-stage')}>
            <h4>{title}</h4>
            <div className={strategyParts('strategies__balance-bar')} role="img" aria-label={barLabel}>
                {segments.map((s, i) => (
                    <span key={i} style={{ width: `${s.width}%` }}>
                        {s.label}
                    </span>
                ))}
            </div>
            <p>{children}</p>
        </div>
    );
}
export function AcademyRuleList({
    items,
    ...props
}: HTMLAttributes<HTMLOListElement> & {
    items: readonly { icon: ReactNode; label: ReactNode; description: ReactNode }[];
}) {
    return (
        <ol {...props} className={strategyParts('strategies__rules')}>
            {items.map((item, i) => (
                <li key={i}>
                    {item.icon}
                    <div>
                        <strong>{item.label}</strong>
                        <p>{item.description}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
export function AcademyErrorFooter({ icon, children, ...props }: HTMLAttributes<HTMLDivElement> & { icon: ReactNode }) {
    return (
        <div {...props} className={errorParts('error-detail-card__footer')}>
            {icon}
            {children}
        </div>
    );
}
