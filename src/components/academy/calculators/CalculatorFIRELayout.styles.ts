import { cn } from '../../../utils/cn';

const styles = {
    fire__grid: String.raw`
        tw:grid tw:grid-cols-[350px_1fr] tw:gap-[2.5rem] tw:mb-[3rem] tw:[@media(max-width:1024px)]:grid-cols-[1fr]
    `,
    'fire__input-grid': String.raw`
        tw:grid tw:grid-cols-[1fr_1fr] tw:gap-[1.5rem]
    `,
    fire__metrics: String.raw`
        tw:grid tw:grid-cols-[repeat(3,_1fr)] tw:gap-[1.25rem] tw:mb-[2rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'fire__theory-grid': String.raw`
        tw:grid tw:grid-cols-[repeat(3,_1fr)] tw:gap-[1.5rem] tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
    'fire__projection-toggle': String.raw`
        tw:grid tw:grid-cols-[repeat(2,_minmax(0,_1fr))] tw:gap-[0.75rem]
        tw:[@media(max-width:768px)]:grid-cols-[1fr]
    `,
} as const;
export function fireLayoutStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
