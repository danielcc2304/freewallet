import { cn } from '../../../utils/cn';
const styles = {
    'salary-calc': String.raw`
        tw:w-full tw:min-w-[0] tw:p-[1.5rem] tw:text-main tw:[&_h2]:text-[length:1.12rem] tw:[&_h2]:[font-weight:750]
        tw:[&_h2]:[line-height:1.35] tw:[&_h3]:text-[length:1rem] tw:[&_h3]:m-[1.5rem_0_.6rem]
        tw:[&_h4]:text-[length:.9rem] tw:[&_h4]:m-[.6rem_0]
        tw:[&_input:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_input:focus-visible]:[outline-offset:3px]
        tw:[&_select:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_select:focus-visible]:[outline-offset:3px]
        tw:[&_button:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_button:focus-visible]:[outline-offset:3px]
        tw:[&_summary:focus-visible]:[outline:2px_solid_var(--accent-primary)]
        tw:[&_summary:focus-visible]:[outline-offset:3px] tw:[&_button:disabled]:opacity-[.5]
        tw:[&_button:disabled]:cursor-not-allowed tw:[&_>_.salary-calc\_\_fold]:mt-[1.5rem] tw:[&_a]:text-accent
        tw:[&_a]:[text-decoration:underline] tw:[&_a]:[text-underline-offset:3px]
        tw:[@media(max-width:800px)]:p-[1rem_.5rem] tw:[@media(max-width:480px)]:[&&]:p-[.7rem_0]
    `,
    'salary-calc__header': String.raw`
        tw:mb-[1.5rem] tw:[&_h1]:text-[length:clamp(1.6rem,_2.5vw,_2.35rem)] tw:[&_h1]:[letter-spacing:-.035em]
        tw:[&_h1]:[line-height:1.2] tw:[&_p]:text-secondary tw:[&_p]:mt-[.65rem]
    `,
    'salary-calc__year': String.raw`
        tw:inline-block tw:mt-[.8rem] tw:text-[length:.8rem] tw:[font-weight:650] tw:text-accent
    `,
    'salary-calc__form': String.raw`
        tw:min-w-[0] tw:ui-stack tw:gap-[1rem]
    `,
    'salary-calc__results': String.raw`
        tw:min-w-[0] tw:ui-stack tw:gap-[1rem]
    `,
    'salary-calc__hint': String.raw`
        tw:text-[length:.79rem] tw:text-secondary tw:[line-height:1.6] tw:m-[.75rem_0]
    `,
    'salary-calc__privacy': String.raw`
        tw:text-[length:.79rem] tw:text-secondary tw:[line-height:1.6] tw:p-[0_.2rem]
    `,
    'salary-calc__segmented': String.raw`
        tw:flex tw:p-[.3rem] tw:gap-[.35rem] tw:ui-fill-muted tw:ui-border-strong tw:rounded-[14px]
        tw:[&_button]:flex-[1] tw:[&_button]:min-h-[44px] tw:[&_button]:p-[.6rem] tw:[&_button]:ui-fill-transparent
        tw:[&_button]:[border:0] tw:[&_button]:rounded-[10px] tw:[&_button]:[font-family:inherit]
        tw:[&_button]:[font-style:inherit] tw:[&_button]:[font-variant:inherit] tw:[&_button]:[font-stretch:inherit]
        tw:[&_button]:[line-height:inherit] tw:[&_button]:text-[length:.9rem] tw:[&_button]:[font-weight:650]
        tw:[&_button]:text-secondary tw:[&_button]:cursor-pointer
        tw:[&_button[aria-pressed=true]]:[background:var(--accent-primary)]
        tw:[&_button[aria-pressed=true]]:[color:#071b14]
    `,
    'salary-calc__button': String.raw`
        tw:inline-flex tw:justify-center tw:items-center tw:gap-[.5rem] tw:min-h-[44px] tw:rounded-[12px]
        tw:p-[.7rem_1rem] tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit]
        tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:.85rem] tw:[font-weight:650]
        tw:cursor-pointer tw:[color:#071b14] tw:[background:var(--accent-primary)] tw:[border:1px_solid_transparent]
    `,
    'salary-calc__text-button': String.raw`
        tw:inline-flex tw:justify-center tw:items-center tw:gap-[.5rem] tw:min-h-[44px] tw:rounded-[12px]
        tw:p-[.7rem_1rem] tw:[font-family:inherit] tw:[font-style:inherit] tw:[font-variant:inherit]
        tw:[font-stretch:inherit] tw:[line-height:inherit] tw:text-[length:.85rem] tw:[font-weight:650]
        tw:cursor-pointer tw:self-start tw:pl-[.2rem] tw:ui-fill-transparent tw:[border:0] tw:text-secondary
    `,
    'salary-calc__button--secondary': String.raw`
        tw:[&.salary-calc\_\_button--secondary]:text-main tw:[&.salary-calc\_\_button--secondary]:ui-fill-muted
        tw:[&.salary-calc\_\_button--secondary]:[border-color:var(--border-secondary)]
    `,
    'salary-calc__distribution': String.raw`
        tw:flex tw:gap-[3px] tw:h-[15px] tw:rounded-[10px] tw:overflow-hidden tw:m-[1.2rem_0] tw:ui-fill-muted
        tw:[&_span]:min-w-[0]
    `,
    'salary-calc__distribution--net': String.raw`
        tw:[&.salary-calc\_\_distribution--net]:[background:var(--accent-primary)]
    `,
    'salary-calc__dot--net': String.raw`
        tw:[&.salary-calc\_\_dot--net]:[background:var(--accent-primary)]
    `,
    'salary-calc__distribution--irpf': String.raw`
        tw:[&.salary-calc\_\_distribution--irpf]:[background:#8b5cf6]
    `,
    'salary-calc__dot--irpf': String.raw`
        tw:[&.salary-calc\_\_dot--irpf]:[background:#8b5cf6]
    `,
    'salary-calc__distribution--ss': String.raw`
        tw:[&.salary-calc\_\_distribution--ss]:[background:#3b82f6]
    `,
    'salary-calc__dot--ss': String.raw`
        tw:[&.salary-calc\_\_dot--ss]:[background:#3b82f6]
    `,
    'salary-calc__dot': String.raw`
        tw:inline-block tw:w-[9px] tw:h-[9px] tw:rounded-[50%] tw:mr-[.55rem]
    `,
    'salary-calc__tax': String.raw`
        tw:[&_.salary-calc\_\_fold]:rounded-[14px] tw:[&_.salary-calc\_\_fold]:mt-[1rem]
    `,
    'salary-calc__fold': String.raw``,
    'salary-calc__error': String.raw`
        tw:flex tw:items-start tw:gap-[.8rem] tw:[background:rgba(245,158,11,.08)]
        tw:[border:1px_solid_rgba(245,158,11,.3)] tw:rounded-[18px] tw:p-[1.2rem] tw:[&_>_svg]:shrink-[0]
        tw:[&_>_svg]:[color:var(--color-warning)] tw:[&_p]:mt-[.5rem] tw:[&_p]:text-[length:.85rem]
    `,
    'salary-calc__notes': String.raw`
        tw:[border-left:3px_solid_var(--color-warning)] tw:p-[.5rem_1rem] tw:text-secondary tw:text-[length:.8rem]
        tw:[&_p_+_p]:mt-[.7rem]
    `,
    'salary-calc__actions': String.raw`
        tw:flex tw:flex-wrap tw:gap-[.65rem] tw:[@media(max-width:480px)]:[&&]:flex-col
    `,
    'salary-calc__current-bracket': String.raw`
        tw:[background:rgba(var(--accent-rgb),_.1)]
    `,
    'salary-calc__scenarios': String.raw`
        tw:m-[1.5rem_0]
    `,
    'salary-calc__sources': String.raw`
        tw:ui-stack tw:items-start tw:gap-[.7rem] tw:text-[length:.85rem]
    `,
} as const;
export function SalaryCalculatorDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
