import { cn } from '../../../utils/cn';
const styles = {
    'asset-page': String.raw`
        tw:[--academy-space-section:2.5rem] tw:[--academy-space-card:1.5rem] tw:[--academy-space-card-lg:2rem]
        tw:[--academy-space-stack:1.5rem] tw:max-w-[1100px] tw:m-[0_auto] tw:p-[2rem] tw:text-main
        tw:[@media(max-width:850px)]:p-[1rem] tw:[--guide-surface:var(--bg-secondary)]
        tw:[--guide-tint:color-mix(in_srgb,_var(--asset-color)_7%,_var(--guide-surface))]
        tw:[--academy-space-section:clamp(2rem,_4vw,_3rem)] tw:[container-type:inline-size] tw:wrap-anywhere
        tw:[&_:is(a,_button,_input):focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_:is(a,_button,_input):focus-visible]:[outline-offset:4px]
        tw:[&_section[id]]:[scroll-margin-top:1.5rem]
        tw:[&_.asset-page\_\_section_h2]:text-[length:clamp(1.2rem,_2.4vw,_1.55rem)]
        tw:[&_.asset-page\_\_section_h2]:[line-height:1.35] tw:[&_.asset-page\_\_section_h2]:m-[0_0_1.25rem]
        tw:[&_.asset-page\_\_section_h2]:items-start tw:[&_.asset-page\_\_section_h2_svg]:flex-[0_0_22px]
        tw:[&_.asset-page\_\_section_h2_svg]:mt-[.12em]
        tw:[&_:is(.asset-page\_\_subtype-grid,_.asset-page\_\_steps,_.yield-curves,_.bond-type-block\_\_subtypes)]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_260px),_1fr))]
        tw:[&_:is(.asset-page\_\_subtype-grid,_.asset-page\_\_steps,_.yield-curves,_.bond-type-block\_\_subtypes)]:gap-[1rem]
        tw:[&_:is(.credit-spreads-grid,_.bond-checklist-grid,_.bond-ladder,_.bond-duration-calc\_\_inputs,_.bond-duration-calc\_\_summary,_.bond-mistakes-grid)]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_220px),_1fr))]
        tw:[&_:is(.credit-spreads-grid,_.bond-checklist-grid,_.bond-ladder,_.bond-duration-calc\_\_inputs,_.bond-duration-calc\_\_summary,_.bond-mistakes-grid)]:gap-[1rem]
        tw:[&_:is(.subtype-card,_.step-card,_.pc-column,_.versus-card,_.metric-explainer,_.bond-type-block,_.yield-curve-card)]:p-[clamp(1rem,_2.5vw,_1.5rem)]
        tw:[&_:is(.subtype-card,_.step-card,_.pc-column,_.versus-card,_.metric-explainer,_.bond-type-block,_.yield-curve-card)]:rounded-[16px]
        tw:[&_:is(.subtype-card,_.step-card,_.pc-column,_.versus-card,_.metric-explainer,_.bond-type-block,_.yield-curve-card)]:min-w-[0]
        tw:[&_.subtype-card]:ui-stack tw:[&_.subtype-card:hover]:[transform:none]
        tw:[&_.subtype-card\_\_header]:items-start tw:[&_.subtype-card\_\_header_svg]:shrink-[0]
        tw:[&_.subtype-card\_\_dot]:flex-[0_0_8px] tw:[&_.subtype-card\_\_dot]:mt-[.5rem]
        tw:[&_.subtype-card\_\_desc]:[line-height:1.65] tw:[&_.subtype-card\_\_footer]:mt-[auto]
        tw:[&_.subtype-card\_\_footer]:flex-wrap tw:[&_.subtype-card\_\_footer]:gap-[.5rem]
        tw:[&_.subtype-card\_\_examples]:mt-[auto] tw:[&_.asset-page\_\_pros-cons]:gap-[1rem]
        tw:[&_.asset-page\_\_final-tip]:mt-[2rem] tw:[&_.asset-page\_\_final-tip]:p-[1.5rem]
        tw:[&_.asset-page\_\_final-tip]:gap-[1rem] tw:[&_.asset-page\_\_final-tip]:text-left
        tw:[&_.asset-page\_\_final-tip]:items-start tw:[&_.asset-page\_\_final-tip]:[background:var(--guide-tint)]
        tw:[&_.asset-page\_\_final-tip_>_svg]:flex-[0_0_28px] tw:[&_.asset-page\_\_final-tip_h3]:m-[0_0_.5rem]
        tw:[&_.asset-page\_\_final-tip_p]:m-[0] tw:[&_.asset-page\_\_final-tip_p]:[line-height:1.7]
        tw:[&_.bond-type-block]:mb-[1.25rem] tw:[&_.bond-type-block]:[border-left-width:3px]
        tw:[&_.bond-type-block\_\_emoji]:w-[48px] tw:[&_.bond-type-block\_\_emoji]:h-[48px]
        tw:[&_.bond-type-block\_\_emoji]:flex-[0_0_48px] tw:[&_.bond-type-block\_\_header]:gap-[1rem]
        tw:[&_.bond-type-block\_\_header_h3]:text-[length:1.2rem] tw:[&_.bond-subtype\_\_header]:gap-[.75rem]
        tw:[&_.bond-subtype\_\_header]:flex-wrap tw:[&_.bond-subtype\_\_header]:items-start
        tw:[&_.bond-subtype\_\_risk]:shrink-[0]
        tw:[&_:is(.spread-sim,_.bond-duration-calc,_.rating-scale,_.inflation-visual)]:p-[clamp(1rem,_2.5vw,_1.5rem)]
        tw:[&_:is(.spread-sim,_.bond-duration-calc,_.rating-scale,_.inflation-visual)]:ui-border-default
        tw:[&_:is(.spread-sim,_.bond-duration-calc,_.rating-scale,_.inflation-visual)]:rounded-[16px]
        tw:[&_input[type='range']]:min-h-[44px] tw:[&_input[type='range']]:[accent-color:var(--accent-primary)]
        tw:[html[data-appearance='liquid-glass']_&]:[--guide-surface:color-mix(in_srgb,_var(--bg-secondary)_80%,_transparent)]
        tw:[@container(max-width:620px)]:[&_.asset-page\_\_pros-cons]:grid-cols-[1fr]
        tw:[@container(max-width:620px)]:[&_.asset-page\_\_versus]:flex-col
        tw:[@container(max-width:620px)]:[&_.asset-page\_\_versus]:gap-[.75rem]
        tw:[@container(max-width:620px)]:[&_.asset-page\_\_metrics-grid]:grid-cols-[1fr]
        tw:[@container(max-width:620px)]:[&_.asset-page\_\_final-tip]:flex-row
        tw:[@container(max-width:620px)]:[&_.asset-page\_\_final-tip]:p-[1rem]
        tw:[@media(max-width:1024px)]:[&_section[id]]:[scroll-margin-top:5rem]
    `,
    'asset-page__section': String.raw`
        tw:[&_h2]:[font-weight:700] tw:[&_h2_svg]:text-accent tw:[@media(max-width:850px)]:mb-[3rem]
        tw:[@media(max-width:850px)]:[&_h2]:text-[length:1.5rem]
    `,
    'asset-page__section-desc': String.raw`
        tw:text-secondary tw:text-[length:1.1rem] tw:mb-[var(--academy-space-stack)]
    `,
    'asset-page__versus': String.raw`
        tw:flex tw:items-stretch tw:gap-[2rem] tw:[@media(max-width:768px)]:flex-col
        tw:[@media(max-width:850px)]:flex-col
    `,
    'versus-divider': String.raw`
        tw:ui-row tw:[font-weight:900] tw:text-muted tw:text-[length:1.5rem] tw:[@media(max-width:768px)]:h-[40px]
        tw:[@media(max-width:768px)]:justify-center
    `,
    'inverse-relationship': String.raw`
        tw:flex tw:gap-[1.5rem] tw:m-[2rem_0] tw:[@media(max-width:768px)]:flex-col
        tw:[@media(max-width:850px)]:flex-col
    `,
    'yield-curves': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] tw:gap-[1.5rem] tw:m-[2rem_0]
    `,
    'rating-scale': String.raw`
        tw:mt-[2rem] tw:ui-fill-muted tw:p-[2rem] tw:rounded-[24px]
    `,
    'credit-spreads-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(240px,_1fr))] tw:gap-[var(--academy-space-stack)] tw:mt-[2rem]
    `,
    'bond-checklist-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(220px,_1fr))] tw:gap-[1rem] tw:mt-[1.5rem]
    `,
    'bond-ladder': String.raw`
        tw:mt-[1.75rem] tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(180px,_1fr))] tw:gap-[1rem]
    `,
    'bond-mistakes-grid': String.raw`
        tw:mt-[1.5rem] tw:grid tw:grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] tw:gap-[1rem]
    `,
    'bond-type-block': String.raw`
        tw:mb-[3rem] tw:p-[2.5rem] tw:ui-fill-surface tw:ui-border-default tw:rounded-[24px]
        tw:[border-left-width:6px] tw:[&&]:[border-left-style:solid] tw:[&&]:[border-left-color:var(--bond-color)] tw:[@media(max-width:768px)]:p-[1.5rem]
    `,
    'bond-type-block__header': String.raw`
        tw:flex tw:gap-[var(--academy-space-stack)] tw:items-start tw:mb-[2rem] tw:[&_h3]:text-[length:1.5rem]
        tw:[&_h3]:[font-weight:800] tw:[&_h3]:mb-[0.5rem] tw:[&_p]:text-secondary tw:[&_p]:m-[0]
        tw:[@media(max-width:768px)]:flex-col tw:[@media(max-width:768px)]:items-center
        tw:[@media(max-width:768px)]:text-center tw:[@media(max-width:768px)]:gap-[1rem]
    `,
    'bond-type-block__emoji': String.raw`
        tw:text-[length:2.5rem] tw:ui-fill-muted tw:w-[64px] tw:h-[64px] tw:ui-row tw:justify-center
        tw:rounded-[16px]
    `,
    'asset-page__pros-cons': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr] tw:[@media(max-width:850px)]:grid-cols-[1fr]
        tw:[@media(max-width:850px)]:gap-[1.5rem]
    `,
    'asset-page__metrics-grid': String.raw`
        tw:[@media(max-width:768px)]:grid-cols-[1fr] tw:[@media(max-width:850px)]:grid-cols-[1fr]
    `,
    'asset-page__subtype-grid': String.raw`
        tw:[@media(max-width:850px)]:grid-cols-[1fr]
    `,
    'pc-column': String.raw`
        tw:[@media(max-width:850px)]:p-[1.5rem]
    `,
    'versus-card': String.raw`
        tw:[@media(max-width:850px)]:p-[1.5rem]
    `,
} as const;
export function assetGuideFrameStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
