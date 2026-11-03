import { cn } from '../../utils/cn';
const styles = {
    academy__content: String.raw`
        tw:[&_>_*_>_.academy-page-header]:mb-[1.4rem] tw:[&_>_*_>_.academy-page-header]:p-[3.75rem_2rem_2rem]
        tw:[&_>_*_>_.academy-page-header]:ui-border tw:[&_>_*_>_.academy-page-header]:rounded-[18px]
        tw:[&_>_*_>_.academy-page-header]:[background:radial-gradient(circle_at_10%_10%,_rgba(16,_185,_129,_0.14),_transparent_45%),_radial-gradient(circle_at_90%_20%,_rgba(59,_130,_246,_0.14),_transparent_42%),_var(--bg-secondary)]
        tw:[&_>_*_>_.academy-page-header]:text-left tw:[&_>_*_>_.academy-page-header_h1]:max-w-[820px]
        tw:[&_>_*_>_.academy-page-header_h1]:m-[0_0_.65rem]
        tw:[&_>_*_>_.academy-page-header_h1]:text-[length:clamp(1.6rem,_2.3vw,_2.35rem)]
        tw:[&_>_*_>_.academy-page-header_h1]:[line-height:1.2] tw:[&_>_*_>_.academy-page-header_h1]:text-left
        tw:[&_>_*_>_.academy-page-header_p]:max-w-[820px] tw:[&_>_*_>_.academy-page-header_p]:m-[0]
        tw:[&_>_*_>_.academy-page-header_p]:[line-height:1.7] tw:[&_>_*_>_.academy-page-header_p]:text-left
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header]:mb-[.75rem]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header]:p-[3.15rem_1.25rem_1.25rem]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header]:rounded-[14px]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header_h1]:mb-[.45rem]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header_h1]:text-[length:1.35rem]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header_h1]:[line-height:1.22]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header_p]:text-[length:.9rem]
        tw:[@media(max-width:640px)]:[&_>_*_>_.academy-page-header_p]:[line-height:1.55]
    `,
    'academy-page-header': String.raw`
        tw:[.market-heatmap_>_&]:mb-[1.4rem] tw:[.market-heatmap_>_&]:p-[3.75rem_2rem_2rem]
        tw:[.market-heatmap_>_&]:ui-border tw:[.market-heatmap_>_&]:rounded-[18px]
        tw:[.market-heatmap_>_&]:[background:radial-gradient(circle_at_10%_10%,_rgba(16,_185,_129,_0.14),_transparent_45%),_radial-gradient(circle_at_90%_20%,_rgba(59,_130,_246,_0.14),_transparent_42%),_var(--bg-secondary)]
        tw:[.market-heatmap_>_&]:text-left tw:[.market-heatmap_>_&]:mb-[0] tw:[.market-heatmap_>_&_h1]:max-w-[820px]
        tw:[.market-heatmap_>_&_h1]:m-[0_0_.65rem]
        tw:[.market-heatmap_>_&_h1]:text-[length:clamp(1.6rem,_2.3vw,_2.35rem)]
        tw:[.market-heatmap_>_&_h1]:[line-height:1.2] tw:[.market-heatmap_>_&_h1]:text-left
        tw:[.market-heatmap_>_&_p]:max-w-[820px] tw:[.market-heatmap_>_&_p]:m-[0]
        tw:[.market-heatmap_>_&_p]:[line-height:1.7] tw:[.market-heatmap_>_&_p]:text-left
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&]:mb-[.75rem]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&]:p-[3.15rem_1.25rem_1.25rem]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&]:rounded-[14px]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&_h1]:mb-[.45rem]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&_h1]:text-[length:1.35rem]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&_h1]:[line-height:1.22]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&_p]:text-[length:.9rem]
        tw:[@media(max-width:640px)]:[.market-heatmap_>_&_p]:[line-height:1.55]
    `,
    'market-heatmap': String.raw``,
} as const;
export function AcademyPageHeaderDetailStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
