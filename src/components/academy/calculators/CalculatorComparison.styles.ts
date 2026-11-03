export const comparisonStyles = {
    payment: String.raw`
        tw:[&]:p-[.9rem] tw:[&]:ui-border-strong tw:[&]:rounded-[14px] tw:[&]:ui-fill-surface tw:[&]:min-w-[0]
        tw:[&.is-selected]:[border-color:var(--accent-primary)] tw:[&_span]:block tw:[&_span]:text-[length:.76rem]
        tw:[&_span]:text-secondary tw:[&_small]:block tw:[&_small]:text-[length:.76rem] tw:[&_small]:text-secondary
        tw:[&_strong]:block tw:[&_strong]:text-[length:1.22rem] tw:[&_strong]:m-[.35rem_0]
        tw:[&_strong]:[letter-spacing:-.025em] tw:[@media(max-width:480px)]:[&&]:p-[.7rem]
    `,
    scenario: String.raw`
        tw:[&]:min-w-[0] tw:[&]:ui-fill-surface tw:[&]:ui-border-strong tw:[&]:rounded-[15px] tw:[&]:p-[1.1rem]
        tw:[&_>_div]:ui-row tw:[&_>_div]:justify-between tw:[&&_h3]:m-[0] tw:[&_button]:ui-fill-transparent
        tw:[&_button]:[border:0] tw:[&_button]:text-secondary tw:[&_button]:min-w-[44px] tw:[&_button]:min-h-[44px]
        tw:[&_button]:cursor-pointer tw:[&_p]:text-secondary tw:[&_p]:text-[length:.78rem] tw:[&_p]:m-[.6rem_0]
        tw:[&_>_strong]:block tw:[&_>_strong]:text-[length:1.4rem] tw:[&_>_strong_small]:block
        tw:[&_>_strong_small]:[font-weight:400] tw:[&_>_strong_small]:text-[length:.74rem]
        tw:[&_>_strong_small]:text-secondary
    `,
};
