import { cn } from '../../../utils/cn';
const styles = {
    'transactions-page': String.raw`
        tw:grid tw:gap-[1.5rem]
    `,
    'transactions-page__summary': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] tw:gap-[1rem]
        tw:[@media(max-width:900px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr]
    `,
    'transactions-page__filters-content': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'transactions-page__chips': String.raw`
        tw:flex tw:flex-wrap tw:gap-[0.75rem]
    `,
    'transactions-page__chip': String.raw`
        tw:ui-border-default tw:ui-fill-surface tw:text-secondary tw:p-[0.65rem_1rem] tw:rounded-[999px]
        tw:cursor-pointer tw:[transition:all_0.2s_ease] tw:[&:hover]:[border-color:var(--accent-primary)]
        tw:[&:hover]:text-accent
        tw:[&:hover]:[background:color-mix(in_srgb,_var(--accent-primary)_12%,_transparent)]
    `,
    'transactions-page__chip--active': String.raw`
        tw:[&.transactions-page\_\_chip--active]:[border-color:var(--accent-primary)]
        tw:[&.transactions-page\_\_chip--active]:text-accent
        tw:[&.transactions-page\_\_chip--active]:[background:color-mix(in_srgb,_var(--accent-primary)_12%,_transparent)]
    `,
    'transactions-page__empty': String.raw`
        tw:grid tw:[justify-items:start] tw:gap-[0.75rem] tw:text-secondary tw:[&_p]:m-[0] tw:[&_a]:text-accent
        tw:[&_a]:[text-decoration:none] tw:[&_a]:[font-weight:600]
    `,
    'transactions-list': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'transactions-item': String.raw`
        tw:grid tw:grid-cols-[minmax(0,_1.7fr)_minmax(0,_1.3fr)] tw:gap-[1rem] tw:p-[1rem_0]
        tw:[border-bottom:1px_solid_var(--border-color)] tw:[&:last-child]:[border-bottom:0]
        tw:[&:last-child]:pb-[0] tw:[@media(max-width:900px)]:grid-cols-[1fr]
    `,
    'transactions-item__main': String.raw`
        tw:grid tw:gap-[0.75rem]
    `,
    'transactions-item__title': String.raw`
        tw:flex tw:flex-wrap tw:items-baseline tw:gap-[0.6rem] tw:m-[0] tw:text-[length:1rem]
        tw:[&_span]:text-secondary tw:[&_span]:text-[length:0.9rem] tw:[&_span]:[font-weight:500]
    `,
    'transactions-item__notes': String.raw`
        tw:m-[0.35rem_0_0] tw:text-secondary
    `,
    'transactions-item__meta': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[1rem] tw:[&_div]:grid tw:[&_div]:gap-[0.25rem]
        tw:[&_span]:text-secondary tw:[&_span]:text-[length:0.8125rem] tw:[&_strong]:text-[length:0.95rem]
        tw:[@media(max-width:640px)]:[&&]:grid-cols-[1fr_1fr]
    `,
} as const;
export function TransactionsStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
