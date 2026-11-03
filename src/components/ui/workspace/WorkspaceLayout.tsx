import type { HTMLAttributes, FormHTMLAttributes, ComponentProps } from 'react';
import { Card, CardContent } from '../Card';
import { workspaceLayout as s, workspaceLayouts } from './WorkspaceLayout.styles';
type Appearance = keyof typeof workspaceLayouts;
/** Shared native layout, card and form frames; state and content stay with the page. */
export function WorkspaceLayout({
    as: Tag = 'div',
    appearance,
    className,
    ...props
}: HTMLAttributes<HTMLElement> & {
    as?: 'div' | 'section' | 'article' | 'aside' | 'main' | 'ul';
    appearance: Appearance;
}) {
    return <Tag {...props} className={s(appearance, className)} />;
}
export function WorkspaceForm({
    appearance,
    className,
    ...props
}: FormHTMLAttributes<HTMLFormElement> & { appearance: Appearance }) {
    return <form {...props} className={s(appearance, className)} />;
}
export function WorkspaceCardContent({
    appearance,
    className,
    ...props
}: ComponentProps<typeof CardContent> & { appearance: Appearance }) {
    return <CardContent {...props} className={s(appearance, className)} />;
}
export function WorkspaceCard({
    appearance,
    className,
    ...props
}: ComponentProps<typeof Card> & { appearance: Appearance }) {
    return <Card {...props} className={s(appearance, className)} />;
}
