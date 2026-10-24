import { cn } from '../../../utils/cn';

const styles = {
    'quiz-start': String.raw`
        tw:text-center tw:[&_h2]:text-[length:1.75rem] tw:[&_h2]:mb-[1rem] tw:[&_p]:mb-[2rem]
        tw:[&_p]:text-secondary
    `,
    'quiz-start__icon': String.raw`
        tw:w-[80px] tw:h-[80px] tw:[background:rgba(var(--accent-rgb),_0.1)] tw:text-accent tw:rounded-[20px]
        tw:ui-row tw:justify-center tw:m-[0_auto_2rem]
    `,
    'quiz-button': String.raw`
        tw:[background:var(--accent-primary)] tw:[color:white] tw:p-[1rem_2.5rem] tw:rounded-[12px]
        tw:[font-weight:700] tw:[border:none] tw:cursor-pointer tw:[transition:all_0.2s_ease]
        tw:text-[length:1.1rem] tw:[&:hover]:[transform:translateY(-2px)]
        tw:[&:hover]:[box-shadow:0_8px_20px_rgba(var(--accent-rgb),_0.3)]
    `,
    'quiz-question__step': String.raw`
        tw:text-[length:0.85rem] tw:[font-weight:700] tw:text-accent tw:[text-transform:uppercase]
        tw:[letter-spacing:0.1em] tw:mb-[1rem] tw:block
    `,
    'quiz-question__text': String.raw`
        tw:text-[length:1.5rem] tw:[font-weight:700] tw:mb-[2rem] tw:[line-height:1.3]
    `,
    'quiz-options': String.raw`
        tw:grid tw:gap-[1rem]
    `,
    'quiz-option': String.raw`
        tw:ui-fill-muted tw:[border:2px_solid_transparent] tw:p-[1.25rem_1.5rem] tw:rounded-[16px] tw:text-left
        tw:text-[length:1.1rem] tw:[font-weight:500] tw:cursor-pointer tw:[transition:all_0.2s_ease] tw:text-main
        tw:[&:hover]:ui-fill-surface tw:[&:hover]:[border-color:var(--accent-primary)]
    `,
    'quiz-option--selected': String.raw`
        tw:[&.quiz-option--selected]:[background:rgba(var(--accent-rgb),_0.05)]
        tw:[&.quiz-option--selected]:[border-color:var(--accent-primary)] tw:[&.quiz-option--selected]:text-accent
    `,
    'quiz-progress': String.raw`
        tw:h-[6px] tw:[background:var(--border-color)] tw:rounded-[3px] tw:mt-[3rem] tw:overflow-hidden
    `,
    'quiz-progress__bar': String.raw`
        tw:h-full tw:[background:var(--accent-primary)] tw:[transition:width_0.4s_cubic-bezier(0.4,_0,_0.2,_1)]
    `,
    'quiz-result': String.raw`
        tw:text-center
    `,
    'quiz-result__badge': String.raw`
        tw:inline-flex tw:items-center tw:gap-[0.5rem] tw:p-[0.5rem_1.5rem] tw:rounded-[100px] tw:[font-weight:800]
        tw:text-[length:0.9rem] tw:[text-transform:uppercase] tw:mb-[1.5rem]
    `,
    'quiz-result__badge--conservador': String.raw`
        tw:[&.quiz-result\_\_badge--conservador]:[background:#10b981]
        tw:[&.quiz-result\_\_badge--conservador]:[color:white]
    `,
    'quiz-result__badge--moderado': String.raw`
        tw:[&.quiz-result\_\_badge--moderado]:[background:#3b82f6]
        tw:[&.quiz-result\_\_badge--moderado]:[color:white]
    `,
    'quiz-result__badge--agresivo': String.raw`
        tw:[&.quiz-result\_\_badge--agresivo]:[background:#ef4444]
        tw:[&.quiz-result\_\_badge--agresivo]:[color:white]
    `,
    'quiz-result__title': String.raw`
        tw:text-[length:2.5rem] tw:[font-weight:800] tw:mb-[1rem]
        tw:[@media(max-width:600px)]:[&&]:text-[length:1.75rem]
    `,
    'quiz-result__desc': String.raw`
        tw:text-[length:1.1rem] tw:text-secondary tw:mb-[2.5rem] tw:[line-height:1.6]
    `,
    'quiz-result__actions': String.raw`
        tw:flex tw:gap-[1rem] tw:justify-center tw:[@media(max-width:600px)]:[&&]:flex-col
    `,
    'button--secondary': String.raw`
        tw:[&.button--secondary]:ui-fill-muted tw:[&.button--secondary]:text-main
        tw:[&.button--secondary:hover]:[background:var(--border-color)]
    `,
    'suggested-portfolio': String.raw`
        tw:mt-[3rem] tw:pt-[3rem] tw:[border-top:1px_solid_var(--border-color)] tw:text-left
        tw:[&_h3]:text-[length:1.25rem] tw:[&_h3]:mb-[1.5rem] tw:[&_h3]:ui-row tw:[&_h3]:gap-[0.75rem]
    `,
    'portfolio-preview': String.raw`
        tw:ui-fill-muted tw:p-[1.5rem] tw:rounded-[16px] tw:ui-row tw:justify-between
    `,
    'portfolio-preview__info': String.raw`
        tw:ui-stack tw:gap-[0.5rem]
    `,
    'portfolio-preview__label': String.raw`
        tw:text-[length:0.85rem] tw:text-muted tw:[font-weight:600] tw:[text-transform:uppercase]
    `,
    'portfolio-preview__value': String.raw`
        tw:text-[length:1.25rem] tw:[font-weight:700] tw:text-accent
    `,
} as const;
export function quizStyle(part: keyof typeof styles) { return cn(part, styles[part]); }
