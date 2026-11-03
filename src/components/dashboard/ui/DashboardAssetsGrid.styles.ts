import { cn } from '../../../utils/cn';

const styles = {
    'assets-table__wrapper': String.raw`
        tw:overflow-x-auto tw:m-[0_calc(-1_*_var(--spacing-lg))] tw:p-[0_var(--spacing-lg)]
        tw:[@media(max-width:640px)]:[&&]:overflow-visible
        tw:[@media(max-width:640px)]:[&&]:m-[0_calc(-1_*_var(--spacing-md))]
        tw:[@media(max-width:640px)]:[&&]:p-[0_var(--spacing-md)]
    `,
    'assets-table__table': String.raw`
        tw:w-full tw:border-collapse tw:min-w-[700px] tw:[&_th]:text-left
        tw:[&_th]:p-[var(--spacing-sm)_var(--spacing-md)] tw:[&_th]:text-[length:var(--font-size-xs)]
        tw:[&_th]:[font-weight:600] tw:[&_th]:text-muted tw:[&_th]:[text-transform:uppercase]
        tw:[&_th]:[letter-spacing:0.5px] tw:[&_th]:[border-bottom:1px_solid_var(--border-primary)]
        tw:[&_th]:whitespace-nowrap tw:[&_th]:cursor-pointer tw:[&_th]:[user-select:none]
        tw:[&_th]:[transition:color_var(--transition-fast)] tw:[&_th:hover]:text-main tw:[&_td]:p-ui-md
        tw:[&_td]:[border-bottom:1px_solid_var(--border-primary)] tw:[&_td]:text-[length:var(--font-size-sm)]
        tw:[&_tbody_tr]:[transition:background_var(--transition-fast)] tw:[&_tbody_tr:hover]:ui-fill-muted
        tw:[&_tr:last-child_td]:[border-bottom:none] tw:[@media(max-width:640px)]:[&&]:block
        tw:[@media(max-width:640px)]:[&&]:min-w-[0] tw:[@media(max-width:640px)]:[&&_thead]:block
        tw:[@media(max-width:640px)]:[&&_tbody]:block tw:[@media(max-width:640px)]:[&&_thead_tr]:grid
        tw:[@media(max-width:640px)]:[&&_thead_tr]:grid-cols-[minmax(0,_1.45fr)_minmax(68px,_.85fr)_minmax(72px,_.9fr)_minmax(78px,_1fr)]
        tw:[@media(max-width:640px)]:[&&_thead_tr]:w-full tw:[@media(max-width:640px)]:[&&_tbody_tr]:grid
        tw:[@media(max-width:640px)]:[&&_tbody_tr]:grid-cols-[minmax(0,_1.45fr)_minmax(68px,_.85fr)_minmax(72px,_.9fr)_minmax(78px,_1fr)]
        tw:[@media(max-width:640px)]:[&&_tbody_tr]:w-full tw:[@media(max-width:640px)]:[&&_th]:min-w-[0]
        tw:[@media(max-width:640px)]:[&&_th]:p-[var(--spacing-sm)_.2rem]
        tw:[@media(max-width:640px)]:[&&_th]:text-[length:.7rem] tw:[@media(max-width:640px)]:[&&_td]:min-w-[0]
        tw:[@media(max-width:640px)]:[&&_td]:p-[var(--spacing-sm)_.2rem]
        tw:[@media(max-width:640px)]:[&&_td]:text-[length:.7rem]
        tw:[@media(max-width:640px)]:[&&_th]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&_th]:[line-height:1.2]
        tw:[@media(max-width:640px)]:[&&_td]:[border-bottom:none]
        tw:[@media(max-width:640px)]:[&&_td]:[vertical-align:top]
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_optional]:hidden
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions-header]:hidden
        tw:[@media(max-width:640px)]:[&&_tbody_tr]:[border-bottom:1px_solid_var(--border-primary)]
        tw:[@media(max-width:640px)]:[&&_tbody_tr:last-child]:[border-bottom:none]
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_mobile-details-cell]:col-span-full
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_mobile-details-cell]:hidden
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_mobile-details-cell]:pt-[0]
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_mobile-details-cell]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions-cell]:col-span-full
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions-cell]:hidden
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions-cell]:pt-[0]
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions-cell]:whitespace-normal
    `,
    'assets-table__table--show-details': String.raw`
        tw:[@media(max-width:640px)]:[&&_thead_tr]:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:640px)]:[&&_tbody_tr]:grid-cols-[repeat(3,_minmax(0,_1fr))]
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_column--asset]:col-span-full
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_name]:whitespace-normal
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_name]:overflow-visible
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_name]:text-clip
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_name]:wrap-anywhere
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_name]:w-full
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_mobile-details-cell]:block
    `,
    'assets-table__table--show-actions': String.raw`
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions-cell]:block
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions]:flex
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions]:mt-ui-xs
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions]:pt-ui-xs
        tw:[@media(max-width:640px)]:[&&_.assets-table\_\_actions]:[border-top:1px_solid_var(--border-primary)]
    `,
    'assets-table__lot-row': String.raw`
        tw:ui-fill-surface tw:[&_.assets-table\_\_asset]:pl-[.8rem]
        tw:[&_.assets-table\_\_asset]:[border-left:2px_solid_var(--border-primary)]
    `,
    'clickable-row': String.raw`
        tw:cursor-pointer tw:[transition:background-color_0.2s]
        tw:[&:hover]:[background-color:rgba(255,_255,_255,_0.03)]
    `,
    'assets-table__filters': String.raw`
        tw:flex tw:gap-[1rem] tw:flex-wrap tw:[align-items:end] tw:mb-[1rem] tw:[&_>_div:first-child]:grow-[2]
    `,
    'assets-table__filter-count': String.raw`
        tw:text-[length:var(--font-size-sm)] tw:text-secondary tw:mb-[1rem]
    `,
    'assets-table__column--price': String.raw`
        tw:[&.assets-table\_\_column--price]:text-right tw:[&.assets-table\_\_column--price]:whitespace-nowrap
    `,
    'assets-table__column--today': String.raw`
        tw:[&.assets-table\_\_column--today]:text-right tw:[&.assets-table\_\_column--today]:whitespace-nowrap
    `,
    'assets-table__column--value': String.raw`
        tw:[&.assets-table\_\_column--value]:text-right tw:[&.assets-table\_\_column--value]:whitespace-nowrap
    `,
    'assets-table__column--gain': String.raw`
        tw:[&.assets-table\_\_column--gain]:text-right tw:[&.assets-table\_\_column--gain]:whitespace-nowrap
    `,
    'sort-icon': String.raw`
        tw:inline-block tw:[vertical-align:middle] tw:ml-ui-xs tw:opacity-[0.5]
    `,
    'sort-icon--active': String.raw`
        tw:[&.sort-icon--active]:opacity-[1] tw:[&.sort-icon--active]:text-accent
    `,
    'assets-table__value': String.raw`
        tw:[font-weight:600] tw:text-main
    `,
    'assets-table__empty': String.raw`
        tw:text-center tw:text-muted tw:p-ui-xl
    `,
    'assets-table__actions': String.raw`
        tw:flex tw:gap-ui-xs tw:justify-end tw:[@media(max-width:640px)]:[&&]:gap-[12px]
        tw:[@media(max-width:640px)]:[&&]:flex-wrap tw:[@media(max-width:640px)]:[&&_.btn]:w-[44px]
        tw:[@media(max-width:640px)]:[&&_.btn]:min-w-[44px] tw:[@media(max-width:640px)]:[&&_.btn]:min-h-[44px]
        tw:[@media(max-width:640px)]:[&&_.btn]:p-[0]
    `,
    'assets-table__actions-header': String.raw`
        tw:text-right tw:whitespace-nowrap
    `,
    'assets-table__actions-cell': String.raw`
        tw:text-right tw:whitespace-nowrap
    `,
    'assets-table__mobile-details-cell': String.raw`
        tw:hidden
    `,
    'assets-table__mobile-toolbar': String.raw`
        tw:hidden tw:[@media(max-width:640px)]:[&&]:ui-row tw:[@media(max-width:640px)]:[&&]:gap-[10px]
        tw:[@media(max-width:640px)]:[&&]:flex-wrap tw:[@media(max-width:640px)]:[&&]:justify-end
        tw:[@media(max-width:640px)]:[&&_.btn]:min-h-[44px]
        tw:[@media(max-width:640px)]:[&&_.btn]:p-[var(--spacing-xs)_var(--spacing-sm)]
        tw:[@media(max-width:640px)]:[&&_.btn]:text-[length:var(--font-size-xs)]
        tw:[@media(max-width:640px)]:[&&_.btn]:whitespace-nowrap
    `,
    'assets-table__delete-btn': String.raw`
        tw:[&:hover]:[color:var(--color-negative)]!
    `,
    'assets-table__estimated': String.raw`
        tw:block tw:text-[length:.7rem] tw:[font-weight:500] tw:text-secondary
    `,
} as const;
export function assetsGridStyle(part: keyof typeof styles) {
    return cn(part, styles[part]);
}
