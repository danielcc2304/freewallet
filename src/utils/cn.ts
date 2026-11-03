import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const merge = extendTailwindMerge({ prefix: 'tw', extend: { theme: {
    spacing: ['ui-xs', 'ui-sm', 'ui-md', 'ui-lg', 'ui-xl'],
    radius: ['control', 'panel', 'dialog'],
    shadow: ['ui-sm', 'ui-md', 'ui-lg', 'glow'],
}, classGroups: { 'bg-image': [{ bg: ['page-header'] }] } } });

/** Consumer utilities override defaults without dropping legacy behavior hooks. */
export function cn(...values: ClassValue[]): string {
    return merge(clsx(values));
}
