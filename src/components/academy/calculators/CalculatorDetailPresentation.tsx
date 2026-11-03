import { createElement } from 'react';
import type { HTMLAttributes } from 'react';
import {
    calculatorPresentationStyle as s,
    type CalculatorPresentationPart,
} from './CalculatorDetailPresentation.styles';

/** Native layout frames share structure and recipes while the caller owns state and formatting. */
export function CalculatorPresentation({
    appearance,
    as: Tag = 'div',
    className,
    ...props
}: HTMLAttributes<HTMLElement> & {
    appearance: CalculatorPresentationPart;
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
    return createElement(Tag, { ...props, className: s(appearance, className) });
}
