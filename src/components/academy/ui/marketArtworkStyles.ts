import { cn } from '../../../utils/cn';
const styles = {
    'market-heatmap': String.raw`
        tw:w-full tw:grid tw:gap-[1.25rem] tw:[&_.is-positive]:[color:#34d399] tw:[&_.is-negative]:[color:#f87171]
    `,
    'market-heatmap__refresh-icon--spinning': String.raw`
        tw:[animation:marketHeatmapSpin_0.9s_linear_infinite]
        tw:[@media(prefers-reduced-motion:reduce)]:[animation-duration:1.8s]
    `,
    'market-heatmap__sector-label-layer': String.raw`
        tw:absolute tw:inset-[0] tw:z-[2] tw:pointer-events-none
    `,
    'market-heatmap__tile': String.raw`
        tw:cursor-pointer tw:[&_rect]:[transition:filter_var(--transition-fast),_opacity_var(--transition-fast)]
        tw:[&:hover_rect]:[filter:brightness(1.16)]
        tw:[@media(prefers-reduced-motion:reduce)]:[&_rect]:[transition:none]
    `,
    'market-heatmap__sector-group': String.raw`
        tw:[&_rect]:pointer-events-none
    `,
    'market-heatmap__sector-label': String.raw`
        tw:absolute tw:block tw:overflow-hidden tw:p-[0.28rem_0.45rem]
        tw:[border:1px_solid_rgba(255,_255,_255,_0.22)] tw:rounded-[5px] tw:[color:rgba(255,_255,_255,_0.92)]
        tw:[background:rgba(17,_24,_39,_0.82)] tw:[box-shadow:0_2px_8px_rgba(0,_0,_0,_0.16)] tw:font-sans
        tw:text-[length:0.62rem] tw:[font-weight:800] tw:[letter-spacing:0.04em] tw:[line-height:1.2]
        tw:text-ellipsis tw:whitespace-nowrap tw:[text-transform:uppercase]
    `,
    'market-heatmap__tile-symbol': String.raw`
        tw:[fill:#fff] tw:font-sans tw:text-[length:13px] tw:[font-weight:800]
    `,
    'market-heatmap__tile-change': String.raw`
        tw:[fill:#fff] tw:font-sans tw:text-[length:11px] tw:[font-weight:700]
    `,
    'market-heatmap__tile-name': String.raw`
        tw:[fill:#fff] tw:font-sans tw:[fill:rgba(255,_255,_255,_0.76)] tw:text-[length:9px] tw:[font-weight:500]
    `,
} as const;
export type marketArtworkStylePart = keyof typeof styles;
export function marketArtworkStyle(part: marketArtworkStylePart, className?: string) {
    return cn(part, styles[part], className);
}
export function marketArtworkStyleClasses(className?: string) {
    if (!className) return className;
    let changed = false;
    const resolved = className.split(/\s+/).map((part) => {
        if (Object.hasOwn(styles, part)) {
            changed = true;
            return [part, styles[part as marketArtworkStylePart]];
        }
        return part;
    });
    return changed ? cn(resolved) : className;
}
