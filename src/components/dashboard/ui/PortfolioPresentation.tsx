import type { ReactNode } from 'react';
import type { HTMLAttributes, FormHTMLAttributes, FieldsetHTMLAttributes, ComponentProps } from 'react';
import { portfolioPresentationStyle as s, type PortfolioPresentationPart } from './PortfolioPresentation.styles';
import { Card } from '../../ui/Card';
/** Native layout frames share structure and recipes while the caller owns state and formatting. */
export function PortfolioPresentation({
    appearance,
    as: Tag = 'div',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & {
    appearance: PortfolioPresentationPart;
    as?:
        | 'div'
        | 'section'
        | 'article'
        | 'main'
        | 'span'
        | 'p'
        | 'h3'
        | 'h4'
        | 'ul'
        | 'li'
        | 'dl'
        | 'label'
        | 'small'
        | 'i'
        | 'nav'
        | 'strong';
}) {
    return <Tag {...props} className={s(appearance, className)} />;
}
export function PortfolioPresentationForm({
    appearance,
    className,
    ...props
}: FormHTMLAttributes<HTMLFormElement> & { appearance: PortfolioPresentationPart }) {
    return <form {...props} className={s(appearance, className)} />;
}
export function PortfolioPresentationFieldset({
    appearance,
    className,
    ...props
}: FieldsetHTMLAttributes<HTMLFieldSetElement> & { appearance: PortfolioPresentationPart }) {
    return <fieldset {...props} className={s(appearance, className)} />;
}
export function PortfolioPresentationCard({
    appearance,
    className,
    ...props
}: ComponentProps<typeof Card> & { appearance: PortfolioPresentationPart }) {
    return <Card {...props} className={s(appearance, className)} />;
}

/** Native definition rows keep labels and formatted values in the transfer workflow. */
export function PortfolioDefinition({ label, value }: { label: ReactNode; value: ReactNode }) {
    return (
        <div>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}
