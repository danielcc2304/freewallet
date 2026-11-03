import type { HTMLAttributes } from 'react';
import {
    simulationPresentationStyle as s,
    type SimulationPresentationPart,
} from './SimulationDetailPresentation.styles';

/** Native layout frames share structure and recipes while the caller owns state and formatting. */
export function SimulationPresentation({
    appearance,
    as: Tag = 'div',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & {
    appearance: SimulationPresentationPart;
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
