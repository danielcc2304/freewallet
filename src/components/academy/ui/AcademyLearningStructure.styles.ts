import { cn } from '../../../utils/cn';
const styles = {
    fundamentos: String.raw`
        tw:[--academy-space-section:2rem] tw:[--academy-space-card:1.25rem] tw:[--academy-space-card-lg:1.5rem]
        tw:[--academy-space-stack:1rem] tw:max-w-[1160px] tw:m-[0_auto] tw:p-[0_1.5rem_4rem] tw:grid
        tw:gap-[var(--academy-space-section)] tw:overflow-x-hidden
        tw:[@media(max-width:768px)]:[--academy-space-section:1.5rem]
        tw:[@media(max-width:768px)]:[--academy-space-card:1rem]
        tw:[@media(max-width:768px)]:[--academy-space-card-lg:1.1rem]
        tw:[@media(max-width:768px)]:[--academy-space-stack:0.8rem] tw:[@media(max-width:768px)]:p-[0_1rem_3rem]
    `,
    fundamentos__header: String.raw`
        tw:text-center tw:p-[1rem_0_0]
    `,
    fundamentos__title: String.raw`
        tw:text-[length:clamp(2rem,_4vw,_3rem)] tw:[font-weight:800] tw:text-main tw:m-[0_0_0.75rem]
    `,
    fundamentos__description: String.raw`
        tw:text-[length:1.05rem] tw:text-secondary tw:[line-height:1.7] tw:m-[0_auto] tw:max-w-[820px]
    `,
    fundamentos__summary: String.raw`
        tw:grid tw:grid-cols-[repeat(3,_minmax(0,_1fr))] tw:gap-[0.65rem] tw:mt-[-0.5rem]
        tw:[@media(max-width:1024px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:768px)]:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:768px)]:gap-[0.45rem]
    `,
    fundamentos__spotlight: String.raw`
        tw:grid tw:grid-cols-[1.6fr_0.9fr] tw:gap-[var(--academy-space-stack)] tw:p-[var(--academy-space-card-lg)]
        tw:[background:radial-gradient(circle_at_top_left,_rgba(16,_185,_129,_0.12),_transparent_42%),_radial-gradient(circle_at_bottom_right,_rgba(59,_130,_246,_0.12),_transparent_40%),_var(--bg-secondary)]
        tw:[&_h2]:m-[0_0_0.55rem] tw:[&_h2]:text-[length:1.4rem] tw:[&_h2]:text-main tw:[&_p]:m-[0]
        tw:[&_p]:[line-height:1.65] tw:[&_p]:text-secondary tw:[@media(max-width:1024px)]:grid-cols-[1fr]
        tw:[@media(max-width:768px)]:p-[var(--academy-space-card-lg)]
    `,
    'fundamentos__spotlight-actions': String.raw`
        tw:grid tw:[align-content:center] tw:gap-[var(--academy-space-stack)]
    `,
    fundamentos__button: String.raw`
        tw:inline-flex tw:items-center tw:justify-center tw:min-h-[44px] tw:p-[0.8rem_1rem] tw:rounded-[10px]
        tw:[text-decoration:none] tw:[font-weight:700] tw:[transition:all_0.2s_ease]
        tw:[&:hover]:[transform:translateY(-2px)]
    `,
    'fundamentos__button--primary': String.raw`
        tw:[&.fundamentos\_\_button--primary]:[background:var(--accent-primary)]
        tw:[&.fundamentos\_\_button--primary]:[color:white]
    `,
    'fundamentos__button--secondary': String.raw`
        tw:[&.fundamentos\_\_button--secondary]:ui-fill-muted
        tw:[&.fundamentos\_\_button--secondary]:ui-border-default tw:[&.fundamentos\_\_button--secondary]:text-main
    `,
    'fundamentos__section-block': String.raw`
        tw:p-[var(--academy-space-card-lg)] tw:[@media(max-width:768px)]:p-[var(--academy-space-card-lg)]
    `,
    'fundamentos__level-grid': String.raw`
        tw:grid tw:gap-[var(--academy-space-stack)] tw:grid-cols-[1fr] tw:gap-[1.35rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'fundamentos__level-card': String.raw`
        tw:ui-border-default tw:rounded-[14px] tw:ui-fill-muted tw:p-[var(--academy-space-card)] tw:[&&]:[border:0]
        tw:rounded-[0] tw:ui-fill-transparent tw:p-[0] tw:grid tw:grid-cols-[minmax(180px,_220px)_minmax(0,_1fr)]
        tw:gap-[1.25rem] tw:[align-items:start] tw:[@media(max-width:1024px)]:grid-cols-[1fr]
        tw:[@media(max-width:1024px)]:gap-[0.85rem]
    `,
    'fundamentos__level-head': String.raw`
        tw:grid tw:gap-[0.35rem] tw:[align-content:start] tw:p-[0.25rem_0_0_0.2rem] tw:[&_h3]:m-[0]
        tw:[&_h3]:text-main tw:[&_span]:text-muted tw:[&_span]:text-[length:0.85rem]
        tw:[@media(max-width:1024px)]:flex tw:[@media(max-width:1024px)]:justify-between
        tw:[@media(max-width:1024px)]:items-baseline tw:[@media(max-width:1024px)]:gap-[1rem]
        tw:[@media(max-width:1024px)]:pt-[0]
    `,
    'fundamentos__mini-list': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(250px,_1fr))] tw:gap-[0.65rem]
        tw:[@media(max-width:1024px)]:grid-cols-[repeat(2,_minmax(0,_1fr))]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'fundamentos__goal-grid': String.raw`
        tw:grid tw:gap-[var(--academy-space-stack)] tw:grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))]
    `,
    'fundamentos__checklist-grid': String.raw`
        tw:grid tw:gap-[var(--academy-space-stack)] tw:grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))]
    `,
    fundamentos__sections: String.raw`
        tw:grid tw:gap-[var(--academy-space-stack)] tw:grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] tw:m-[0]
    `,
    fundamentos__next: String.raw`
        tw:[&_h3]:m-[0_0_0.55rem] tw:[&_h3]:text-[length:1.4rem] tw:[&_h3]:text-main tw:[&_p]:m-[0]
        tw:[&_p]:[line-height:1.65] tw:[&_p]:text-secondary tw:p-[var(--academy-space-card-lg)]
        tw:[@media(max-width:768px)]:p-[var(--academy-space-card-lg)]
    `,
    'fundamentos__next-links': String.raw`
        tw:grid tw:gap-[var(--academy-space-stack)] tw:mt-[var(--academy-space-stack)]
    `,
} as const;
export function learningStructureStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
