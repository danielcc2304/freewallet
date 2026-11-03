import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPageHeader } from '../layout/AcademyPageHeader';
import { learningStructureStyle as l } from './AcademyLearningStructure.styles';
import { taxReadingStyle as t } from './AcademyTaxReading.styles';
const appearances = {
    learning: {
        header: l('fundamentos__header'),
        title: l('fundamentos__title'),
        description: l('fundamentos__description'),
    },
    tax: { header: t('tax-info__header'), title: t('tax-info__title'), description: t('tax-info__subtitle') },
};
/** Shared guide header structure, retaining each page's typography and native heading. */
export function AcademyReadingHeader({
    appearance,
    title,
    description,
    className,
    ...props
}: Omit<ComponentProps<typeof AcademyPageHeader>, 'title' | 'children'> & {
    appearance: keyof typeof appearances;
    title: ReactNode;
    description: ReactNode;
}) {
    const s = appearances[appearance];
    return (
        <AcademyPageHeader {...props} className={cn(s.header, className)}>
            <h1 className={s.title}>{title}</h1>
            <p className={s.description}>{description}</p>
        </AcademyPageHeader>
    );
}
