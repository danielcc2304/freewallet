import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { AcademyPanel } from './AcademyPanel';
import { glossaryStyle as s } from './AcademyGlossary.styles';
export function AcademyGlossarySearch({ icon, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
    return (
        <div className={s('glossary-search')}>
            {icon}
            <input {...props} />
        </div>
    );
}
export function AcademyGlossaryFilter({
    selected,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
    return <button {...props} className={cn(s('filter-chip'), selected && 'active', className)} />;
}
export function AcademyGlossaryCard({
    category,
    term,
    definition,
    related,
}: {
    category?: string;
    term: string;
    definition: string;
    related?: readonly string[];
}) {
    return (
        <AcademyPanel variant="glossary" as="article" className={s('glossary-card')}>
            <span className={s('glossary-card__category')}>{category}</span>
            <h2 className={s('glossary-card__term')}>{term}</h2>
            <p className={s('glossary-card__def')}>{definition}</p>
            {related && related.length > 0 && (
                <div className={s('glossary-card__related')}>
                    <h5>Relacionado</h5>
                    <div className={s('related-tags')}>
                        {related.map((tag) => (
                            <span key={tag} className={s('tag')}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </AcademyPanel>
    );
}
