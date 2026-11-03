import { cn } from '../../utils/cn';
import { MainLayoutDetailStyle } from './MainLayoutDetail.styles';
import { AcademyLayoutDetailStyle } from './AcademyLayoutDetail.styles';
import { AcademyPageHeaderDetailStyle } from './AcademyPageHeaderDetail.styles';
const parts = {
    layout: MainLayoutDetailStyle('layout'),
    layout__main: MainLayoutDetailStyle('layout__main'),
    layout__content: MainLayoutDetailStyle('layout__content'),
    academy: AcademyLayoutDetailStyle('academy'),
    'academy--liquid-glass': AcademyLayoutDetailStyle('academy--liquid-glass'),
    academy__content: cn(
        AcademyLayoutDetailStyle('academy__content'),
        AcademyPageHeaderDetailStyle('academy__content'),
    ),
    'academy-page-header': AcademyPageHeaderDetailStyle('academy-page-header'),
    'market-heatmap': AcademyPageHeaderDetailStyle('market-heatmap'),
};
export type LayoutPresentationPart = keyof typeof parts;
export function layoutPresentationStyle(part: LayoutPresentationPart, className?: string) {
    return cn(parts[part], className);
}
/** Resolve retained integration hooks through static recipes; financial values stay with the caller. */
export function layoutPresentationClasses(className?: string) {
    return cn(
        className
            ?.split(/\s+/)
            .map((token) => (Object.hasOwn(parts, token) ? parts[token as LayoutPresentationPart] : token)),
    );
}
